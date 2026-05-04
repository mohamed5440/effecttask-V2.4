import React from "react";
import { Link } from "react-router-dom";
import { Star, Briefcase, Award, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { motion } from "motion/react";
import { User, Review } from "../../types";

interface MemberCardProps {
  user: User;
  index: number;
  reviews: Review[];
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export const MemberCard: React.FC<MemberCardProps> = ({
  user,
  index,
  reviews,
}) => {
  const userReviews = reviews
    .filter((r) => r.userId === user.id)
    .sort((a, b) => b.createdAt - a.createdAt);

  return (
    <motion.div variants={item}>
      <Link
        to={`/profile/${user.id}`}
        className="card-base p-4 sm:p-5 md:p-6 lg:p-8 block relative group hover:border-black/10 flex flex-col h-full text-start"
      >
        {index < 3 && (
          <div className="absolute top-0 start-6 px-3 py-1.5 rounded-b-xl font-bold text-[10px] flex items-center gap-1 uppercase tracking-widest bg-black text-white">
            <Award className="w-3 h-3" />
            {index === 0
              ? "الأفضل أداءً"
              : index === 1
                ? "وصيف أول"
                : "وصيف ثانٍ"}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center text-center sm:items-start sm:text-start mt-4 sm:mt-2 min-w-0">
          <img
            src={
              user.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "User")}&background=000&color=fff`
            }
            alt={user.name}
            loading="lazy"
            className="w-20 h-20 sm:w-24 sm:h-24 md:w-20 md:h-20 rounded-xl object-cover aspect-square border border-zinc-100 bg-white transition-all duration-500 group-hover:border-black shrink-0"
          />
          {user.isOnline && (
            <div className="absolute top-2 right-2 w-3 h-3 bg-green-500 rounded-full border-2 border-white z-10" />
          )}
          <div className="flex-1 min-w-0 flex flex-col items-center sm:items-start w-full">
            <h2 className="text-base sm:text-2xl font-black text-black leading-tight mb-1 sm:mb-2 break-words line-clamp-1 sm:line-clamp-2 uppercase">
              {user.name}
            </h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] sm:text-sm text-zinc-500 mb-4 sm:mb-6 justify-start uppercase tracking-tight">
              <span className="flex items-center gap-1.5 font-black text-black whitespace-nowrap">
                <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black fill-black" />
                {(user.rating ?? 0).toFixed(1)}
              </span>
              <span className="flex items-center gap-1.5 font-bold whitespace-nowrap">
                <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-400" />
                {user.completedTasksCount} مهمة
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
              {user.skills?.map((skill) => (
                <span
                  key={skill}
                  className="px-2.5 py-1 bg-white text-black rounded-lg text-[10px] font-bold border border-zinc-200 uppercase tracking-tight whitespace-nowrap"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {userReviews.length > 0 && (
          <div className="mt-8 pt-6 border-t border-zinc-100">
            <h3 className="text-sm font-bold text-black mb-3 flex items-center gap-2 justify-start">
              <MessageSquare className="w-4 h-4 text-black" />
              أحدث التقييمات
            </h3>
            <div className="space-y-3">
              {userReviews.slice(0, 2).map((review) => (
                <div
                  key={review.id}
                  className="bg-white p-3 rounded-xl border border-zinc-100/50 text-start"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex text-black">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${i < review.rating ? "fill-current" : "text-zinc-200"}`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-zinc-400 font-bold">
                      {formatDistanceToNow(review.createdAt, { locale: ar })}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600 leading-relaxed ps-2 border-s-2 border-dashed border-zinc-100">
                    "{review.comment}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Link>
    </motion.div>
  );
};
