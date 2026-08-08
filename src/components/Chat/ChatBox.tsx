import React from 'react';
import { db, auth } from '../../firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  updateDoc,
  doc,
  getDoc,
  deleteDoc
} from 'firebase/firestore';
import { 
  Send, User, ShieldAlert, Loader2, ArrowLeft, MessageCircle, Pencil, Trash2, Check, X, Pin,
  Phone, Video, Mic, Paperclip, Play, Pause, Image, PhoneOff, Camera, MicOff, Volume2, VolumeX,
  Plus, CheckCheck, Smile, Download, Maximize2, Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  detectContactSharing, 
  detectMultiMessageContactSharing, 
  CONTACT_WARNING_MESSAGE, 
  filterContent, 
  hasSensitiveContent 
} from '../../lib/contentFilter';
import { logBlockedAttempt } from '../../lib/moderationLogger';
import { handleFirestoreError, OperationType } from '../../lib/firebase-errors';
import { cn } from '../../lib/utils';

interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: any;
  isFiltered?: boolean;
  isEdited?: boolean;
  mediaType?: 'text' | 'image' | 'voice' | 'call';
  mediaUrl?: string;
  mediaDuration?: string;
  callType?: 'voice' | 'video';
  callStatus?: 'missed' | 'completed' | 'declined';
}

interface ChatBoxProps {
  chatId: string;
  recipientId: string;
  recipientName: string;
  onBack?: () => void;
}

// Extract initials
function getInitials(name: string) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0][0].toUpperCase();
}

// Generate premium vibrant background gradient for each avatar
function getAvatarBg(name: string) {
  const customGradients = [
    'from-orange-500 to-amber-500 text-orange-50',
    'from-pink-500 to-rose-500 text-rose-50',
    'from-purple-500 to-indigo-500 text-indigo-50',
    'from-blue-500 to-sky-500 text-sky-50',
    'from-teal-500 to-emerald-500 text-emerald-50',
    'from-fuchsia-500 to-purple-650 text-fuchsia-50',
    'from-violet-500 to-purple-500 text-violet-50',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % customGradients.length;
  return customGradients[index];
}

// Formats date separators beautifully
function formatDateSeparator(dateObj: any) {
  if (!dateObj) return '';
  const date = dateObj.toDate ? dateObj.toDate() : new Date(dateObj);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return "Today";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  }
}

