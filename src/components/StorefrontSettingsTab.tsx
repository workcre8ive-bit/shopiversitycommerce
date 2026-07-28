import React from "react";
import { db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { UserProfile, StorefrontSettings } from "../types";
import { 
  Save, 
  Loader2, 
  Image as ImageIcon, 
  Type, 
  Check, 
  Eye,
  Store,
  Sparkles,
  Upload,
  X,
  GripVertical,
  ArrowUp,
  ArrowDown,
  EyeOff,
  Palette,
  Layout,
  MousePointerClick
} from "lucide-react";
import { motion, AnimatePresence, Reorder, useDragControls } from "motion/react";
import { cn } from "../lib/utils";
import { handleFirestoreError, OperationType } from "../lib/firebase-errors";
import { compressImage } from "../lib/imageUtils";
import SellerStorefront from "./SellerStorefront";

interface StorefrontSettingsTabProps {
  user: UserProfile;
}

interface BlockItemProps {
  key?: any;
  block: any;
  index: number;
  totalLength: number;
  moveBlock: (index: number, direction: "up" | "down") => void;
  toggleBlockVisibility: (id: string) => void;
}

function BlockItem({ block, index, totalLength, moveBlock, toggleBlockVisibility }: BlockItemProps) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={block}
      id={block.id}
      dragListener={false}
      dragControls={dragControls}
      whileDrag={{ 
        scale: 1.02, 
        boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.15), 0 8px 10px -6px rgb(0 0 0 / 0.15)",
        zIndex: 50
      }}
      className={cn(
        "flex items-center justify-between p-4 sm:p-5 rounded-2xl border transition-colors duration-300 select-none touch-none",
        block.visible 
          ? "bg-white dark:bg-slate-900 border-slate-200/80 dark:border-zinc-800/80 shadow-sm" 
          : "bg-slate-100/50 dark:bg-zinc-900/30 border-slate-200/40 dark:border-zinc-850 opacity-60"
      )}
    >
      <div className="flex items-center gap-4">
        <div 
          onPointerDown={(e) => dragControls.start(e)}
          className="cursor-grab active:cursor-grabbing p-2 text-slate-350 dark:text-zinc-650 hover:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
          title="Drag to Reorder"
        >
          <GripVertical className="w-5 h-5 pointer-events-none" />
        </div>
        <div className="text-left">
          <h5 className="text-sm font-black text-slate-800 dark:text-zinc-200 flex items-center gap-2">
            {block.name}
            {block.id === "products" && <span className="text-[9px] px-2 py-0.5 bg-orange-100 dark:bg-orange-950/40 text-orange-600 rounded-md font-extrabold uppercase tracking-wider">Default Catalog</span>}
          </h5>
          <p className="text-[10px] sm:text-xs text-slate-400 dark:text-zinc-500 mt-0.5">{block.desc}</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {/* Move block direction buttons (Accessible fallback) */}
        <button
          type="button"
          disabled={index === 0}
          onClick={() => moveBlock(index, "up")}
          className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent rounded-xl text-slate-500 dark:text-zinc-400 transition-colors"
          title="Move Block Up"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
        <button
          type="button"
          disabled={index === totalLength - 1}
          onClick={() => moveBlock(index, "down")}
          className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent rounded-xl text-slate-500 dark:text-zinc-400 transition-colors"
          title="Move Block Down"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
        
        {/* Visibility toggles */}
        <button
          type="button"
          onClick={() => toggleBlockVisibility(block.id)}
          className={cn(
            "p-2.5 rounded-xl transition-all ml-1.5 cursor-pointer",
            block.visible 
              ? "bg-orange-50 hover:bg-orange-100 text-orange-600 dark:bg-orange-950/20 dark:text-orange-400" 
              : "bg-slate-100 text-slate-400 dark:bg-zinc-800 dark:text-zinc-500"
          )}
          title={block.visible ? "Hide Block" : "Show Block"}
        >
          {block.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
      </div>
    </Reorder.Item>
  );
}

