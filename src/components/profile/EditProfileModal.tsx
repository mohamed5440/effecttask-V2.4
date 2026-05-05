import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Camera, X } from "lucide-react";
import { User } from "../../types";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onSave: (data: {
    name: string;
    skills: string[];
    bio: string;
    avatar: string;
  }) => Promise<void>;
  onUploadAvatar: (file: File) => Promise<string | null>;
  error?: string | null;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onSave,
  onUploadAvatar,
  error,
}) => {
  const [editData, setEditData] = useState({
    name: "",
    skills: "",
    bio: "",
    avatar: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setEditData({
        name: user.name,
        skills: user.skills.join(", "),
        bio: user.bio || "",
        avatar: user.avatar || "",
      });
    }
  }, [user]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingAvatar(true);
      const publicUrl = await onUploadAvatar(file);
      setIsUploadingAvatar(false);
      if (publicUrl) {
        setEditData((prev) => ({ ...prev, avatar: publicUrl }));
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const skills = editData.skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    await onSave({
      name: editData.name,
      skills,
      bio: editData.bio,
      avatar: editData.avatar,
    });
    setIsSaving(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 text-start"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="bg-white rounded-xl w-full max-w-4xl border border-zinc-100 flex flex-col max-h-[90vh] overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button Integrated - Top Corner */}
            <button
              onClick={onClose}
              className="absolute top-6 start-6 p-2 bg-zinc-50 rounded-xl text-zinc-400 hover:text-black hover:bg-zinc-100 transition-all z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="px-6 sm:px-12 py-10 overflow-y-auto custom-scrollbar">
              <div className="mb-8 text-center sm:text-start">
                <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight mb-2">
                  تعديل الملف الشخصي
                </h2>
                <p className="text-sm font-medium text-zinc-400 leading-relaxed max-w-lg">
                  قم بتحديث بياناتك وصورتك الشخصية ليتمكن المسؤولون من تقييمك بشكل أفضل
                </p>
              </div>

              {error && (
                <div className="mb-10 p-4 bg-red-50 border border-red-100 rounded-xl text-center flex items-center justify-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                  <p className="text-xs font-bold text-red-600 font-sans tracking-tight">
                    {error}
                  </p>
                </div>
              )}

              <div className="space-y-10">
                {/* Avatar Section */}
                <div className="flex flex-col items-center sm:items-start gap-1">
                  <label className="block text-xs font-black text-black px-1 uppercase tracking-widest mb-2">
                    الصورة الشخصية
                  </label>
                  <div className="relative group">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                      accept="image/*"
                    />
                    <div
                      onClick={() => !isUploadingAvatar && fileInputRef.current?.click()}
                      className={`relative w-32 h-32 sm:w-40 sm:h-40 rounded-2xl overflow-hidden cursor-pointer bg-zinc-50 border-2 transition-all group/avatar ${
                        isUploadingAvatar ? "opacity-50 cursor-wait border-zinc-100" : "border-zinc-100 hover:border-black"
                      }`}
                    >
                      <img
                        src={
                          editData.avatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(editData.name || "مستخدم")}&background=000&color=fff`
                        }
                        alt="معاينة"
                        className="w-full h-full object-cover transition-transform group-hover/avatar:scale-105"
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10">
                        {!isUploadingAvatar && <Camera className="w-8 h-8 text-white" />}
                      </div>
                      
                      {isUploadingAvatar && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                           <div className="w-8 h-8 border-3 border-black/10 border-t-black rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                    <p className="mt-3 text-[10px] text-zinc-400 font-black uppercase tracking-widest text-center sm:text-start px-2">
                      {isUploadingAvatar ? "جاري الرفع..." : "انقر لتغيير الصورة"}
                    </p>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="grid grid-cols-1 gap-8">
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-black px-1 uppercase tracking-widest">
                      الاسم بالكامل
                    </label>
                    <input
                      type="text"
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="w-full px-5 py-4 placeholder:text-zinc-300 rounded-xl border border-zinc-100 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all font-sans text-base bg-zinc-50/50"
                      placeholder=""
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-black text-black px-1 uppercase tracking-widest">
                      النبذة التعريفية
                    </label>
                    <textarea
                      value={editData.bio}
                      onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                      rows={5}
                      className="w-full px-5 py-4 placeholder:text-zinc-300 rounded-xl border border-zinc-100 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all font-sans text-base bg-zinc-50/50 min-h-[140px] resize-none"
                      placeholder=""
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-black text-black px-1 uppercase tracking-widest">
                      المهارات
                    </label>
                    <input
                      type="text"
                      value={editData.skills}
                      onChange={(e) => setEditData({ ...editData, skills: e.target.value })}
                      className="w-full px-5 py-4 placeholder:text-zinc-300 rounded-xl border border-zinc-100 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all font-sans text-base bg-zinc-50/50"
                      placeholder=""
                    />
                    <p className="text-[10px] text-zinc-400 font-black px-1 uppercase tracking-widest">
                      افصل بين المهارات بفاصلة ( , )
                    </p>
                  </div>
                </div>

                <div className="pt-6 flex flex-col sm:flex-row items-center gap-4">
                  <button
                    onClick={handleSave}
                    disabled={isSaving || isUploadingAvatar}
                    className="w-full sm:flex-1 py-5 rounded-xl font-black text-white bg-black hover:bg-zinc-800 transition-all text-base active:scale-[0.98] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? "جاري الحفظ..." : "حفظ التغييرات"}
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto px-8 py-5 rounded-xl font-bold text-zinc-400 hover:text-black transition-colors text-base"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
