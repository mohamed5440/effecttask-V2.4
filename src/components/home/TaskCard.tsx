import React from "react";
import { Task } from "../../types";
import { Users, CheckCircle } from "lucide-react";
import { cn } from "../../lib/utils";
import { motion } from "motion/react";
import { StatusBadge } from "../ui/Badge";
import { formatRelativeTime } from "../../lib/formatters";

interface TaskCardProps {
  task: Task;
  isSelected: boolean;
  onClick: () => void;
  applicantsCount: number;
  isAssignedToMe?: boolean;
  isSidebarLayout?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  isSelected,
  onClick,
  applicantsCount,
  isAssignedToMe,
  isSidebarLayout,
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "card-base cursor-pointer flex flex-col hover:border-black/10 min-w-0 text-start transition-all relative group",
        isSidebarLayout ? "p-3.5 min-h-[90px]" : "p-4 sm:p-5 min-h-[120px]",
        isSelected
          ? "border-black bg-zinc-50/50 shadow-sm"
          : "border-zinc-100 hover:bg-zinc-50/20 hover:shadow-md hover:shadow-black/[0.01]",
      )}
    >
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex justify-between items-start gap-4">
          <h3 className={cn(
            "font-black text-black leading-tight break-words min-w-0 flex-1 text-sm sm:text-base",
            isSidebarLayout ? "line-clamp-2" : "line-clamp-2"
          )}>
            {task.title}
          </h3>
          <span className="text-[10px] text-zinc-400 font-bold whitespace-nowrap shrink-0 px-2 py-0.5 rounded bg-zinc-50 border border-zinc-100 tracking-tighter uppercase">
            {formatRelativeTime(task.createdAt)}
          </span>
        </div>
        
        {task.description && (
          <p className="text-[11px] sm:text-xs text-zinc-500 line-clamp-2 leading-relaxed text-start break-words min-w-0">
            {task.description}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mt-auto pt-3 border-t border-zinc-50">
        <StatusBadge status={task.status} className="h-5 px-2 text-[9px] font-black" />
        
        {task.status === "open" && (
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-zinc-50 text-zinc-600 rounded border border-zinc-100 text-[9px] font-bold">
            <Users className="w-2.5 h-2.5 text-zinc-400" />
            {applicantsCount}
          </div>
        )}

        {task.requiredSkills && task.requiredSkills.length > 0 && (
          <div className="flex gap-1">
            {task.requiredSkills.slice(0, 1).map((skill) => (
              <span key={skill} className="px-1.5 py-0.5 bg-black/[0.03] text-black/40 rounded text-[9px] font-bold border border-black/[0.05]">
                {skill}
              </span>
            ))}
            {task.requiredSkills.length > 1 && (
              <span className="text-[9px] font-bold text-zinc-300">+{task.requiredSkills.length - 1}</span>
            )}
          </div>
        )}

        {isAssignedToMe && (
          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-black text-white rounded text-[9px] font-bold ms-auto">
            <CheckCircle className="w-2.5 h-2.5" />
            {task.status === "completed" ? "أنجزت" : "مهمتك"}
          </div>
        )}
      </div>
    </motion.div>
  );
};
