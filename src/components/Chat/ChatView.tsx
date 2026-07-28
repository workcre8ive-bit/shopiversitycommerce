import React from 'react';
import ChatList from './ChatList';
import ChatBox from './ChatBox';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, AlertTriangle, X } from 'lucide-react';
import { auth, db } from '../../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../../lib/firebase-errors';
import { cn } from '../../lib/utils';

interface ChatViewProps {
  initialRecipientId?: string | null;
  onRecipientHandled?: () => void;
}

export default function ChatView({ initialRecipientId, onRecipientHandled }: ChatViewProps) {
  const [selectedChat, setSelectedChat] = React.useState<any>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  React.useEffect(() => {
    if (initialRecipientId) {
      // Find or create chat with this recipient
      const setupChat = async () => {
        const currentUserId = auth.currentUser?.uid;
        if (!currentUserId) return;

        try {
          // Check if chat exists
          const chatsRef = collection(db, 'chats');
          const q = query(
            chatsRef,
            where('participants', 'array-contains', currentUserId)
          );
          const snap = await getDocs(q);
          const existingChat = snap.docs.find(doc => {
            const data = doc.data();
            return data.participants.includes(initialRecipientId);
          });

          if (existingChat) {
            const data = existingChat.data();
            const otherParticipantId = data.participants.find((id: string) => id !== currentUserId);
            // Get recipient names from participantNames map
            const otherParticipantName = data.participantNames?.[otherParticipantId] || 'User';
            setSelectedChat({
              id: existingChat.id,
              otherParticipantId,
              otherParticipantName,
              ...data
            });
          } else {
            // Get recipient profile for the name
            const recipientSnap = await getDoc(doc(db, 'users', initialRecipientId));
            if (recipientSnap.exists()) {
              const recipientData = recipientSnap.data();
              const currentUserSnap = await getDoc(doc(db, 'users', currentUserId));
              const currentUserData = currentUserSnap.data();

              // ENFORCE RULE: Sellers can only message buyers when messaged first
              const isCurrentUserSeller = currentUserData?.role === 'seller' || currentUserData?.activeRole === 'seller' || currentUserData?.role === 'both';
              const isRecipientBuyer = recipientData?.role === 'buyer' || (!recipientData?.role && !recipientData?.businessName);

              if (isCurrentUserSeller && isRecipientBuyer) {
                setErrorMessage("Sellers can only message buyers when they are messaged first.");
                setSelectedChat(null);
                onRecipientHandled?.();
                return;
              }

              const newChatData = {
                participants: [currentUserId, initialRecipientId],
                participantNames: {
                  [currentUserId]: currentUserData?.displayName || 'User',
                  [initialRecipientId]: recipientData?.displayName || 'User'
                },
                lastMessage: '',
                lastMessageAt: serverTimestamp(),
                createdAt: serverTimestamp(),
                unreadCount: {
                  [currentUserId]: 0,
                  [initialRecipientId]: 0
                }
              };
              const newChatRef = await addDoc(collection(db, 'chats'), newChatData);
              setSelectedChat({
                id: newChatRef.id,
                otherParticipantId: initialRecipientId,
                otherParticipantName: recipientData?.displayName || 'User',
                ...newChatData
              });
            } else {
              // Fallback if recipient doesn't exist
              setSelectedChat({
                id: 'temp-' + initialRecipientId,
                otherParticipantId: initialRecipientId,
                otherParticipantName: 'User',
                participants: [currentUserId, initialRecipientId],
                participantNames: {
                  [currentUserId]: 'You',
                  [initialRecipientId]: 'User'
                }
              });
            }
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, 'chats/setup');
        } finally {
          onRecipientHandled?.();
        }
      };

      setupChat();
    }
  }, [initialRecipientId]);

  return (
    <div className="flex h-[calc(100vh-130px)] md:h-[calc(100vh-100px)] max-h-[880px] bg-transparent mt-6 gap-6 overflow-hidden relative">
      {/* Alert Banner / Toast notification */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 max-w-sm w-full px-4"
          >
            <div className="bg-red-500 text-white rounded-2xl p-4 shadow-2xl border border-red-400 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <AlertTriangle className="w-5 h-5 shrink-0 text-white" />
                <p className="text-[11px] font-black leading-tight uppercase tracking-wider text-white truncate">
                  {errorMessage}
                </p>
              </div>
              <button 
                onClick={() => setErrorMessage(null)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Sidebar - Desktop always, Mobile only if no chat selected */}
      <div className={cn(
        "w-full md:w-80 lg:w-[380px] flex-shrink-0 flex flex-col bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100/80 dark:border-slate-800/60 shadow-xl shadow-slate-200/30 dark:shadow-none overflow-hidden transition-all",
        selectedChat ? "hidden md:flex" : "flex"
      )}>
        <ChatList 
          onSelectChat={setSelectedChat} 
          selectedChatId={selectedChat?.id}
        />
      </div>

      {/* Main Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100/80 dark:border-slate-800/60 shadow-xl shadow-slate-200/30 dark:shadow-none overflow-hidden transition-all",
        !selectedChat ? "hidden md:flex" : "flex"
      )}>
        {selectedChat ? (
          <ChatBox 
            chatId={selectedChat.id}
            recipientId={selectedChat.otherParticipantId}
            recipientName={selectedChat.otherParticipantName}
            onBack={() => setSelectedChat(null)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center select-none bg-slate-50/50 dark:bg-slate-950/20">
            <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-[2.5rem] flex items-center justify-center text-slate-300 dark:text-slate-600 mb-6 shadow-sm border border-slate-100 dark:border-slate-850">
              <MessageCircle className="w-12 h-12 text-purple-500" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Select a Conversation</h3>
            <p className="text-slate-400 dark:text-slate-500 font-medium text-xs max-w-xs mx-auto leading-relaxed">
              Choose a buyer or seller from the list on the left to start discussing your trade.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


