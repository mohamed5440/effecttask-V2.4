import React from "react";
import { Star, CheckCircle } from "lucide-react";
import { motion } from "motion/react";
import { User } from "../../types";

interface ProfileHeaderProps {
  user: User;
  isOwnProfile: boolean;
  onEdit: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  isOwnProfile,
  onEdit,
}) => {
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="card-base p-4 sm:p-6 md:p-10 flex flex-col md:flex-row items-center md:items-start gap-5 sm:gap-6 md:gap-10 relative text-start w-full"
    >
      <div className="relative group shrink-0 w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 xl:w-44 xl:h-44">
        <img
          src={
            user.avatar ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "مستخدم")}&background=000&color=fff`
          }
          alt={user.name}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="w-full h-full rounded-xl object-cover aspect-square bg-zinc-50 border border-zinc-100 transition-all duration-500 group-hover:border-black"
        />
      </div>

      <div className="flex-1 text-center md:text-start w-full min-w-0 flex flex-col items-center md:items-start">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full mb-6 sm:mb-8">
          <div className="w-full min-w-0 flex flex-col items-center md:items-start space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-black tracking-tight break-words uppercase leading-tight">
                {user.name}
              </h1>
              {user.isOnline && (
                <span className="flex items-center gap-1.5 px-2 py-0.5 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-wider border border-green-100 mt-1 sm:mt-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  متصل الآن
                </span>
              )}
            </div>
            <p className="text-zinc-400 font-black text-[9px] sm:text-xs tracking-[0.2em] uppercase">
              {user.role === "admin" ? "مدير النظام" : "عضو فريق عمل"}
            </p>
          </div>

          {isOwnProfile && (
            <div className="flex flex-col w-full sm:w-auto shrink-0 mt-2 md:mt-0">
              <button
                onClick={onEdit}
                className="w-full sm:w-auto px-10 py-4 sm:py-3 bg-black text-white border border-transparent rounded-xl text-xs font-black uppercase tracking-widest hover:bg-zinc-800 transition-all active:scale-95"
              >
                تعديل الملف
              </button>
            </div>
          )}
        </div>

        <div className="mb-8 w-full max-w-4xl px-2 sm:px-0">
          <p className="text-zinc-500 text-sm sm:text-base leading-relaxed font-medium break-words">
            {user.bio || "لا يوجد نبذة شخصية متاحة حالياً."}
          </p>
        </div>

        <div className="flex flex-row justify-center md:justify-start gap-8 sm:gap-12 md:gap-16 mb-8 w-full border-y border-zinc-100/50 py-6 sm:border-none sm:py-0">
          <div className="flex flex-col items-center md:items-start">
            <span className="text-[9px] sm:text-[10px] text-zinc-400 mb-1 sm:mb-2 uppercase tracking-widest font-bold">
              التقييم
            </span>
            <div className="flex items-center gap-2 font-black text-lg sm:text-2xl text-black font-sans">
              <Star className="w-4 h-4 sm:w-5 sm:h-5 text-black fill-black" />
              {(user.rating ?? 0).toFixed(1)}
            </div>
          </div>
          <div className="flex flex-col items-center md:items-start border-s border-zinc-100 ps-8 sm:ps-0 sm:border-none">
            <span className="text-[9px] sm:text-[10px] text-zinc-400 mb-1 sm:mb-2 uppercase tracking-widest font-bold">
              الإنجازات
            </span>
            <div className="flex items-center gap-2 font-black text-lg sm:text-2xl text-black font-sans">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-300" />
              {user.completedTasksCount}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-center md:justify-start gap-2 pt-0 sm:pt-6">
          {user.skills?.map((skill) => (
            <span
              key={skill}
              className="px-3 py-1.5 bg-zinc-50/50 text-black rounded-xl text-[9px] sm:text-[10px] font-bold border border-zinc-100 uppercase tracking-tight hover:border-black/20 transition-colors"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
