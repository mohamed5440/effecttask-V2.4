import React from "react";
import { Star, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { motion } from "motion/react";
import { Review } from "../../types";
import { cn } from "../../lib/utils";

interface ProfileReviewsProps {
  reviews: Review[];
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export const ProfileReviews: React.FC<ProfileReviewsProps> = ({ reviews }) => {
  return (
    <div className="space-y-6 text-start">
      <div className="flex items-center justify-between px-2">
        <h2 className="text-lg font-bold text-black flex items-center gap-2 tracking-tight">
          <MessageSquare className="w-5 h-5 text-black" />
          آراء المسؤولين
        </h2>
      </div>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-4 px-2"
      >
        {reviews.length === 0 ? (
          <div className="text-xs font-bold text-zinc-400 p-8 text-center bg-white rounded-xl border border-zinc-100 border-dashed uppercase tracking-widest">
            لا توجد تقييمات مكتوبة بعد
          </div>
        ) : (
          reviews.map((review) => (
            <motion.div
              key={review.id}
              variants={item}
              className="card-base p-4 sm:p-5 relative text-start transition-colors"
            >
              <div className="flex items-center gap-1 mb-2 justify-end">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "w-3 h-3",
                      i < review.rating
                        ? "fill-black text-black"
                        : "text-zinc-200",
                    )}
                  />
                ))}
              </div>
              <p className="text-xs text-zinc-600 leading-relaxed mb-3 pe-2 border-e-2 border-dashed border-zinc-100">
                "{review.comment}"
              </p>
              <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                  منذ {formatDistanceToNow(review.createdAt, { locale: ar })}
                </span>
              </div>
            </motion.div>
          ))
        )}
      </motion.div>
    </div>
  );
};