export default function ChatBox({ chatId, recipientId, recipientName, onBack }: ChatBoxProps) {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [newMessage, setNewMessage] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [sending, setSending] = React.useState(false);
  const [showWarning, setShowWarning] = React.useState(false);
  const [warningText, setWarningText] = React.useState<string>(CONTACT_WARNING_MESSAGE);
  const [scanningImage, setScanningImage] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const [editingMessageId, setEditingMessageId] = React.useState<string | null>(null);
  const [editingText, setEditingText] = React.useState('');
  const [savingEdit, setSavingEdit] = React.useState(false);
  const [deletingMessageId, setDeletingMessageId] = React.useState<string | null>(null);

  // Active call simulation state
  const [activeCall, setActiveCall] = React.useState<{ type: 'voice' | 'video'; status: 'calling' | 'connected' } | null>(null);
  const [callDuration, setCallDuration] = React.useState(0);
  const [isMuted, setIsMuted] = React.useState(false);
  const [isVideoOff, setIsVideoOff] = React.useState(false);
  const callTimerRef = React.useRef<any>(null);

  // Video calling local stream state
  const localVideoRef = React.useRef<HTMLVideoElement | null>(null);
  const [localStream, setLocalStream] = React.useState<MediaStream | null>(null);

  // Picture sharing state
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Full screen picture viewer Lightbox
  const [lightboxImage, setLightboxImage] = React.useState<string | null>(null);

  // Voice playback rate states
  const [playingAudioId, setPlayingAudioId] = React.useState<string | null>(null);
  const [audioProgress, setAudioProgress] = React.useState<Record<string, number>>({});
  const [playbackSpeed, setPlaybackSpeed] = React.useState<Record<string, number>>({});
  const audioIntervalRef = React.useRef<any>(null);

  // Recipient Settings Profile Photo State
  const [recipientPhotoURL, setRecipientPhotoURL] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!recipientId) return;
    const fetchRecipientPhoto = async () => {
      try {
        const userSnap = await getDoc(doc(db, 'users', recipientId));
        if (userSnap.exists()) {
          setRecipientPhotoURL(userSnap.data().photoURL || null);
        }
      } catch (e) {
        console.error("Error fetching recipient photo:", e);
      }
    };
    fetchRecipientPhoto();
  }, [recipientId]);

  // Message long press & context menu state/timers
  const [activeMenuMessage, setActiveMenuMessage] = React.useState<Message | null>(null);
  const [menuPosition, setMenuPosition] = React.useState<{ x: number, y: number } | null>(null);
  const longPressTimerRef = React.useRef<any>(null);

  const handleStartLongPress = (msg: Message, e: React.MouseEvent | React.TouchEvent) => {
    if (editingMessageId || deletingMessageId) return;

    // Get touch coordinates if touch event
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }

    longPressTimerRef.current = setTimeout(() => {
      // It's a long press!
      setActiveMenuMessage(msg);
      // Clamp values so menu doesn't overflow screen boundaries
      const xPos = Math.max(10, Math.min(clientX, window.innerWidth - 180));
      const yPos = Math.max(10, Math.min(clientY, window.innerHeight - 155));
      setMenuPosition({ x: xPos, y: yPos });

      if (navigator.vibrate) {
        navigator.vibrate(40);
      }
    }, 500);
  };

  const handleEndLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleTouchMove = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleContextMenu = (msg: Message, e: React.MouseEvent) => {
    e.preventDefault();
    if (editingMessageId || deletingMessageId) return;
    setActiveMenuMessage(msg);
    const xPos = Math.max(10, Math.min(e.clientX, window.innerWidth - 180));
    const yPos = Math.max(10, Math.min(e.clientY, window.innerHeight - 155));
    setMenuPosition({ x: xPos, y: yPos });
  };

  const handleStartEdit = (msg: Message) => {
    setEditingMessageId(msg.id);
    setEditingText(msg.text);
    setDeletingMessageId(null);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingText('');
  };

  const handleSaveEdit = async (messageId: string) => {
    if (!editingText.trim() || savingEdit) return;

    const currentUserId = auth.currentUser?.uid || 'anonymous';
    const senderName = auth.currentUser?.displayName || 'User';

    const senderRecentMessages = messages
      .filter(m => m.senderId === currentUserId && m.id !== messageId && m.text && m.mediaType !== 'call')
      .map(m => m.text);

    const localDetection = detectMultiMessageContactSharing(editingText, senderRecentMessages);
    if (localDetection.isBlocked) {
      setWarningText(CONTACT_WARNING_MESSAGE);
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 5000);

      await logBlockedAttempt({
        senderId: currentUserId,
        senderName,
        recipientId,
        chatId,
        messageType: 'text',
        contentSnippet: editingText,
        detectedTypes: localDetection.detectedTypes,
        reason: localDetection.reason || 'Contact information detected during edit',
        status: 'blocked'
      });

      return;
    }

    setSavingEdit(true);
    const textToSend = editingText;

    try {
      const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
      await updateDoc(messageRef, {
        text: textToSend,
        isEdited: true,
        updatedAt: serverTimestamp()
      });

      // Update chat last message if this edited message is the last one
      const isLastMessage = messages[messages.length - 1]?.id === messageId;
      if (isLastMessage) {
        await updateDoc(doc(db, 'chats', chatId), {
          lastMessage: textToSend,
          lastMessageAt: serverTimestamp()
        });
      }

      setEditingMessageId(null);
      setEditingText('');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `chats/${chatId}/messages/${messageId}`);
    } finally {
      setSavingEdit(false);
    }
  };

  const confirmDeleteMessage = async (messageId: string) => {
    try {
      const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
      const isLastMessage = messages[messages.length - 1]?.id === messageId;

      await deleteDoc(messageRef);

      if (isLastMessage) {
        const previousMessage = messages[messages.length - 2];
        await updateDoc(doc(db, 'chats', chatId), {
          lastMessage: previousMessage ? previousMessage.text : 'Message deleted',
          lastMessageAt: previousMessage ? previousMessage.createdAt : serverTimestamp()
        });
      }
      setDeletingMessageId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `chats/${chatId}/messages/${messageId}`);
    }
  };

  React.useEffect(() => {
    if (!chatId) return;

    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
      setLoading(false);
      
      // Auto scroll to bottom
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `chats/${chatId}/messages`);
    });

    return () => unsubscribe();
  }, [chatId]);

  // Handle call timer and local media stream for Video Call
  React.useEffect(() => {
    if (activeCall && activeCall.status === 'connected') {
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

      // Try to launch User Camera if video call
      if (activeCall.type === 'video' && !isVideoOff) {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          .then((stream) => {
            setLocalStream(stream);
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
            }
          })
          .catch((err) => {
            console.warn("Could not start user video stream:", err);
          });
      }
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
      stopCamera();
    }
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      stopCamera();
    };
  }, [activeCall, isVideoOff]);

  const stopCamera = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
  };

  const handleStartCall = (type: 'voice' | 'video') => {
    setActiveCall({ type, status: 'calling' });
    setCallDuration(0);

    // Simulate auto connect after 2 seconds
    setTimeout(() => {
      setActiveCall(prev => prev ? { ...prev, status: 'connected' } : null);
    }, 2000);
  };

  const handleEndCall = async (status: 'completed' | 'declined' | 'missed' = 'completed') => {
    if (!activeCall) return;

    const currentUserId = auth.currentUser?.uid;
    if (currentUserId && chatId) {
      const durationStr = formatTime(callDuration);
      const text = activeCall.type === 'voice' 
        ? `📞 Voice Call - ${status === 'completed' ? `Finished (${durationStr})` : status === 'declined' ? 'Declined' : 'Missed'}`
        : `📹 Video Call - ${status === 'completed' ? `Finished (${durationStr})` : status === 'declined' ? 'Declined' : 'Missed'}`;

      try {
        await addDoc(collection(db, 'chats', chatId, 'messages'), {
          senderId: currentUserId,
          text,
          mediaType: 'call',
          callType: activeCall.type,
          callStatus: status,
          mediaDuration: durationStr,
          createdAt: serverTimestamp(),
        });

        await updateDoc(doc(db, 'chats', chatId), {
          lastMessage: text,
          lastMessageAt: serverTimestamp(),
        });
      } catch (e) {
        console.error("Error creating call log message:", e);
      }
    }

    setActiveCall(null);
    setCallDuration(0);
    setIsMuted(false);
    setIsVideoOff(false);
    stopCamera();
  };

  // Picture sharing handlers
  const handleTriggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result as string;
      const currentUserId = auth.currentUser?.uid || 'anonymous';
      const senderName = auth.currentUser?.displayName || 'User';

      setScanningImage(true);

      try {
        const res = await fetch('/api/moderate-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: base64Data,
            senderId: currentUserId
          })
        });

        const data = await res.json();
        if (data.isBlocked) {
          setWarningText(data.warningMessage || CONTACT_WARNING_MESSAGE);
          setShowWarning(true);
          setTimeout(() => setShowWarning(false), 5000);

          await logBlockedAttempt({
            senderId: currentUserId,
            senderName,
            recipientId,
            chatId,
            messageType: 'image',
            contentSnippet: '[Image attachment containing contact details]',
            detectedTypes: data.detectedTypes || ['ocr_contact_info'],
            reason: data.reason || 'Contact information detected in image OCR scan',
            status: 'blocked'
          });

          setSelectedImage(null);
          setScanningImage(false);
          return;
        }

        setSelectedImage(base64Data);
      } catch (err) {
        console.warn("OCR image scan error, proceeding with attachment:", err);
        setSelectedImage(base64Data);
      } finally {
        setScanningImage(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveSelectedImage = () => {
    setSelectedImage(null);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedImage) || sending || scanningImage) return;

    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId) return;

    const senderName = auth.currentUser?.displayName || 'User';

    // Buyer safety policy: a buyer can initiate, but must wait for response to continue
    try {
      const userSnap = await getDoc(doc(db, 'users', currentUserId));
      const userData = userSnap.data();
      const isBuyer = userData?.role === 'buyer';

      if (isBuyer) {
        const hasSellerMessage = messages.some(msg => msg.senderId === recipientId);
        const hasMyMessage = messages.some(msg => msg.senderId === currentUserId);
        
        if (!hasSellerMessage && hasMyMessage) {
          alert("As a buyer, you can initiate a chat, but please wait for the seller to respond before sending more messages inside this thread.");
          return;
        }
      }
    } catch (err) {
      console.error("Error checking user role for chat restriction:", err);
    }

    // 1. Local Regex, Bank Account & Multi-Message Sequential Contact Protection Check
    if (newMessage.trim()) {
      const senderRecentMessages = messages
        .filter(m => m.senderId === currentUserId && m.text && m.mediaType !== 'call')
        .map(m => m.text);

      const localDetection = detectMultiMessageContactSharing(newMessage, senderRecentMessages);
      if (localDetection.isBlocked) {
        setWarningText(CONTACT_WARNING_MESSAGE);
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 5000);

        await logBlockedAttempt({
          senderId: currentUserId,
          senderName,
          recipientId,
          chatId,
          messageType: 'text',
          contentSnippet: newMessage,
          detectedTypes: localDetection.detectedTypes,
          reason: localDetection.reason || 'Contact/bank information or split digit sequence detected',
          status: 'blocked'
        });

        return;
      }

      // 2. AI Server-Side Moderation Check with Message History Context
      try {
        const modRes = await fetch('/api/moderate-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: newMessage,
            senderId: currentUserId,
            historyMessages: senderRecentMessages.slice(-10)
          })
        });

        const modData = await modRes.json();
        if (modData.isBlocked) {
          setWarningText(modData.warningMessage || CONTACT_WARNING_MESSAGE);
          setShowWarning(true);
          setTimeout(() => setShowWarning(false), 5000);

          await logBlockedAttempt({
            senderId: currentUserId,
            senderName,
            recipientId,
            chatId,
            messageType: 'text',
            contentSnippet: newMessage,
            detectedTypes: modData.detectedTypes || ['disguised_contact_attempt'],
            reason: modData.reason || 'Disguised contact attempt detected by AI',
            status: 'blocked'
          });

          return;
        }
      } catch (err) {
        console.warn("AI chat moderation error:", err);
      }
    }

    setSending(true);
    const textToSend = newMessage.trim();

    try {
      if (selectedImage) {
        // Send as photo message
        await addDoc(collection(db, 'chats', chatId, 'messages'), {
          senderId: currentUserId,
          text: textToSend || '📷 Photo',
          mediaType: 'image',
          mediaUrl: selectedImage,
          createdAt: serverTimestamp(),
        });

        await updateDoc(doc(db, 'chats', chatId), {
          lastMessage: textToSend ? `📷 Photo: ${textToSend}` : '📷 Photo',
          lastMessageAt: serverTimestamp(),
          [`unreadCount.${recipientId}`]: (await getUnreadCount(chatId, recipientId)) + 1
        });

        setSelectedImage(null);
        setNewMessage('');
      } else {
        // Standard text message
        await addDoc(collection(db, 'chats', chatId, 'messages'), {
          senderId: currentUserId,
          text: textToSend,
          createdAt: serverTimestamp(),
        });

        await updateDoc(doc(db, 'chats', chatId), {
          lastMessage: textToSend,
          lastMessageAt: serverTimestamp(),
          [`unreadCount.${recipientId}`]: (await getUnreadCount(chatId, recipientId)) + 1
        });

        setNewMessage('');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `chats/${chatId}/messages`);
    } finally {
      setSending(false);
    }
  };

  const getUnreadCount = async (cid: string, uid: string) => {
    try {
      const snap = await getDoc(doc(db, 'chats', cid));
      if (snap.exists()) {
        const data = snap.data();
        return data.unreadCount?.[uid] || 0;
      }
    } catch (e) {}
    return 0;
  };

  // Simulating Voice Playback ticks
  const handleToggleAudio = (msgId: string) => {
    if (playingAudioId === msgId) {
      setPlayingAudioId(null);
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
        audioIntervalRef.current = null;
      }
    } else {
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
      }
      setPlayingAudioId(msgId);
      
      const speed = playbackSpeed[msgId] || 1;
      audioIntervalRef.current = setInterval(() => {
        setAudioProgress(prev => {
          const current = prev[msgId] || 0;
          if (current >= 100) {
            setPlayingAudioId(null);
            if (audioIntervalRef.current) {
              clearInterval(audioIntervalRef.current);
              audioIntervalRef.current = null;
            }
            return { ...prev, [msgId]: 0 };
          }
          return { ...prev, [msgId]: current + (4 * speed) };
        });
      }, 100);
    }
  };

  const togglePlaybackSpeed = (msgId: string) => {
    setPlaybackSpeed(prev => {
      const current = prev[msgId] || 1;
      const next = current === 1 ? 1.5 : current === 1.5 ? 2 : 1;
      return { ...prev, [msgId]: next };
    });
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
      {/* Invisible file input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageSelect} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Chat Header (Standard style with orange accents) */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-10 font-sans shadow-sm shrink-0 select-none">
        <div className="flex items-center gap-2">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-850 rounded-xl transition-colors md:hidden cursor-pointer"
              title="Return to message list"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-zinc-300" />
            </button>
          )}

          {/* User initials colored avatar */}
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center text-xs font-black shadow-inner tracking-wide shrink-0 select-none border border-white/20 overflow-hidden",
            recipientPhotoURL ? "bg-slate-100" : cn("bg-gradient-to-tr", getAvatarBg(recipientName))
          )}>
            {recipientPhotoURL ? (
              <img src={recipientPhotoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              getInitials(recipientName)
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-zinc-100 truncate max-w-[130px] sm:max-w-[180px]">{recipientName}</h3>
            <p className="text-[9px] text-[#ff6b00] font-bold uppercase tracking-widest flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff6b00] shrink-0 select-none inline-block animate-pulse" />
              <span>Online Trade Support</span>
            </p>
          </div>
        </div>

        {/* Removed voice and video call buttons as requested */}
        <div className="w-1" />
      </div>

      {/* Messages Scroll List Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 scroll-smooth bg-slate-50 dark:bg-slate-950 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px]"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-2.5">
            <Loader2 className="w-6 h-6 text-[#ff6b00] animate-spin" />
            <span className="text-[10px] font-mono text-slate-400">Loading chat history...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 select-none">
            <div className="w-16 h-16 bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center text-slate-400 mb-4 border border-slate-200/50 dark:border-zinc-850 shadow-md">
              <MessageCircle className="w-7 h-7 text-[#ff6b00] animate-bounce" />
            </div>
            <p className="text-xs font-semibold text-slate-600 dark:text-zinc-400">Secure end-to-end peer-to-peer trade discussion</p>
            <p className="text-[10px] text-zinc-500 mt-1 max-w-[210px]">Your conversations are protected. Begin discussing your trade safely here.</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = msg.senderId === auth.currentUser?.uid;
            const isEditing = editingMessageId === msg.id;
            const isDeleting = deletingMessageId === msg.id;

            // Date separator calculation logic
            const previousMsg = index > 0 ? messages[index - 1] : null;
            const showDateHeader = !previousMsg || formatDateSeparator(msg.createdAt) !== formatDateSeparator(previousMsg.createdAt);

            return (
              <React.Fragment key={`frag-msg-${msg.id}-${index}`}>
                {showDateHeader && msg.createdAt && (
                  <div className="flex items-center justify-center my-6 opacity-85 select-none animate-in fade-in zoom-in-95 duration-150">
                    <span className="px-3.5 py-1 bg-white/90 dark:bg-zinc-900/90 border border-slate-150 dark:border-zinc-800 text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-zinc-400 rounded-lg shadow-sm font-sans">
                      {formatDateSeparator(msg.createdAt)}
                    </span>
                  </div>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={cn(
                    "flex flex-col max-w-[85%] sm:max-w-[75%] group relative",
                    isMe ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div className="flex items-end gap-1.5 w-full relative">
                    {/* Hover edits */}
                    {isMe && !isEditing && !isDeleting && (
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 p-0.5 bg-white dark:bg-zinc-900 rounded-lg border border-slate-200 dark:border-zinc-800 shadow-sm grow-0 shrink-0 select-none mr-1">
                        <button
                          onClick={() => handleStartEdit(msg)}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded text-slate-500 hover:text-[#ff6b00] transition-colors cursor-pointer"
                          title="Edit Message"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingMessageId(msg.id)}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
                          title="Delete Message"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Editing message */}
                    {isEditing ? (
                      <div className="w-[280px] sm:w-[320px] flex flex-col gap-1.5 bg-white dark:bg-zinc-900 p-2 rounded-2xl border border-[#ff6b00] shadow-md">
                        <textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="w-full p-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-[#ff6b00] text-slate-900 dark:text-white font-medium resize-none"
                          rows={2}
                          autoFocus
                        />
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={handleCancelEdit}
                            className="h-6.5 px-2.5 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 text-[9px] uppercase tracking-wider font-bold"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(msg.id)}
                            className="h-6.5 px-2.5 rounded-md bg-[#ff6b00] text-white text-[9px] uppercase tracking-wider font-bold flex items-center gap-1"
                            disabled={savingEdit}
                          >
                            {savingEdit ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                            Save
                          </button>
                        </div>
                      </div>
                    ) : isDeleting ? (
                      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 p-3 rounded-2xl flex flex-col items-center gap-2 max-w-[280px] shadow-sm select-none">
                        <span className="text-[9.5px] font-black uppercase text-red-600 dark:text-red-400 tracking-widest text-center">Delete this message?</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setDeletingMessageId(null)}
                            className="h-6 px-2.5 bg-slate-100 dark:bg-zinc-850 text-slate-600 dark:text-zinc-400 font-bold text-[9px] uppercase tracking-wider rounded-md"
                          >
                            No
                          </button>
                          <button
                            onClick={() => confirmDeleteMessage(msg.id)}
                            className="h-6 px-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-[9px] uppercase tracking-wider rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            Yes
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Rendering Custom Style speech bubbles with long-press triggers */
                      <div 
                        onMouseDown={(e) => handleStartLongPress(msg, e)}
                        onMouseUp={handleEndLongPress}
                        onMouseLeave={handleEndLongPress}
                        onTouchStart={(e) => handleStartLongPress(msg, e)}
                        onTouchEnd={handleEndLongPress}
                        onTouchMove={handleTouchMove}
                        onContextMenu={(e) => handleContextMenu(msg, e)}
                        className={cn(
                          "p-2.5 rounded-2xl text-[13px] sm:text-sm font-medium shadow-sm break-words max-w-full leading-relaxed relative flex flex-col cursor-pointer select-none active:scale-[0.99] transition-transform",
                          isMe 
                            ? "bg-[#ff6b00] text-white rounded-tr-none" 
                            : "bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100 rounded-tl-none border border-slate-150 dark:border-zinc-800"
                        )}
                      >
                        
                        {/* 1. IMAGE TYPE */}
                        {msg.mediaType === 'image' && msg.mediaUrl && (
                          <div className="mb-2 relative group/img cursor-pointer max-w-[240px]" onClick={() => setLightboxImage(msg.mediaUrl || null)}>
                            <img 
                              src={msg.mediaUrl} 
                              alt="Attachment" 
                              className="rounded-xl object-cover max-h-52 w-full hover:brightness-95 transition-all shadow-sm"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover/img:opacity-100 flex items-center justify-center rounded-xl transition-opacity">
                              <Maximize2 className="w-5 h-5 text-white filter drop-shadow" />
                            </div>
                          </div>
                        )}

                         {/* 3. CALL SYSTEM LOG TYPE */}
                        {msg.mediaType === 'call' && (
                          <div className="flex items-center gap-2.5 py-1 px-1 select-none text-[11px] font-bold">
                            <span className={cn(
                              "w-7 h-7 rounded-full flex items-center justify-center",
                              isMe ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300"
                            )}>
                              {msg.callType === 'video' ? <Video className="w-3.5 h-3.5" /> : <Phone className="w-3.5 h-3.5" />}
                            </span>
                            <div className="flex-1">
                              <p className="leading-tight">{msg.text}</p>
                              <span className="text-[8.5px] opacity-70">Duration: {msg.mediaDuration || '0:00'}</span>
                            </div>
                          </div>
                        )}

                        {/* Text rendering */}
                        {msg.mediaType !== 'call' && (msg.mediaType !== 'voice' || msg.text !== '🎤 Voice Note') && (
                          <span className="whitespace-pre-wrap select-text">{msg.text}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Bubble footer with Double Tick / Ticks */}
                  {!isEditing && !isDeleting && (
                    <div className="flex items-center gap-1 mt-1 px-1.5 text-slate-500/80 dark:text-zinc-500/80 text-[9px] font-mono select-none">
                      {msg.isEdited && (
                        <span className="font-extrabold uppercase tracking-widest text-[8px] bg-white/20 px-1 rounded">edited</span>
                      )}
                      {msg.createdAt && (
                        <span>
                          {new Date(msg.createdAt?.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      {isMe && (
                        <CheckCheck className="w-3.5 h-3.5 text-sky-500 shrink-0 inline ml-0.5" />
                      )}
                    </div>
                  )}
                </motion.div>
              </React.Fragment>
            );
          })
        )}
      </div>

      {/* Image scanning state indicator */}
      {scanningImage && (
        <div className="px-4 pb-2 z-20">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl flex items-center gap-3 text-blue-700 dark:text-blue-300 shadow-sm animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400 shrink-0" />
            <p className="text-xs font-semibold">Scanning image for contact safety compliance...</p>
          </div>
        </div>
      )}

      {/* Sensitive block warning */}
      <AnimatePresence>
        {showWarning && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="px-4 pb-2 z-20"
          >
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 shadow-sm">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 animate-bounce" />
              <p className="text-xs font-bold leading-tight">{warningText || CONTACT_WARNING_MESSAGE}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attachment Image Preview popup */}
      {selectedImage && (
        <div className="p-3 bg-white dark:bg-zinc-900 border-t border-slate-200/50 dark:border-zinc-800 flex items-center gap-4 shrink-0 shadow-lg animate-in slide-in-from-bottom-5 duration-200">
          <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-zinc-850 shrink-0 shadow">
            <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
            <button 
              type="button"
              onClick={handleRemoveSelectedImage}
              className="absolute top-0.5 right-0.5 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="flex-1">
            <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 block">Photo Attachment selected</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Press Send to attach this picture to the thread.</span>
          </div>
        </div>
      )}

      {/* Chat Footer Input Area */}
      <div className="p-4 bg-transparent shrink-0 select-none">
        <form onSubmit={handleSendMessage} className="flex gap-2.5 items-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-md hover:bg-white dark:hover:bg-slate-900 shadow-xl shadow-slate-200/40 dark:shadow-none border border-slate-150 dark:border-slate-800/80 rounded-2xl p-2 transition-all">
          {/* Input Rounded Box */}
          <div className="flex-1 flex items-center bg-slate-50 dark:bg-slate-950/50 rounded-xl px-3.5 h-10 border-none transition-all select-text">
            <input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={selectedImage ? "Add a caption..." : "Type your message safely..."}
              className="flex-1 h-full bg-transparent border-0 focus:ring-0 focus:ring-offset-0 focus:outline-none focus:border-0 focus:bg-transparent shadow-none focus:shadow-none rounded-none w-full text-xs sm:text-sm font-semibold text-slate-800 dark:text-white placeholder-slate-450"
            />
          </div>

          {/* Send button always visible, disabled if no text & no attachment */}
          <button
            type="submit"
            disabled={sending || (!newMessage.trim() && !selectedImage)}
            className="w-10 h-10 bg-[#ff6b00] hover:bg-orange-650 text-white disabled:bg-slate-100 dark:disabled:bg-slate-800/50 disabled:text-slate-350 dark:disabled:text-slate-700 rounded-xl flex items-center justify-center transition-all active:scale-95 cursor-pointer shrink-0 shadow-sm"
            title="Send Message"
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </form>
      </div>

      {/* Call Simulator Interactive Full Screen Overlay (voice & video modes) */}
      <AnimatePresence>
        {activeCall && (
          <motion.div
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="absolute inset-0 z-[250] bg-slate-950/98 backdrop-blur-lg flex flex-col justify-between p-8 text-white select-none"
          >
            {/* Top info and type */}
            <div className="flex flex-col items-center mt-12 text-center">
              <div className="relative mb-6">
                {/* Pulsing visual ringing effect rings */}
                {activeCall.status === 'calling' && (
                  <>
                    <div className="absolute inset-0 bg-orange-500/20 rounded-full animate-ping scale-150 opacity-75" />
                    <div className="absolute inset-0 bg-orange-500/10 rounded-full animate-ping scale-200 opacity-40" />
                  </>
                )}
                
                {/* Call Avatar representation */}
                <div className={cn(
                  "w-28 h-28 rounded-full flex items-center justify-center text-4xl font-sans font-black shadow-2xl relative z-10 border-4 border-white/20",
                  getAvatarBg(recipientName)
                )}>
                  {getInitials(recipientName)}
                </div>
              </div>

              <h2 className="text-xl font-black tracking-tight mb-2">{recipientName}</h2>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-400/90 animate-pulse">
                {activeCall.status === 'calling' ? `${activeCall.type === 'video' ? 'Video Call' : 'Voice Call'}ing...` : 'Connected'}
              </p>
              {activeCall.status === 'connected' && (
                <span className="text-sm font-mono font-bold bg-white/10 px-3 py-1 rounded-full mt-3 block">{formatTime(callDuration)}</span>
              )}
            </div>

            {/* Video preview feed inside a small block if calling with video and connected */}
            {activeCall.type === 'video' && activeCall.status === 'connected' && (
              <div className="w-full max-w-xs mx-auto aspect-video rounded-3xl bg-zinc-900 border-2 border-white/10 overflow-hidden relative shadow-lg my-4 flex items-center justify-center text-center">
                {isVideoOff ? (
                  <div className="flex flex-col items-center gap-1 opacity-60">
                    <Camera className="w-8 h-8" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Camera is Disabled</span>
                  </div>
                ) : (
                  <>
                    {/* Live hardware Camera preview element */}
                    <video 
                      ref={localVideoRef}
                      autoPlay 
                      playsInline 
                      muted 
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                    <span className="absolute bottom-3 left-3 bg-black/60 px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider backdrop-blur-xs">Your Feed</span>
                  </>
                )}
              </div>
            )}

            {/* Calling control action buttons at the bottom */}
            <div className="flex flex-col items-center gap-6 mb-12">
              <div className="flex items-center gap-4">
                {/* Mute button toggle */}
                <button
                  type="button"
                  onClick={() => setIsMuted(prev => !prev)}
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer border border-white/10",
                    isMuted ? "bg-white text-zinc-950" : "bg-white/10 text-white hover:bg-white/25"
                  )}
                  title={isMuted ? "Unmute" : "Mute Microphone"}
                >
                  {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                {/* Video toggle button if video call */}
                {activeCall.type === 'video' && (
                  <button
                    type="button"
                    onClick={() => setIsVideoOff(prev => !prev)}
                    className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer border border-white/10",
                      isVideoOff ? "bg-white text-zinc-950" : "bg-white/10 text-white hover:bg-white/25"
                    )}
                    title={isVideoOff ? "Turn Video On" : "Turn Video Off"}
                  >
                    {isVideoOff ? <Camera className="w-5 h-5 opacity-40" /> : <Camera className="w-5 h-5" />}
                  </button>
                )}

                {/* Decline/End button */}
                <button
                  type="button"
                  onClick={() => handleEndCall(activeCall.status === 'connected' ? 'completed' : 'declined')}
                  className="w-16 h-16 bg-red-600 hover:bg-red-750 text-white rounded-full flex items-center justify-center transition-all cursor-pointer shadow-lg shadow-red-600/30 scale-105 active:scale-95"
                  title="Hang Up"
                >
                  <PhoneOff className="w-7 h-7" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Picture Viewer Lightbox Screen Modal */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[300] bg-black/95 flex flex-col justify-between p-6 select-none"
          >
            {/* Top closing controls */}
            <div className="flex justify-between items-center z-10 mt-4">
              <span className="text-xs font-black text-white/60 uppercase tracking-widest">Image Viewer</span>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="w-10 h-10 rounded-full bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-all cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Picture canvas */}
            <div className="flex-1 flex items-center justify-center">
              <img 
                src={lightboxImage} 
                alt="Enlarged" 
                className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl animate-in zoom-in-95 duration-200"
                referrerPolicy="no-referrer"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message Options Dialog / Context Menu Overlay */}
      <AnimatePresence>
        {activeMenuMessage && menuPosition && (
          <>
            {/* Backdrop layer to capture taps/clicks to close the overlay */}
            <div 
              className="fixed inset-0 z-[400] bg-black/5 dark:bg-black/25"
              onClick={() => {
                setActiveMenuMessage(null);
                setMenuPosition(null);
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                setActiveMenuMessage(null);
                setMenuPosition(null);
              }}
            />
            {/* Floating Dropdown Dialog options container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.93, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.93, y: 8 }}
              transition={{ duration: 0.12, ease: "easeOut" }}
              style={{
                position: 'fixed',
                left: `${menuPosition.x}px`,
                top: `${menuPosition.y}px`,
              }}
              className="z-[410] w-42 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xl py-1.5 overflow-hidden font-sans select-none"
            >
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(activeMenuMessage.text);
                  setActiveMenuMessage(null);
                  setMenuPosition(null);
                }}
                className="w-full px-4 py-2.5 text-left text-xs sm:text-sm font-semibold text-slate-750 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <Copy className="w-4 h-4 text-slate-450 dark:text-zinc-400" />
                <span>Copy Text</span>
              </button>

              {activeMenuMessage.senderId === auth.currentUser?.uid && (
                <button
                  type="button"
                  onClick={() => {
                    handleStartEdit(activeMenuMessage);
                    setActiveMenuMessage(null);
                    setMenuPosition(null);
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs sm:text-sm font-semibold text-slate-750 dark:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Pencil className="w-4 h-4 text-slate-450 dark:text-zinc-400" />
                  <span>Edit Message</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setDeletingMessageId(activeMenuMessage.id);
                  setActiveMenuMessage(null);
                  setMenuPosition(null);
                }}
                className="w-full px-4 py-2.5 text-left text-xs sm:text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/25 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
                <span>Delete Message</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
