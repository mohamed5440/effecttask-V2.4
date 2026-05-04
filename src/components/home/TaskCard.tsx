import React from "react";
import { Task } from "../../types";
import { Users } from "lucide-react";
import { cn } from "../../lib/utils";
import { motion } from "motion/react";
import { StatusBadge, DurationBadge } from "../ui/Badge";
import { formatRelativeTime } from "../../lib/formatters";

interface TaskCardProps {
  task: Task;
  isSelected: boolean;
  onClick: () => void;
  applicantsCount: number;
  isAssignedToMe?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  isSelected,
  onClick,
  applicantsCount,
  isAssignedToMe,
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "card-base p-4 sm:p-5 md:p-6 cursor-pointer flex flex-col hover:border-black/5 min-w-0 text-start",
        isSelected
          ? "border-black translate-y-[-2px]"
          : "border-zinc-100 hover:border-zinc-200",
      )}
    >
      <div className="flex justify-between items-start mb-3 text-start min-w-0">
        <h3 className="font-black text-black leading-tight text-base sm:text-lg break-words line-clamp-2 min-w-0">
          {task.title}
        </h3>
      </div>
      <p className="text-[12px] sm:text-sm text-zinc-500 line-clamp-3 leading-relaxed mb-5 text-start break-words min-w-0">
        {task.description}
      </p>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-4 sm:mt-auto gap-3 sm:gap-2">
        <div className="flex gap-2 flex-wrap min-w-0">
          <StatusBadge status={task.status} />
          <DurationBadge duration={task.duration} />
          {task.status === "open" && (
            <span className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-black text-black whitespace-nowrap">
              <Users className="w-3.5 h-3.5" />
              {applicantsCount}
            </span>
          )}
          {isAssignedToMe && task.status === "in_progress" && (
            <span className="bg-green-500 text-white px-2 py-0.5 rounded-lg text-[10px] font-black">
              تم تعيينها لك
            </span>
          )}
        </div>
        <span className="text-[10px] sm:text-xs text-zinc-400 font-bold whitespace-nowrap shrink-0 ps-2">
          {formatRelativeTime(task.createdAt)}
        </span>
      </div>
    </motion.div>
  );
};
