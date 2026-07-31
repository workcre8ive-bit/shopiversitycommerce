import React from "react";
import { X, AlertTriangle, Send, Loader2, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { auth, db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "../lib/firebase-errors";

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  vendorId: string;
  vendorName: string;
  productId?: string;
}

export default function ReportModal({ isOpen, onClose, vendorId, vendorName, productId }: ReportModalProps) {
  const [reason, setReason] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !reason.trim()) return;

    setLoading(true);
    try {
      await addDoc(collection(db, "reports"), {
        reporterId: auth.currentUser.uid,
        vendorId,
        productId: productId || null,
        reason: reason.trim(),
        createdAt: new Date().toISOString(),
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setReason("");
        onClose();
      }, 2000);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "reports");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-50 dark:bg-red-900/10 rounded-2xl flex items-center justify-center text-red-600">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{productId ? "Report Product" : "Report Vendor"}</h3>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{productId ? "Reporting Product" : "Reporting Vendor"}: {vendorName}</p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {success ? (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-zinc-100 mb-2">Report Submitted</h4>
                  <p className="text-sm text-slate-500 dark:text-zinc-400">Thank you for helping us keep the marketplace safe.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2 text-left">
                    <label className="text-xs font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-widest ml-1">
                      Reason for report
                    </label>
                    <select
                      required
                      value={reason === "Other" || !["Inappropriate content / offensive behavior", "Counterfeit, fake, or scam listing", "Incorrect category grouping", "Illegal, dangerous or prohibited item", "Misleading or false description"].includes(reason) && reason !== "" ? "Other" : reason}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "Other") {
                          setReason("Other");
                        } else {
                          setReason(val);
                        }
                      }}
                      className="w-full h-11 px-4 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl outline-none focus:ring-1 focus:ring-purple-500 text-slate-800 dark:text-zinc-100 font-semibold text-xs cursor-pointer"
                    >
                      <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value="">Select a reason...</option>
                      <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value="Inappropriate content / offensive behavior">Inappropriate content / offensive behavior</option>
                      <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value="Counterfeit, fake, or scam listing">Counterfeit, fake, or scam listing</option>
                      <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value="Incorrect category grouping">Incorrect category grouping</option>
                      <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value="Illegal, dangerous or prohibited item">Illegal, dangerous or prohibited item</option>
                      <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value="Misleading or false description">Misleading or false description</option>
                      <option className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" value="Other">Other (custom description)...</option>
                    </select>
                  </div>

                  {/* Show descriptive textarea when Other is selected */}
                  {(reason === "Other" || (!["Inappropriate content / offensive behavior", "Counterfeit, fake, or scam listing", "Incorrect category grouping", "Illegal, dangerous or prohibited item", "Misleading or false description", ""].includes(reason))) && (
                    <div className="space-y-2 text-left animate-in fade-in duration-200">
                      <label className="text-xs font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-widest ml-1">
                        Describe the issue
                      </label>
                      <textarea
                        required
                        onChange={(e) => setReason(e.target.value === "Other" ? "Other: " : e.target.value)}
                        rows={3}
                        className="w-full p-4 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:bg-white dark:focus:bg-zinc-900 focus:border-purple-500 outline-none transition-all resize-none text-slate-900 dark:text-white text-xs placeholder:text-slate-400"
                        placeholder="Please describe exactly what is wrong with this product or vendor..."
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !reason.trim() || reason === "Other"}
                    className="w-full h-12 bg-red-600 hover:bg-red-750 text-white rounded-xl font-bold hover:shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-40 disabled:scale-100 cursor-pointer text-sm"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Submit Report</>}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
