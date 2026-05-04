import React from "react";
import { Link } from "react-router-dom";
import { Star, Briefcase } from "lucide-react";
import { motion } from "motion/react";
import { User, Task, TaskApplication, ApplicationStatus } from "../../types";
import { StatusBadge } from "../ui/Badge";
import { formatDuration } from "../../lib/formatters";

interface ApplicantCardProps {
  application: TaskApplication;
  applicant: User;
  task: Task;
  isAdmin?: boolean;
  onUpdateStatus: (id: string, status: ApplicationStatus) => void;
  onReject: (id: string) => void;
}

export const ApplicantCard: React.FC<ApplicantCardProps> = ({
  application,
  applicant,
  isAdmin,
  onUpdateStatus,
  onReject,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card-base p-4 sm:p-5 md:p-6 lg:p-6 flex flex-col lg:flex-row gap-3 sm:gap-4 lg:gap-6 text-start"
    >
      <div className="flex flex-col lg:flex-row gap-5 lg:gap-8 items-start lg:items-stretch">
        <div className="flex gap-4 sm:gap-6 items-start lg:w-1/3 justify-start min-w-0 shrink-0 w-full">
          <Link
            to={`/profile/${applicant.id}`}
            className="shrink-0 pt-0.5 group"
          >
            <div className="relative">
              <img
                src={
                  applicant.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(applicant.name || "User")}&background=000&color=fff`
                }
                alt=""
                loading="lazy"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl border border-zinc-100 bg-white object-cover aspect-square group-hover:border-black transition-all"
              />
              <div className="absolute -bottom-1 -end-1 bg-white p-1 rounded-lg border border-zinc-100">
                <div className="flex items-center gap-0.5 text-[10px] font-black text-black font-sans">
                  <Star className="w-2.5 h-2.5 fill-black" />
                  {(applicant.rating ?? 0).toFixed(1)}
                </div>
              </div>
            </div>
          </Link>
          <div className="text-start min-w-0 flex-1 pt-1">
            <Link
              to={`/profile/${applicant.id}`}
              className="font-black text-black text-base lg:text-xl hover:underline decoration-2 underline-offset-4 break-words line-clamp-2 leading-tight uppercase tracking-tight"
            >
              {applicant.name}
            </Link>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] lg:text-xs text-zinc-500 mt-3 justify-start uppercase tracking-widest font-bold">
              <span className="flex items-center gap-1.5 whitespace-nowrap bg-zinc-50 px-2 py-1 rounded-lg">
                <Briefcase className="w-3.5 h-3.5 shrink-0" />
                {applicant.completedTasksCount} مهمة
              </span>
            </div>
          </div>
        </div>
        <div className="lg:w-2/3 flex-1 flex flex-col justify-between gap-4 lg:border-s lg:border-zinc-100 lg:ps-8 min-w-0 w-full border-t border-zinc-50 pt-5 lg:border-t-0 lg:pt-0">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 justify-start">
              {application.budget && (
                <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-xl text-[10px] font-bold border border-amber-100">
                  عرض السعر: {application.budget}
                </span>
              )}
              {application.estimatedDuration && (
                <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-xl text-[10px] font-bold border border-blue-100">
                  مدة التنفيذ: {formatDuration(application.estimatedDuration)}
                </span>
              )}
            </div>
            <p className="text-sm text-zinc-600 leading-relaxed text-start break-words min-w-0">
              {application.comment}
            </p>
            {application.attachments && application.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 justify-start mt-2">
                {application.attachments?.map((url, idx) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    referrerPolicy="no-referrer"
                    className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 px-2.5 py-1.5 rounded-xl text-[10px] font-bold text-black hover:bg-zinc-100 transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>
                    مرفق {idx + 1}
                  </a>
                ))}
              </div>
            )}
          </div>
          {isAdmin &&
            application.status !== "accepted" &&
            application.status !== "rejected" && (
              <div className="flex flex-col sm:flex-row gap-2 justify-end mt-auto pt-4 border-t border-zinc-50 border-dashed sm:border-t-0">
                <div className="order-2 sm:order-1 flex gap-2 w-full sm:w-auto">
                  {application.status !== "backup" && (
                    <button
                      onClick={() => onUpdateStatus(application.id, "backup")}
                      className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold text-zinc-500 hover:bg-black hover:text-white transition-colors border border-zinc-100 sm:border-transparent font-sans"
                    >
                      احتياط
                    </button>
                  )}
                  <button
                    onClick={() => onReject(application.id)}
                    className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 border border-red-200 sm:border-transparent transition-colors font-sans"
                  >
                    استبعاد
                  </button>
                </div>
                <button
                  onClick={() => onUpdateStatus(application.id, "accepted")}
                  className="order-1 sm:order-2 w-full sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-black hover:bg-zinc-800 transition-all active:scale-95 flex items-center justify-center gap-1.5 font-sans"
                >
                  قبول وتعيين
                </button>
              </div>
            )}
            
          {(application.status === "accepted" || application.status === "rejected" || (application.status === "backup" && !isAdmin)) && (
            <div className="flex justify-end mt-auto pt-4">
              <StatusBadge status={application.status} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