const PRESET_THEMES = [
  {
    id: "minimalist",
    name: "Classic Minimalist",
    theme: "minimal",
    customFont: "Inter",
    primaryColor: "#ff6b00",
    bannerHeight: "medium",
    desc: "A clean, modern, high-contrast style that lets your products do the talking."
  },
  {
    id: "bold-brutalist",
    name: "Brutalist Bold",
    theme: "bold",
    customFont: "Space Grotesk",
    primaryColor: "#ef4444",
    bannerHeight: "large",
    desc: "Loud headings, heavy borders, and highly saturated action elements."
  },
  {
    id: "geek-tech",
    name: "Geek Technical",
    theme: "technical",
    customFont: "JetBrains Mono",
    primaryColor: "#10b981",
    bannerHeight: "small",
    desc: "Monospaced grids, high-density elements, and subtle developer terminal accents."
  },
  {
    id: "boutique-playful",
    name: "Boutique Playful",
    theme: "playful",
    customFont: "Playfair Display",
    primaryColor: "#ec4899",
    bannerHeight: "medium",
    desc: "Elegant serif typography paired with warm pastels for boutique curation."
  }
];

const PRESET_COLORS = [
  { name: "Orange Blaze", value: "#ff6b00" },
  { name: "Royal Sapphire", value: "#2563eb" },
  { name: "Emerald Trust", value: "#10b981" },
  { name: "Crimson Flame", value: "#ef4444" },
  { name: "Rose Whisper", value: "#ec4899" },
  { name: "Cyber Purple", value: "#8b5cf6" },
  { name: "Classic Slate", value: "#475569" }
];

const PRESET_FONTS = [
  { name: "Inter (Clean Sans)", value: "Inter" },
  { name: "Space Grotesk (Tech Display)", value: "Space Grotesk" },
  { name: "JetBrains Mono (Developer)", value: "JetBrains Mono" },
  { name: "Playfair Display (Elegant Serif)", value: "Playfair Display" },
  { name: "Outfit (Modern Geometric)", value: "Outfit" }
];

