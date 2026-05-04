import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Star } from "lucide-react";
import { cn } from "../../lib/utils";
import { Task } from "../../types";

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTask: Task | null;
  onSubmit: (
    taskId: string,
    userId: string,
    rating: number,
    comment: string,
  ) => void;
}

export const RatingModal: React.FC<RatingModalProps> = ({
  isOpen,
  onClose,
  selectedTask,
  onSubmit,
}) => {
  const [ratingData, setRatingData] = useState({ rating: 0, comment: "" });
  const [hoveredStar, setHoveredStar] = useState(0);

  const handleSubmit = () => {
    if (ratingData.rating > 0 && selectedTask?.assignedToUser) {
      onSubmit(
        selectedTask.id,
        selectedTask.assignedToUser,
        ratingData.rating,
        ratingData.comment,
      );
      onClose();
      setRatingData({ rating: 0, comment: "" });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && selectedTask && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-t-xl sm:rounded-xl w-full sm:w-[calc(100%-2rem)] max-w-sm flex flex-col border border-zinc-100 overflow-hidden pb-6 sm:pb-0 font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-zinc-100 flex justify-between items-center bg-white text-start shrink-0">
              <h2 className="text-lg font-bold text-black uppercase tracking-tight">
                تقييم العضو
              </h2>
              <button
                onClick={onClose}
                className="text-zinc-400 hover:text-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-6 bg-white text-start overflow-y-auto flex-1">
              <div className="flex justify-center gap-2 mb-6" dir="ltr">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    onClick={() =>
                      setRatingData({ ...ratingData, rating: star })
                    }
                    className="p-1 focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={cn(
                        "w-8 h-8 transition-colors",
                        (hoveredStar || ratingData.rating) >= star
                          ? "fill-black text-black"
                          : "text-zinc-200",
                      )}
                    />
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-zinc-700 px-1">
                  ملاحظات التقييم
                </label>
                <textarea
                  rows={3}
                  value={ratingData.comment}
                  onChange={(e) =>
                    setRatingData({ ...ratingData, comment: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-zinc-100 focus:outline-none focus:ring-1 focus:ring-black/10 focus:border-black/20 transition-all resize-none text-sm font-sans font-medium text-start bg-zinc-50/50"
                  placeholder=""
                />
              </div>
            </div>
            <div className="px-4 sm:px-6 py-4 border-t border-zinc-100 bg-white flex flex-col sm:flex-row justify-end gap-3 shrink-0">
              <button
                onClick={onClose}
                className="order-2 sm:order-1 w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-zinc-500 hover:bg-zinc-100 transition-colors text-sm"
              >
                إلغاء
              </button>
              <button
                onClick={handleSubmit}
                disabled={ratingData.rating === 0}
                className="order-1 sm:order-2 w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-white bg-black hover:bg-zinc-800 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                حفظ وإنهاء المهمة
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
