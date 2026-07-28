import React from "react";
import { auth, db } from "../firebase";
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { ProductHistory as ProductHistoryType, Order } from "../types";
import { Trash2, History, ShoppingBag, Loader2, CheckSquare, Square, Package, CheckCircle, RotateCcw, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { handleFirestoreError, OperationType } from "../lib/firebase-errors";
import { cn } from "../lib/utils";

type HistoryItem = {
  id: string;
  type: "viewed" | "delivered";
  name: string;
  price: number;
  imageUrl?: string;
  date: string;
  originalId: string;
  productId?: string;
  hiddenFromHistory?: boolean;
};

interface ProductHistoryProps {
  onBack?: () => void;
}

export default function ProductHistory({ onBack }: ProductHistoryProps) {
  const [historyItems, setHistoryItems] = React.useState<HistoryItem[]>([]);
  const [hiddenItems, setHiddenItems] = React.useState<HistoryItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [showClearConfirm, setShowClearConfirm] = React.useState(false);
  const [showDeleteSelectedConfirm, setShowDeleteSelectedConfirm] = React.useState(false);
  const [clearing, setClearing] = React.useState(false);
  const [view, setView] = React.useState<"recent" | "hidden">("recent");
  
  const [activeProductIds, setActiveProductIds] = React.useState<Set<string>>(new Set());
  const [softDeletedProductIds, setSoftDeletedProductIds] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    if (!auth.currentUser) return;

    const productsQ = query(collection(db, "products"));
    const unsubscribeProducts = onSnapshot(productsQ, (snapshot) => {
      const activeIds = new Set<string>();
      const softDeletedIds = new Set<string>();
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.isDeleted) {
          softDeletedIds.add(doc.id);
        } else {
          activeIds.add(doc.id);
        }
      });
      setActiveProductIds(activeIds);
      setSoftDeletedProductIds(softDeletedIds);
    }, (error) => {
      console.error("Error loading products for deletion check:", error);
    });

    const viewedQ = query(
      collection(db, "product_history"),
      where("userId", "==", auth.currentUser.uid),
      orderBy("viewedAt", "desc")
    );

    const deliveredQ = query(
      collection(db, "orders"),
      where("buyerId", "==", auth.currentUser.uid),
      where("status", "==", "delivered"),
      orderBy("deliveredAt", "desc")
    );

    let viewedData: (HistoryItem & { hiddenFromHistory: boolean })[] = [];
    let deliveredData: (HistoryItem & { hiddenFromHistory: boolean })[] = [];

    const unsubscribeViewed = onSnapshot(viewedQ, (snapshot) => {
      viewedData = Array.from(new Map(snapshot.docs.map(doc => {
        const data = doc.data();
        const item = {
          id: `viewed-${doc.id}`,
          type: "viewed",
          name: data.productName,
          price: data.productPrice,
          imageUrl: data.productImageUrl,
          date: data.viewedAt,
          originalId: doc.id,
          productId: data.productId,
          hiddenFromHistory: data.hiddenFromHistory || false
        } as HistoryItem & { hiddenFromHistory: boolean };
        return [item.id, item];
      })).values());
      updateCombinedHistory();
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "product_history");
    });

    const unsubscribeDelivered = onSnapshot(deliveredQ, (snapshot) => {
      deliveredData = Array.from(new Map(snapshot.docs.map(doc => {
        const data = doc.data();
        const item = {
          id: `delivered-${doc.id}`,
          type: "delivered",
          name: data.productName,
          price: data.totalPrice,
          imageUrl: data.productImageUrl || `https://picsum.photos/seed/${data.productId}/200/200`,
          date: data.deliveredAt || data.createdAt,
          originalId: doc.id,
          productId: data.productId,
          hiddenFromHistory: data.hiddenFromHistory || false
        } as HistoryItem & { hiddenFromHistory: boolean };
        return [item.id, item];
      })).values());

      updateCombinedHistory();
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "orders/delivered");
    });

    const updateCombinedHistory = () => {
      const allCombined = [...viewedData, ...deliveredData];
      const combinedRecent = allCombined.filter(item => !item.hiddenFromHistory).sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      const combinedHidden = allCombined.filter(item => item.hiddenFromHistory).sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setHistoryItems(combinedRecent);
      setHiddenItems(combinedHidden);
      setLoading(false);
    };

    return () => {
      unsubscribeProducts();
      unsubscribeViewed();
      unsubscribeDelivered();
    };
  }, []);

  const currentItems = view === "recent" ? historyItems : hiddenItems;

  const handleDelete = async (item: HistoryItem) => {
    try {
      const col = item.type === "viewed" ? "product_history" : "orders";
      await updateDoc(doc(db, col, item.originalId), { 
        hiddenFromHistory: true
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${item.type === "viewed" ? "product_history" : "orders"}/${item.originalId}`);
    }
  };

  const handleRestore = async (item: HistoryItem) => {
    try {
      const col = item.type === "viewed" ? "product_history" : "orders";
      await updateDoc(doc(db, col, item.originalId), { 
        hiddenFromHistory: false
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${item.type === "viewed" ? "product_history" : "orders"}/${item.originalId}`);
    }
  };

  const clearAll = async () => {
    setClearing(true);
    const promises = currentItems.map(item => {
      const col = item.type === "viewed" ? "product_history" : "orders";
      if (view === "recent") {
        return updateDoc(doc(db, col, item.originalId), { 
          hiddenFromHistory: true
        });
      } else {
        return updateDoc(doc(db, col, item.originalId), { 
          hiddenFromHistory: false
        });
      }
    });

    try {
      await Promise.all(promises);
      setSelectedIds([]);
      setShowClearConfirm(false);
    } catch (error) {
      console.error("Error processing history:", error);
    } finally {
      setClearing(false);
    }
  };

  const processSelected = async () => {
    setClearing(true);
    const selectedItemsList = currentItems.filter(h => selectedIds.includes(h.id));
    const promises = selectedItemsList.map(item => {
      const col = item.type === "viewed" ? "product_history" : "orders";
      if (view === "recent") {
        return updateDoc(doc(db, col, item.originalId), { 
          hiddenFromHistory: true
        });
      } else {
        return updateDoc(doc(db, col, item.originalId), { 
          hiddenFromHistory: false
        });
      }
    });

    try {
      await Promise.all(promises);
      setSelectedIds([]);
      setShowDeleteSelectedConfirm(false);
    } catch (error) {
      console.error("Error processing selected items:", error);
    } finally {
      setClearing(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === currentItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(currentItems.map(h => h.id));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-purple-600 mb-4" />
        <p className="text-slate-500 font-medium">Loading your history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:scale-105 transition-all text-slate-600 dark:text-slate-400 group"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </button>
          )}
          <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/10 rounded-2xl flex items-center justify-center text-purple-600">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white font-display tracking-tight">
              {view === "recent" ? "Product History" : "Restore Hidden Items"}
            </h2>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {view === "recent" ? "Delivered products and recently viewed items" : "Items you've hidden can be restored to your history here"}
            </p>
          </div>
        </div>

        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
          <button
            onClick={() => { setView("recent"); setSelectedIds([]); }}
            className={cn(
              "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              view === "recent" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
          >
            Recent
          </button>
          <button
            onClick={() => { setView("hidden"); setSelectedIds([]); }}
            className={cn(
              "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              view === "hidden" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm" : "text-slate-400 hover:text-slate-600"
            )}
          >
            Restore Items
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 overflow-x-auto pb-2 sm:pb-0">
          {currentItems.length > 0 && (
            <>
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors uppercase tracking-wider whitespace-nowrap"
              >
                {selectedIds.length === currentItems.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                {selectedIds.length === currentItems.length ? "Deselect All" : "Select All"}
              </button>
              {selectedIds.length > 0 && (
                <button
                  onClick={() => setShowDeleteSelectedConfirm(true)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-colors uppercase tracking-wider whitespace-nowrap",
                    view === "recent" ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10" : "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/10"
                  )}
                >
                  {view === "recent" ? <Trash2 className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
                  {view === "recent" ? "Hide" : "Restore"} Selected ({selectedIds.length})
                </button>
              )}
              <button
                onClick={() => setShowClearConfirm(true)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-colors uppercase tracking-wider whitespace-nowrap",
                  view === "recent" ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10" : "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/10"
                )}
              >
                {view === "recent" ? <Trash2 className="w-4 h-4" /> : <RotateCcw className="w-4 h-4" />}
                {view === "recent" ? "Clear Recent" : "Restore All"}
              </button>
            </>
          )}
        </div>
      </div>

      {currentItems.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-12 text-center border border-slate-100 dark:border-slate-800">
          <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-10 h-10 text-slate-200 dark:text-slate-700" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            {view === "recent" ? "No history yet" : "No hidden items"}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            {view === "recent" 
              ? "Delivered products and items you view in the marketplace will appear here."
              : "Items you hide from your history will be listed here for restoration."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {currentItems.map((item, idx) => {
              const isProductDeletedByVendor = item.productId
                ? (softDeletedProductIds.has(item.productId) || !activeProductIds.has(item.productId))
                : false;
              
              return (
                <motion.div
                  key={`${item.type}-${item.id}-${idx}`}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={cn(
                    "group bg-white dark:bg-slate-900 rounded-3xl border p-4 flex gap-4 items-center relative transition-all",
                    isProductDeletedByVendor 
                      ? "border-red-100 dark:border-red-900/30 bg-red-50/10 dark:bg-red-900/5 shadow-sm"
                      : "border-slate-100 dark:border-slate-800"
                  )}
                >
                  <button
                    onClick={() => toggleSelect(item.id)}
                    className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    {selectedIds.includes(item.id) ? <CheckSquare className="w-5 h-5 text-indigo-600" /> : <Square className="w-5 h-5" />}
                  </button>
                  <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0 relative">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {item.type === "delivered" && (
                      <div className="absolute top-1 right-1 bg-emerald-500 text-white p-1 rounded-lg shadow-lg">
                        <CheckCircle className="w-3 h-3" />
                      </div>
                    )}
                    {isProductDeletedByVendor && (
                      <div className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-lg shadow-lg" title="Deleted by Vendor">
                        <Trash2 className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span className={cn(
                        "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded",
                        item.type === "delivered" ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                      )}>
                        {item.type}
                      </span>
                      {isProductDeletedByVendor && (
                        <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400">
                          Deleted by Vendor
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate mb-1">{item.name}</h4>
                    <p className="text-xs font-black text-indigo-600 mb-2">₦{item.price.toLocaleString()}</p>
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                      {item.type === "delivered" ? "Delivered" : "Viewed"} {new Date(item.date).toLocaleDateString()}
                    </p>
                  </div>
                <div className="flex flex-col gap-2">
                  {view === "recent" ? (
                    <button
                      onClick={() => handleDelete(item)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all"
                      title="Hide from history"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRestore(item)}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all group/btn"
                    >
                      <RotateCcw className="w-4 h-4 transition-transform group-hover/btn:rotate-[-45deg]" />
                      <span className="text-xs font-bold uppercase tracking-wider">Restore</span>
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
          </AnimatePresence>
        </div>
      )}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {(showClearConfirm || showDeleteSelectedConfirm) && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100 dark:border-slate-800"
            >
              <div className={cn(
                "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6",
                view === "recent" ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-500" : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-500"
              )}>
                {view === "recent" ? <Trash2 className="w-8 h-8" /> : <RotateCcw className="w-8 h-8" />}
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">
                {showClearConfirm ? (view === "recent" ? "Clear Recent?" : "Restore All?") : (view === "recent" ? "Hide Selected?" : "Restore Selected?")}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-8">
                {showClearConfirm 
                  ? (view === "recent" ? "Are you sure you want to hide all recent history?" : "Are you sure you want to restore all hidden items?")
                  : `Are you sure you want to ${view === "recent" ? "hide" : "restore"} ${selectedIds.length} items?`}
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => { setShowClearConfirm(false); setShowDeleteSelectedConfirm(false); }}
                  disabled={clearing}
                  className="flex-1 py-4 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={showClearConfirm ? clearAll : processSelected}
                  disabled={clearing}
                  className={cn(
                    "flex-1 py-4 text-white rounded-2xl font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50",
                    view === "recent" ? "bg-red-600 hover:bg-red-700 shadow-red-100 dark:shadow-red-900/20" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100 dark:shadow-emerald-900/20"
                  )}
                >
                  {clearing ? <Loader2 className="w-4 h-4 animate-spin" /> : (view === "recent" ? (showClearConfirm ? "Clear All" : "Hide Selected") : (showClearConfirm ? "Restore All" : "Restore Selected"))}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