export default function StorefrontSettingsTab({ user }: StorefrontSettingsTabProps) {
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = React.useState(false);
  
  const defaultBlocks = [
    { id: "banner", name: "Landscape Hero Banner", visible: true, desc: "A customizable image banner at the top of your page." },
    { id: "header", name: "Store Header & Action Buttons", visible: true, desc: "Business name, avatar, rating and chat." },
    { id: "about", name: "About & Business Bio", visible: true, desc: "Story text, base location, and active years." },
    { id: "badges", name: "Escrow & Security Badges", visible: true, desc: "Highlights security features and buyer confidence." },
    { id: "products", name: "Product Catalog & Listings", visible: true, desc: "Categorized listings grid and search tabs." }
  ];

  const defaultSettings: StorefrontSettings = {
    theme: "minimal",
    primaryColor: "#ff6b00",
    bannerHeight: "medium",
    customFont: "Inter",
    businessName: user.businessName || user.storefrontSettings?.businessName || "",
    layoutBlocks: defaultBlocks
  };

  const [settings, setSettings] = React.useState<StorefrontSettings>({
    ...defaultSettings,
    ...(user.storefrontSettings || {})
  });

  // Ensure default layout blocks are present if database has none
  React.useEffect(() => {
    if (!settings.layoutBlocks || settings.layoutBlocks.length === 0) {
      setSettings(prev => ({ ...prev, layoutBlocks: defaultBlocks }));
    }
  }, []);

  // Sync settings when user prop changes (e.g. after save)
  React.useEffect(() => {
    if (user.storefrontSettings) {
      setSettings(prev => ({
        ...defaultSettings,
        ...prev,
        ...user.storefrontSettings,
        layoutBlocks: user.storefrontSettings.layoutBlocks && user.storefrontSettings.layoutBlocks.length > 0 
          ? user.storefrontSettings.layoutBlocks 
          : prev.layoutBlocks || defaultBlocks
      }));
    }
  }, [user.storefrontSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    
    try {
      await updateDoc(doc(db, "users", user.uid), {
        storefrontSettings: settings,
        businessName: settings.businessName || ""
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setLoading(false);
    }
  };

  // Block Reorder Handlers (Dynamic Block reordering)
  const moveBlock = (index: number, direction: "up" | "down") => {
    const blocks = [...(settings.layoutBlocks || defaultBlocks)];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= blocks.length) return;
    
    // Swap elements
    const temp = blocks[index];
    blocks[index] = blocks[targetIndex];
    blocks[targetIndex] = temp;
    
    setSettings({ ...settings, layoutBlocks: blocks });
  };

  const toggleBlockVisibility = (id: string) => {
    const blocks = (settings.layoutBlocks || defaultBlocks).map(block => {
      if (block.id === id) {
        return { ...block, visible: !block.visible };
      }
      return block;
    });
    setSettings({ ...settings, layoutBlocks: blocks });
  };

  const applyPresetTheme = (preset: typeof PRESET_THEMES[0]) => {
    setSettings({
      ...settings,
      theme: preset.theme as any,
      customFont: preset.customFont,
      primaryColor: preset.primaryColor,
      bannerHeight: preset.bannerHeight as any
    });
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="text-left">
            <h3 className="text-2xl font-black italic tracking-tighter text-slate-900 dark:text-white">Storefront Studio & Page Builder</h3>
            <p className="text-sm text-slate-500 font-medium">Design how buyers see your official store page with customized layouts and typography.</p>
          </div>
          <div className="w-12 h-12 bg-orange-50 dark:bg-orange-950/20 rounded-2xl flex items-center justify-center text-orange-600 self-start sm:self-auto shrink-0">
            <Store className="w-6 h-6" />
          </div>
        </div>

        {/* Live Drag & Drop Reordering Block Builder */}
        <div className="mb-10 bg-slate-50 dark:bg-zinc-950 p-6 sm:p-8 rounded-[2.2rem] border border-slate-150 dark:border-zinc-850 text-left">
          <div className="flex items-center gap-2.5 mb-4">
            <Layout className="w-5 h-5 text-orange-500" />
            <h4 className="text-md font-black uppercase tracking-wider text-slate-800 dark:text-zinc-150">Modular Block Customizer</h4>
          </div>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            Drag-and-drop / arrange your storefront sections in any vertical sequence. Enable or disable individual modular blocks to match your specific style.
          </p>

          <Reorder.Group 
            axis="y" 
            values={settings.layoutBlocks || defaultBlocks} 
            onReorder={(newBlocks) => setSettings({ ...settings, layoutBlocks: newBlocks })}
            className="space-y-3"
          >
            {(settings.layoutBlocks || defaultBlocks).map((block, index) => (
              <BlockItem
                key={block.id}
                block={block}
                index={index}
                totalLength={(settings.layoutBlocks || defaultBlocks).length}
                moveBlock={moveBlock}
                toggleBlockVisibility={toggleBlockVisibility}
              />
            ))}
          </Reorder.Group>
        </div>

        <form onSubmit={handleSave} className="space-y-10 text-left">
          {/* Quick-Apply Theme Presets */}
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Sparkles className="w-4 h-4 text-orange-500" />
              One-Click Design Presets (Visual Themes)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PRESET_THEMES.map(preset => {
                const isSelected = settings.theme === preset.theme && settings.customFont === preset.customFont && settings.primaryColor === preset.primaryColor;
                return (
                  <button
                    type="button"
                    key={preset.id}
                    onClick={() => applyPresetTheme(preset)}
                    className={cn(
                      "p-5 rounded-2xl border text-left transition-all duration-300 relative overflow-hidden group cursor-pointer",
                      isSelected 
                        ? "bg-orange-50/25 dark:bg-orange-950/5 border-orange-500 shadow-sm" 
                        : "bg-transparent border-slate-200 dark:border-slate-800 hover:border-slate-350"
                    )}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-6 h-6 rounded-full border border-white" style={{ backgroundColor: preset.primaryColor }} />
                      <h5 className="font-black text-slate-800 dark:text-zinc-200 text-sm leading-none">{preset.name}</h5>
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium leading-relaxed">{preset.desc}</p>
                    
                    {isSelected && (
                      <div className="absolute right-3 top-3 w-5 h-5 bg-orange-600 text-white rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100 dark:border-slate-800">
            {/* Primary Branding Color */}
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                <Palette className="w-4 h-4" />
                Primary Brand Color
              </label>
              
              <div className="flex flex-wrap gap-2 mb-3">
                {PRESET_COLORS.map(color => (
                  <button
                    type="button"
                    key={color.name}
                    onClick={() => setSettings({ ...settings, primaryColor: color.value })}
                    className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 flex items-center justify-center cursor-pointer shadow-sm relative"
                    style={{ backgroundColor: color.value, borderColor: settings.primaryColor === color.value ? "#ffffff" : "transparent" }}
                    title={color.name}
                  >
                    {settings.primaryColor === color.value && (
                      <Check className="w-4 h-4 text-white drop-shadow-md" />
                    )}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <input 
                  type="color"
                  value={settings.primaryColor}
                  onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                  className="w-12 h-11 rounded-xl cursor-pointer border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-1"
                />
                <input 
                  type="text"
                  value={settings.primaryColor}
                  onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                  placeholder="#ff6b00"
                  className="h-11 px-4 w-32 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold font-mono text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Font Pairings */}
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                <ImageIcon className="w-4 h-4" />
                Store Typography
              </label>
              <select
                value={settings.customFont || "Inter"}
                onChange={(e) => setSettings({ ...settings, customFont: e.target.value })}
                className="w-full h-13 px-5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:bg-white focus:border-orange-500 rounded-2xl text-sm font-bold text-slate-800 dark:text-zinc-200 outline-none cursor-pointer"
              >
                {PRESET_FONTS.map(font => (
                  <option key={font.value} value={font.value}>{font.name}</option>
                ))}
              </select>
              <div className="p-3 bg-slate-50 dark:bg-slate-850/60 rounded-xl border border-slate-200/50 dark:border-slate-800/60 text-slate-500">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Typography Preview</p>
                <p className={cn("text-sm font-extrabold text-slate-850 dark:text-zinc-200", 
                  settings.customFont === "Space Grotesk" ? "font-sans tracking-tight" :
                  settings.customFont === "JetBrains Mono" ? "font-mono" :
                  settings.customFont === "Playfair Display" ? "font-serif italic" :
                  settings.customFont === "Outfit" ? "font-sans tracking-tight font-extrabold" : "font-sans"
                )}>
                  The Quick Brown Fox Jumps Over the Lazy Dog
                </p>
              </div>
            </div>
          </div>

          {/* Business Name Setting */}
          <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
             <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
               <Store className="w-4 h-4" />
               Store / Business Name
             </label>
             <input 
               type="text"
               value={settings.businessName}
               onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
               placeholder="e.g. Campus Bites, Tech Guru"
               className="w-full h-14 px-6 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 focus:border-orange-500 rounded-2xl text-base font-bold text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-400"
             />
             <p className="text-[10px] text-slate-400 px-2 italic">This will be shown as your official store name on your profile and listings.</p>
          </div>

          {/* Banner Setting */}
          <div className="space-y-4">
             <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
               <ImageIcon className="w-4 h-4" />
               Store Header Banner & Height
             </label>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
               {["small", "medium", "large"].map(height => (
                 <button
                   type="button"
                   key={height}
                   onClick={() => setSettings({ ...settings, bannerHeight: height as any })}
                   className={cn(
                     "py-3 rounded-xl border text-xs font-black uppercase tracking-widest transition-all cursor-pointer",
                     settings.bannerHeight === height 
                       ? "bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-950" 
                       : "bg-transparent text-slate-500 border-slate-200 hover:border-slate-350 dark:border-slate-800 dark:text-zinc-400"
                   )}
                 >
                   {height} height
                 </button>
               ))}
             </div>

             <div className="grid grid-cols-1 gap-6">
                <div className="space-y-4">
                    <label className={cn(
                      "relative block w-full h-48 border-2 border-dashed rounded-[2rem] overflow-hidden group cursor-pointer transition-all",
                      settings.bannerUrl ? "border-transparent" : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shadow-inner"
                    )}>
                      <input 
                        type="file" 
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const base64 = await compressImage(file, 1200, 400, 0.7);
                              setSettings({ ...settings, bannerUrl: base64 });
                            } catch (err) {
                              console.error("Banner upload error:", err);
                            }
                          }
                        }}
                      />
                      {settings.bannerUrl ? (
                        <>
                          <img 
                            src={settings.bannerUrl} 
                            alt="Banner Preview" 
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                             <Upload className="w-8 h-8 text-white" />
                             <span className="ml-2 text-xs font-black text-white uppercase tracking-widest">Change Banner</span>
                          </div>
                        </>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2 opacity-50 dark:opacity-35 group-hover:opacity-100 transition-all">
                           <Upload className="w-10 h-10 text-slate-400" />
                           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Upload Landscape Banner</span>
                        </div>
                      )}
                    </label>
                    <p className="text-[10px] text-slate-400 px-2 italic font-medium">Standard landscape header banner shared publicly.</p>
                </div>
             </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
             <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                <Type className="w-4 h-4" />
                Store Bio
              </label>
             <textarea 
               value={settings.businessBio || ""}
               onChange={(e) => setSettings({ ...settings, businessBio: e.target.value })}
               placeholder="Tell buyers why they should trust your store, your business hours, and what makes your products/services unique on campus..."
               rows={4}
               className="w-full p-6 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 focus:border-orange-500 rounded-3xl text-sm font-medium text-slate-900 dark:text-white outline-none transition-all resize-none placeholder:text-slate-400"
             />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between pt-8 border-t border-slate-50 dark:border-slate-800 gap-4">
             <div className="flex items-center gap-2 self-start sm:self-auto">
               {success && (
                 <motion.div 
                   initial={{ opacity: 0, x: -10 }}
                   animate={{ opacity: 1, x: 0 }}
                   className="flex items-center gap-2 text-emerald-600 text-xs font-bold"
                 >
                   <Check className="w-4 h-4" />
                   Saved Successfully!
                 </motion.div>
               )}
             </div>
             
             <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
               <button 
                 type="button"
                 onClick={() => setIsPreviewOpen(true)}
                 className="px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-slate-200 border-none cursor-pointer"
               >
                 <Eye className="w-4 h-4" />
                 Preview Store
               </button>
               <button 
                 type="submit"
                 disabled={loading}
                 className="px-8 py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 border-none outline-none cursor-pointer"
               >
                 {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                 Save Settings
               </button>
             </div>
          </div>
        </form>
      </div>

      {/* Pro Tip Card */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden group text-left">
         <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest">
              <Sparkles className="w-3 h-3 text-amber-300" />
              Pro Seller Tip
            </div>
            <h4 className="text-2xl font-black italic tracking-tighter leading-none">Your store identity matters.</h4>
            <p className="text-sm text-orange-50 max-w-lg font-medium leading-relaxed">Verified vendors who use high-quality banners, complete bios, and a structured layout see 40% higher conversion rates. Make your campus brand stand out!</p>
         </div>
         <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24 blur-3xl group-hover:bg-white/20 transition-all duration-1000" />
      </div>

      {/* Immersive Storefront Live Preview Modal */}
      <AnimatePresence>
        {isPreviewOpen && (
          <div className="fixed inset-0 z-[500] bg-slate-900/60 backdrop-blur-xl overflow-y-auto p-4 sm:p-10 flex min-h-screen items-start justify-center">
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 15 }}
              className="bg-stone-50 dark:bg-slate-950 rounded-[3rem] w-full max-w-7xl shadow-2xl relative border border-stone-200/60 dark:border-slate-800 p-6 sm:p-10 space-y-6 mt-4 mb-4 text-left"
            >
              {/* Modal Header */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-stone-200/60 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-950/20 text-orange-600 rounded-2xl flex items-center justify-center">
                    <Eye className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase leading-none italic tracking-tight">Interactive Storefront Preview</h3>
                    <p className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-widest mt-1">Simulated Live Environment — Close to return to customization</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={() => setIsPreviewOpen(false)}
                    className="h-11 px-6 rounded-2xl bg-slate-950 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-900 dark:hover:bg-slate-100 transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2 border border-slate-200/40 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    Close Preview
                  </button>
                </div>
              </div>

              {/* Store Component Container */}
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 border border-stone-100 dark:border-slate-800 min-h-[500px]">
                <SellerStorefront 
                  sellerId={user.uid}
                  currentUser={user}
                  previewSettings={settings}
                  onBack={() => setIsPreviewOpen(false)}
                  onAddToCart={(product, menuItem) => {
                    // Simulated interaction
                  }}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
