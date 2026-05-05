import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Upload, CheckCircle2 } from "lucide-react";
import { useStore } from "../../store";
import { cn } from "../../lib/utils";
import { formatDuration } from "../../lib/formatters";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: {
    title: string;
    description: string;
    skills: string;
    duration: string;
    attachments: string[];
  }) => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    skills: "",
    duration: "",
    attachments: [] as string[],
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isDurationFocused, setIsDurationFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadFile = useStore((state) => state.uploadFile);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(newTask);
    setNewTask({
      title: "",
      description: "",
      skills: "",
      duration: "",
      attachments: [],
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const url = await uploadFile("attachments", file);
      if (url) {
        setNewTask((prev) => ({ ...prev, attachments: [...prev.attachments, url] }));
      }
      setIsUploading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4"
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
                  نشر مهمة جديدة
                </h2>
                <p className="text-sm font-medium text-zinc-400">
                  املأ البيانات التالية لتبدأ في استقبال العروض من المحترفين
                </p>
              </div>

              <form
                id="create-task-form"
                onSubmit={handleSubmit}
                className="space-y-8 text-start"
              >
                <div className="space-y-2">
                  <label className="block text-xs font-black text-black px-1 uppercase tracking-widest">
                    عنوان المهمة
                  </label>
                  <input
                    required
                    type="text"
                    value={newTask.title}
                    onChange={(e) =>
                      setNewTask({ ...newTask, title: e.target.value })
                    }
                    className="w-full px-5 py-4 placeholder:text-zinc-300 rounded-xl border border-zinc-100 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all font-sans text-base bg-zinc-50/50"
                    placeholder=""
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-black text-black px-1 uppercase tracking-widest">
                    التفاصيل والشروط
                  </label>
                  <textarea
                    required
                    rows={5}
                    value={newTask.description}
                    onChange={(e) =>
                      setNewTask({ ...newTask, description: e.target.value })
                    }
                    className="w-full px-5 py-4 placeholder:text-zinc-300 rounded-xl border border-zinc-100 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all resize-none font-sans text-base bg-zinc-50/50 min-h-[160px]"
                    placeholder=""
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-black px-1 uppercase tracking-widest">
                      المهارات (اختياري)
                    </label>
                    <input
                      type="text"
                      value={newTask.skills}
                      onChange={(e) =>
                        setNewTask({ ...newTask, skills: e.target.value })
                      }
                      className="w-full px-5 py-4 placeholder:text-zinc-300 rounded-xl border border-zinc-100 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all font-sans text-base bg-zinc-50/50"
                      placeholder=""
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-black px-1 uppercase tracking-widest">
                      المدة (ساعات)
                    </label>
                    <div className="relative group/duration">
                      <input
                        required
                        type="number"
                        min="1"
                        value={newTask.duration}
                        onChange={(e) =>
                          setNewTask({ ...newTask, duration: e.target.value })
                        }
                        onFocus={() => setIsDurationFocused(true)}
                        onBlur={() => setIsDurationFocused(false)}
                        className={cn(
                          "w-full px-5 py-4 rounded-xl border border-zinc-100 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all font-sans text-base bg-zinc-50/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                          !isDurationFocused && newTask.duration ? "text-transparent" : "text-black"
                        )}
                        placeholder=""
                      />
                      {!isDurationFocused && newTask.duration && (
                        <div className="absolute inset-y-0 end-5 flex items-center pointer-events-none">
                          <span className="text-base font-bold text-black font-sans">
                            {formatDuration(newTask.duration)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 sm:p-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all ${
                      newTask.attachments.length > 0
                        ? "border-green-200 bg-green-50/30"
                        : "border-zinc-100 hover:border-black hover:bg-zinc-50 bg-zinc-50/50"
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-black/10 border-t-black rounded-full animate-spin" />
                        <span className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em]">
                          جاري الرفع...
                        </span>
                      </div>
                    ) : newTask.attachments.length > 0 ? (
                      <>
                        <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center">
                          <CheckCircle2 className="w-10 h-10 text-green-600" />
                        </div>
                        <div className="text-center">
                          <p className="text-base font-bold text-green-800 mb-1">
                            تم رفع {newTask.attachments.length} مرفقات بنجاح
                          </p>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setNewTask((prev) => ({
                                ...prev,
                                attachments: [],
                              }));
                            }}
                            className="text-[10px] uppercase tracking-widest text-red-500 font-black hover:underline"
                          >
                            إلغاء كل الملفات
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center border border-zinc-100 group-hover/upload:scale-110 transition-transform">
                          <Upload className="w-8 h-8 text-zinc-300" />
                        </div>
                        <div className="text-center">
                          <p className="text-base font-bold text-black mb-1">
                            رفع مرفقات المهمة
                          </p>
                          <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">
                            صور، مستندات، أو روابط
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="pt-6 flex flex-col sm:flex-row items-center gap-4">
                  <button
                    type="submit"
                    className="w-full sm:flex-1 py-5 rounded-xl font-black text-white bg-black hover:bg-zinc-800 transition-all text-base active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <span>نشر المهمة الآن</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto px-8 py-5 rounded-xl font-bold text-zinc-400 hover:text-black transition-colors text-base"
                  >
                    إلغاء
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
