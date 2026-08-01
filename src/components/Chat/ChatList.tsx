import React from 'react';
import { db, auth } from '../../firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  addDoc
} from 'firebase/firestore';
import { MessageCircle, Search, User, Loader2, Pin, PinOff, Trash2, Edit3, Check, X, AlertTriangle, Plus, ArrowLeft, Store, Building, MessageSquare } from 'lucide-react';
import { cn } from '../../lib/utils';
import { handleFirestoreError, OperationType } from '../../lib/firebase-errors';

interface Chat {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageAt: any;
  unreadCount?: Record<string, number>;
  otherParticipantId?: string;
  otherParticipantName?: string;
  otherParticipantPhotoURL?: string;
  otherParticipantRole?: string;
  otherParticipantBusinessName?: string;
  pinnedBy?: Record<string, boolean>;
  customLabels?: Record<string, string>;
}

interface ChatListProps {
  onSelectChat: (chat: Chat) => void;
  selectedChatId?: string;
}

// Helper to extract initials
function getInitials(name: string) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0][0].toUpperCase();
}

// Generate premium vibrant background gradient for each recipient
function getAvatarBg(name: string) {
  const customGradients = [
    'from-pink-500 to-rose-500 text-rose-50',
    'from-purple-500 to-indigo-500 text-indigo-50',
    'from-blue-500 to-sky-500 text-sky-50',
    'from-teal-500 to-emerald-500 text-emerald-50',
    'from-amber-500 to-purple-500 text-purple-50',
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

export default function ChatList({ onSelectChat, selectedChatId }: ChatListProps) {
  const [chats, setChats] = React.useState<Chat[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState('');
  
  // Nickname state
  const [editingChatId, setEditingChatId] = React.useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = React.useState('');

  // Custom Deletion Confirm state
  const [deletingChat, setDeletingChat] = React.useState<Chat | null>(null);
  const [deletingProgress, setDeletingProgress] = React.useState(false);

  // Seller Search States
  const [currentUserProfile, setCurrentUserProfile] = React.useState<any>(null);
  const [searchSellersMode, setSearchSellersMode] = React.useState(false);
  const [allSellers, setAllSellers] = React.useState<any[]>([]);
  const [loadingSellers, setLoadingSellers] = React.useState(false);
  const [sellerSearchInput, setSellerSearchInput] = React.useState('');

  // Fetch current user's profile to inspect role
  React.useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    getDoc(doc(db, 'users', userId)).then((docSnap) => {
      if (docSnap.exists()) {
        setCurrentUserProfile({ uid: docSnap.id, ...docSnap.data() });
      }
    }).catch(err => {
      console.error("Error fetching current user profile:", err);
    });
  }, []);

  // Fetch fellow sellers when seller-search-mode is enabled
  React.useEffect(() => {
    if (!searchSellersMode) return;
    
    const fetchSellers = async () => {
      setLoadingSellers(true);
      try {
        const usersRef = collection(db, 'users');
        const q = query(
          usersRef,
          where('role', 'in', ['seller', 'both'])
        );
        const snap = await getDocs(q);
        const sellersList = snap.docs
          .map(doc => ({ uid: doc.id, ...doc.data() }))
          .filter(u => u.uid !== auth.currentUser?.uid);
        setAllSellers(sellersList);
      } catch (err) {
        console.error("Error fetching fellow sellers:", err);
      } finally {
        setLoadingSellers(false);
      }
    };

    fetchSellers();
  }, [searchSellersMode]);

  const handleInitiateSellerChat = async (targetSeller: any) => {
    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId || !targetSeller.uid) return;

    try {
      // Check if chat already exists
      const chatsRef = collection(db, 'chats');
      const q = query(
        chatsRef,
        where('participants', 'array-contains', currentUserId)
      );
      const snap = await getDocs(q);
      const existingChat = snap.docs.find(doc => {
        const data = doc.data();
        return data.participants.includes(targetSeller.uid);
      });

      if (existingChat) {
        const data = existingChat.data();
        const customName = data.customLabels?.[currentUserId] || targetSeller.displayName || 'User';
        onSelectChat({
          id: existingChat.id,
          participants: data.participants,
          lastMessage: data.lastMessage || '',
          lastMessageAt: data.lastMessageAt,
          otherParticipantId: targetSeller.uid,
          otherParticipantName: customName,
          otherParticipantPhotoURL: targetSeller.photoURL || '',
          ...data
        });
      } else {
        // Create new chat
        const currentUserSnap = await getDoc(doc(db, 'users', currentUserId));
        const currentUserData = currentUserSnap.data();

        const newChatData = {
          participants: [currentUserId, targetSeller.uid],
          participantNames: {
            [currentUserId]: currentUserData?.displayName || 'User',
            [targetSeller.uid]: targetSeller.displayName || 'User'
          },
          lastMessage: '',
          lastMessageAt: { seconds: Math.floor(Date.now() / 1000) }, // fallback representation
          createdAt: { seconds: Math.floor(Date.now() / 1000) },
          unreadCount: {
            [currentUserId]: 0,
            [targetSeller.uid]: 0
          }
        };

        const newDocRef = await addDoc(collection(db, 'chats'), newChatData);
        onSelectChat({
          id: newDocRef.id,
          otherParticipantId: targetSeller.uid,
          otherParticipantName: targetSeller.displayName || 'User',
          otherParticipantPhotoURL: targetSeller.photoURL || '',
          ...newChatData
        });
      }
      setSearchSellersMode(false);
      setSellerSearchInput('');
    } catch (err) {
      console.error("Failed to initiate seller-to-seller chat:", err);
    }
  };

  React.useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    // Fetch all chats where current user is a participant
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', userId)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const chatsData = await Promise.all(snapshot.docs.map(async (chatDoc) => {
          const data = chatDoc.data();
          const participants = data.participants || [];
          const otherId = participants.find((p: string) => p !== userId) || "";
          
          let otherName = 'User';
          let otherPhotoURL = '';
          let otherRole = '';
          let otherBusinessName = '';
          
          if (otherId) {
            try {
              const userSnap = await getDoc(doc(db, 'users', otherId));
              if (userSnap.exists()) {
                const uData = userSnap.data();
                otherName = uData.displayName || 'User';
                otherPhotoURL = uData.photoURL || '';
                otherRole = uData.role || '';
                otherBusinessName = uData.businessName || '';
              }
            } catch (e) {
              console.error("Error reading participant user info:", e);
            }
          }

          // Apply edited alias/nickname locally if set
          const customName = data.customLabels?.[userId] || otherName;

          return {
            id: chatDoc.id,
            ...data,
            otherParticipantId: otherId,
            otherParticipantName: customName,
            otherParticipantPhotoURL: otherPhotoURL,
            otherParticipantRole: otherRole,
            otherParticipantBusinessName: otherBusinessName
          } as Chat;
        }));

        // Sort in-memory: Pinned first, then ordered by lastMessageAt descending
        const sortedChats = chatsData.sort((a, b) => {
          const isAPinned = !!a.pinnedBy?.[userId];
          const isBPinned = !!b.pinnedBy?.[userId];
          if (isAPinned && !isBPinned) return -1;
          if (!isAPinned && isBPinned) return 1;

          const timeA = a.lastMessageAt?.seconds || 0;
          const timeB = b.lastMessageAt?.seconds || 0;
          return timeB - timeA;
        });

        setChats(sortedChats);
        setLoading(false);
      } catch (err) {
        console.error("Error processing chats real-time snapshot:", err);
        setLoading(false);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'chats');
    });

    return () => unsubscribe();
  }, []);

  const handleStartEditNickname = (e: React.MouseEvent, chat: Chat) => {
    e.stopPropagation();
    setEditingChatId(chat.id);
    setEditingNameValue(chat.otherParticipantName || '');
  };

  const handleSaveNickname = async (e: React.MouseEvent | React.FormEvent, chatId: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (!editingNameValue.trim()) return;

    const userId = auth.currentUser?.uid;
    if (!userId) return;

    try {
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, {
        [`customLabels.${userId}`]: editingNameValue.trim()
      });
      setEditingChatId(null);
    } catch (err) {
      console.error("Failed to edit chat display nickname:", err);
    }
  };

  const handleTogglePin = async (e: React.MouseEvent, chat: Chat) => {
    e.stopPropagation();
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const currentPinStatus = !!chat.pinnedBy?.[userId];

    try {
      const chatRef = doc(db, 'chats', chat.id);
      await updateDoc(chatRef, {
        [`pinnedBy.${userId}`]: !currentPinStatus
      });
    } catch (err) {
      console.error("Failed to toggle pin status:", err);
    }
  };

  const triggerDeleteConversation = (e: React.MouseEvent, chat: Chat) => {
    e.stopPropagation();
    setDeletingChat(chat);
  };

  const executeDeleteChat = async () => {
    if (!deletingChat) return;
    setDeletingProgress(true);
    try {
      // Direct delete of chat session documentation
      await deleteDoc(doc(db, 'chats', deletingChat.id));
      setDeletingChat(null);
    } catch (err) {
      console.error("Failed to delete chat room:", err);
    } finally {
      setDeletingProgress(false);
    }
  };

  const filteredChats = chats.filter(c => {
    const matchesSearch = c.otherParticipantName?.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    // "dont show other sellers chat if you have not chat with them before"
    const isOtherSeller = c.otherParticipantRole === 'seller' || c.otherParticipantRole === 'both' || !!c.otherParticipantBusinessName;
    if (isOtherSeller && (!c.lastMessage || c.lastMessage.trim() === '')) {
      return false;
    }
    return true;
  });

  const userId = auth.currentUser?.uid || '';
  const isSeller = currentUserProfile?.role === 'seller' || currentUserProfile?.activeRole === 'seller' || currentUserProfile?.role === 'both';

  const filteredSellers = allSellers.filter(seller => {
    const q = sellerSearchInput.toLowerCase();
    const nameMatch = (seller.displayName || '').toLowerCase().includes(q);
    const bizMatch = (seller.businessName || '').toLowerCase().includes(q);
    return nameMatch || bizMatch;
  });

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 transition-colors relative">
      {searchSellersMode ? (
        /* Fellow Sellers Directory Search Mode Header */
        <div className="p-5 border-b border-slate-100/80 dark:border-slate-800/60 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-3 mb-3.5">
            <button
              onClick={() => {
                setSearchSellersMode(false);
                setSellerSearchInput('');
              }}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-850 rounded-lg text-slate-550 hover:text-slate-750 transition-colors cursor-pointer"
              title="Back to chats"
            >
              <ArrowLeft className="w-4 h-4 text-slate-650 dark:text-zinc-400" />
            </button>
            <h2 className="text-base font-bold tracking-tight text-slate-900 dark:text-zinc-100 font-sans flex items-center gap-2">
              <Store className="w-4.5 h-4.5 text-orange-500" />
              <span>Campus Sellers</span>
            </h2>
          </div>

          {/* Search Input Container */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              value={sellerSearchInput}
              onChange={(e) => setSellerSearchInput(e.target.value)}
              placeholder="Search by name or business name..."
              className="w-full h-9 pl-9 pr-4 bg-slate-100 dark:bg-zinc-850 dark:text-white dark:placeholder-zinc-500 border border-transparent dark:border-zinc-800 rounded-lg text-xs outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white dark:focus:bg-zinc-900 transition-all font-semibold text-slate-800"
              autoFocus
            />
          </div>
        </div>
      ) : (
        /* Standard Conversations List Header */
        <div className="p-5 border-b border-slate-100/80 dark:border-slate-800/60 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center justify-between mb-3.5">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-zinc-100 font-sans flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-purple-500" />
              <span>Campus Messages</span>
            </h2>
            <div className="flex items-center gap-2">
              {isSeller && (
                <button
                  onClick={() => setSearchSellersMode(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-orange-500 hover:bg-orange-600 hover:scale-105 active:scale-95 text-white text-[10px] font-black uppercase tracking-wider rounded-lg shadow-sm transition-all cursor-pointer"
                  title="Find other campus sellers to message"
                >
                  <Plus className="w-3 h-3" />
                  <span>Sellers</span>
                </button>
              )}
              <span className="text-[10px] bg-slate-100 dark:bg-zinc-850 text-slate-550 dark:text-zinc-400 px-2 py-0.5 rounded-full font-bold font-mono">
                {chats.length} chats
              </span>
            </div>
          </div>

          {/* Search Input Container */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts..."
              className="w-full h-9 pl-9 pr-4 bg-slate-100 dark:bg-zinc-850 dark:text-white dark:placeholder-zinc-500 border border-transparent dark:border-zinc-800 rounded-lg text-xs outline-none focus:ring-1 focus:ring-purple-500 focus:bg-white dark:focus:bg-zinc-900 transition-all font-semibold text-slate-800"
            />
          </div>
        </div>
      )}

      {/* List Container */}
      <div className="flex-1 overflow-y-auto px-3 space-y-1.5 py-4 scrollbar-thin">
        {searchSellersMode ? (
          /* Sellers Search Mode Results */
          loadingSellers ? (
            <div className="flex flex-col items-center justify-center p-12 gap-2 text-slate-400">
              <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
              <span className="text-[11px] font-medium font-mono text-slate-500">Retrieving campus directory...</span>
            </div>
          ) : filteredSellers.length === 0 ? (
            <div className="text-center p-10 bg-white dark:bg-zinc-900/30 rounded-2xl border border-dashed border-slate-150 dark:border-zinc-800/80 mx-2">
              <div className="w-10 h-10 bg-slate-100 dark:bg-zinc-850 rounded-xl flex items-center justify-center text-slate-400 mx-auto mb-3">
                <Store className="w-5 h-5" />
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">No sellers found</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Try searching another name or business name!</p>
            </div>
          ) : (
            filteredSellers.map((seller) => (
              <div
                key={`seller-search-item-${seller.uid}`}
                onClick={() => handleInitiateSellerChat(seller)}
                className="w-full p-3 rounded-xl flex items-center gap-3 bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-850/60 border border-slate-100 dark:border-zinc-850/70 transition-all cursor-pointer select-none"
              >
                {/* Initials Custom Avatar with premium vibrant gradient */}
                <div className={cn(
                  "w-11 h-11 rounded-lg flex items-center justify-center text-xs font-extrabold shadow-sm tracking-wide grow-0 shrink-0 overflow-hidden",
                  seller.photoURL ? "bg-slate-100" : cn("bg-gradient-to-tr", getAvatarBg(seller.displayName || 'User'))
                )}>
                  {seller.photoURL ? (
                    <img src={seller.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    getInitials(seller.displayName || 'User')
                  )}
                </div>

                {/* Seller business / display info */}
                <div className="flex-1 text-left min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">
                    {seller.displayName}
                  </h4>
                  {seller.businessName ? (
                    <p className="text-[10px] text-orange-500 font-bold flex items-center gap-1 mt-0.5 truncate">
                      <Building className="w-3 h-3" />
                      <span>{seller.businessName}</span>
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                      <Store className="w-3 h-3" />
                      <span>Campus Seller</span>
                    </p>
                  )}
                </div>

                {/* Quick start chat message square icon button */}
                <button
                  type="button"
                  className="w-8 h-8 rounded-lg bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/20 dark:hover:bg-orange-900/30 text-orange-600 flex items-center justify-center transition-all cursor-pointer"
                  title="Send message"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>
            ))
          )
        ) : (
          /* Normal Conversations List results */
          loading ? (
          <div className="flex flex-col items-center justify-center p-12 gap-2 text-slate-400">
            <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
            <span className="text-[11px] font-medium font-mono text-slate-500">Retrieving chats...</span>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="text-center p-10 bg-white dark:bg-zinc-900/30 rounded-2xl border border-dashed border-slate-150 dark:border-zinc-800/80 mx-2">
            <div className="w-10 h-10 bg-slate-100 dark:bg-zinc-850 rounded-xl flex items-center justify-center text-slate-400 mx-auto mb-3">
              <MessageCircle className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">No active conversations</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Start one from any listing profile info page!</p>
          </div>
        ) : (
          filteredChats.map((chat, cIdx) => {
            const isSelected = selectedChatId === chat.id;
            const isPinned = !!chat.pinnedBy?.[userId];
            const isEditingThisOne = editingChatId === chat.id;

            return (
              <div
                key={`chat-item-wrapper-${chat.id || cIdx}-${cIdx}`}
                onClick={() => {
                  if (!isEditingThisOne) {
                    onSelectChat(chat);
                  }
                }}
                className={cn(
                  "w-full p-3 rounded-xl flex items-center gap-3 transition-all cursor-pointer relative group border select-none",
                  isSelected 
                    ? "bg-slate-150 dark:bg-zinc-800/85 border-slate-200 dark:border-zinc-700 shadow-sm" 
                    : "bg-white dark:bg-zinc-900 hover:bg-slate-50 dark:hover:bg-zinc-850/60 border-slate-100 dark:border-zinc-850/70"
                )}
              >
                {/* Initials Custom Avatar with premium vibrant gradient */}
                <div className={cn(
                  "w-11 h-11 rounded-lg flex items-center justify-center text-xs font-extrabold shadow-sm tracking-wide grow-0 shrink-0 overflow-hidden",
                  chat.otherParticipantPhotoURL ? "bg-slate-100" : cn("bg-gradient-to-tr", getAvatarBg(chat.otherParticipantName || 'User'))
                )}>
                  {chat.otherParticipantPhotoURL ? (
                    <img src={chat.otherParticipantPhotoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    getInitials(chat.otherParticipantName || 'User')
                  )}
                </div>

                {/* Info and Last message text */}
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between gap-1.5 mb-0.5">
                    {isEditingThisOne ? (
                      <form 
                        onSubmit={() => handleSaveNickname(null as any, chat.id)}
                        className="flex items-center gap-1 w-full bg-slate-100 dark:bg-zinc-900 rounded px-1.5 py-0.5 border border-purple-500"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          value={editingNameValue}
                          onChange={(e) => setEditingNameValue(e.target.value)}
                          className="w-full text-xs font-bold text-slate-800 dark:text-white bg-transparent outline-none py-0.5 focus:ring-0 focus:outline-none"
                          autoFocus
                        />
                        <button 
                          type="button" 
                          onClick={(e) => handleSaveNickname(e, chat.id)}
                          className="text-emerald-500 hover:scale-115 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          type="button" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingChatId(null);
                          }}
                          className="text-rose-500 hover:scale-115 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </form>
                    ) : (
                      <div className="flex items-center gap-1 truncate max-w-full">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-zinc-100 truncate">
                          {chat.otherParticipantName}
                        </h4>
                        {isPinned && (
                          <Pin className="w-3 h-3 text-purple-500 fill-purple-500 shrink-0 flex-none" />
                        )}
                      </div>
                    )}
                    
                    {/* Timestamp relative view */}
                    {!isEditingThisOne && chat.lastMessageAt && (
                      <span className="text-[9px] font-mono text-slate-400 capitalize shrink-0 select-none">
                        {new Date(chat.lastMessageAt?.seconds * 1000).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] truncate text-slate-500 dark:text-zinc-400 font-medium">
                    {chat.lastMessage || 'Open chat to speak'}
                  </p>
                </div>

                {/* Quick actions box - appears on hover */}
                {!isEditingThisOne && (
                  <div className="absolute right-2 top-1.5 hidden group-hover:flex items-center gap-1.5 bg-white/90 dark:bg-zinc-900/90 py-1 px-1.5 rounded-lg shadow border border-slate-100 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-100">
                    {/* Toggle Pin/Unpin */}
                    <button
                      onClick={(e) => handleTogglePin(e, chat)}
                      className={cn(
                        "p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded transition-colors cursor-pointer",
                        isPinned ? "text-purple-500" : "text-slate-400 hover:text-slate-650 dark:hover:text-zinc-350"
                      )}
                      title={isPinned ? "Unpin conversation" : "Pin conversation to top"}
                    >
                      {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                    </button>

                    {/* Edit Display Name */}
                    <button
                      onClick={(e) => handleStartEditNickname(e, chat)}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded text-slate-400 hover:text-slate-650 dark:hover:text-zinc-350 transition-colors cursor-pointer"
                      title="Edit display nickname / label"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete conversation */}
                    <button
                      onClick={(e) => triggerDeleteConversation(e, chat)}
                      className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950/25 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Delete entire chat session"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Badge for unread message indicator */}
                {chat.unreadCount?.[userId] > 0 && (
                  <div className="absolute bottom-3 right-4 px-1.5 py-0.5 bg-purple-600 rounded-full font-sans font-black text-[9px] text-white leading-none shadow-sm">
                    {chat.unreadCount[userId]}
                  </div>
                )}
              </div>
            );
          })
          )
        )}
      </div>

      {/* Aesthetic Modal-overlay for Conversation Deletion confirmation */}
      {deletingChat && (
        <div className="absolute inset-x-0 bottom-0 bg-white/95 dark:bg-zinc-950/98 border-t border-rose-100 dark:border-rose-950/40 p-5 rounded-t-[1.5rem] shadow-2xl z-[130] animate-in slide-in-from-bottom duration-250">
          <div className="flex items-start gap-3.5 mb-4">
            <div className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-xs font-bold font-sans text-stone-900 dark:text-stone-100">Delete Conversation?</h5>
              <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400 leading-normal mt-0.5">
                Are you certain you want to remove the entire chat history with <span className="font-extrabold text-purple-500">{deletingChat.otherParticipantName}</span>? This is irreversible.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 text-xs">
            <button
              onClick={() => setDeletingChat(null)}
              className="h-8 px-4 rounded-lg bg-slate-100 hover:bg-slate-205 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold transition-all cursor-pointer"
              disabled={deletingProgress}
            >
              Cancel
            </button>
            <button
              onClick={executeDeleteChat}
              className="h-8 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold flex items-center gap-1.5 shadow-sm shadow-rose-200 dark:shadow-none transition-all cursor-pointer"
              disabled={deletingProgress}
            >
              {deletingProgress ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              <span>Delete Chat</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
