import React, { useState } from "react";
import {
  Target,
  LayoutGrid,
  List,
  Clock,
  PlayCircle,
  CheckCircle2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { motion, AnimatePresence } from "motion/react";
import { Task, TaskApplication } from "../../types";
import { cn } from "../../lib/utils";

interface ProfileTasksProps {
  tasks: Task[];
  applications: TaskApplication[];
  isOwnProfile?: boolean;
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

export const ProfileTasks: React.FC<ProfileTasksProps> = ({
  tasks,
  applications,
  isOwnProfile,
}) => {
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");

  // Categorize tasks for Kanban
  // Only show applications that are still pending
  const pendingApps = (applications || []).filter(app => app.status === "pending");
  
  // Show tasks assigned to this user that are in progress
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress"); 
  
  // Show tasks assigned to this user that are completed
  const completedTasks = tasks.filter((t) => t.status === "completed");

  const kanbanColumns = [
    {
      id: "pending",
      title: "قيد الانتظار",
      icon: <Clock className="w-4 h-4 text-amber-500" />,
      tasks: (pendingApps as TaskApplication[]).map((app) => ({
        id: app.id,
        taskTitle:
          tasks.find((t) => t.id === app.taskId)?.title || "طلب انضمام لمهمة",
        date: app.appliedAt,
        type: "application" as const,
      })),
      bg: "bg-amber-50/50",
      border: "border-amber-100",
    },
    {
      id: "in_progress",
      title: "قيد التنفيذ",
      icon: <PlayCircle className="w-4 h-4 text-blue-500" />,
      tasks: inProgressTasks.map((t) => ({
        id: t.id,
        taskTitle: t.title,
        date: t.createdAt,
        type: "task" as const,
      })),
      bg: "bg-blue-50/50",
      border: "border-blue-100",
    },
    {
      id: "completed",
      title: "مكتملة",
      icon: <CheckCircle2 className="w-4 h-4 text-green-500" />,
      tasks: completedTasks.map((t) => ({
        id: t.id,
        taskTitle: t.title,
        date: t.createdAt,
        type: "task" as const,
      })),
      bg: "bg-green-50/50",
      border: "border-green-100",
    },
  ];

  return (
    <div className="space-y-6 text-start">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
        <h2 className="text-xl font-bold text-black flex items-center gap-2.5 tracking-tight">
          <Target className="w-5 h-5 text-black" />
          {isOwnProfile ? "مهامي ومشاركاتي" : "سجل المهام المنجزة"}
        </h2>

        {isOwnProfile && (
          <div className="flex bg-zinc-50/50 border border-zinc-100/50 p-1 rounded-xl self-start">
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                viewMode === "list"
                  ? "bg-white text-black"
                  : "text-zinc-500 hover:text-black",
              )}
            >
              <List className="w-3.5 h-3.5" />
              قائمة
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                viewMode === "kanban"
                  ? "bg-white text-black"
                  : "text-zinc-500 hover:text-black",
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              لوحة
            </button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {viewMode === "list" ? (
          <motion.div
            key="list"
            variants={container}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6"
          >
            {(isOwnProfile ? [...inProgressTasks, ...completedTasks] : tasks)
              .length === 0 ? (
              <div className="bg-white rounded-xl border border-zinc-100 border-dashed p-6 sm:p-10 md:p-16 flex flex-col items-center justify-center gap-4 group hover:border-black transition-colors col-span-1 sm:col-span-2">
                <div className="w-16 h-16 rounded-full bg-zinc-50 flex items-center justify-center border border-zinc-100 group-hover:bg-black transition-all">
                  <Target className="w-8 h-8 text-zinc-300 group-hover:text-white transition-all" />
                </div>
                <div className="space-y-1 text-center">
                  <p className="font-bold text-black text-sm">
                    سجل المهام فارغ
                  </p>
                  <p className="text-zinc-400 text-xs font-medium">
                    لم يتم إنجاز مهام مسجلة لهذا العضو حتى الآن
                  </p>
                </div>
              </div>
            ) : (
              (isOwnProfile
                ? [...inProgressTasks, ...completedTasks]
                : tasks
              ).map((task) => (
                <motion.div
                  key={task.id}
                  variants={item}
                  className="card-base p-4 sm:p-5 md:p-6 relative group transition-colors hover:border-black/20 text-start"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-black tracking-tight line-clamp-1">
                        {task.title}
                      </h3>
                      {task.status === "in_progress" && (
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-bold rounded-lg border border-blue-100">
                          قيد التنفيذ
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-tighter shrink-0">
                      {formatDistanceToNow(task.createdAt, { locale: ar })}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-600 leading-relaxed line-clamp-2">
                    {task.description}
                  </p>
                  <div className="mt-4 pt-4 border-t border-zinc-50 flex flex-wrap gap-2 justify-end">
                    {task.requiredSkills?.map((s) => (
                      <span
                        key={s}
                        className="text-[9px] font-bold bg-white text-black border border-zinc-100 px-2 py-0.5 rounded-xl uppercase tracking-tight"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        ) : (
          <motion.div
            key="kanban"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col md:flex-row overflow-x-hidden md:overflow-x-auto gap-4 sm:gap-6 font-sans pb-6 w-full no-scrollbar min-h-0"
          >
            {kanbanColumns.map((column) => (
              <div
                key={column.id}
                className={cn(
                  "flex flex-col gap-3 p-4 rounded-xl border min-h-[150px] md:min-h-[300px] w-full md:w-80 shrink-0",
                  column.bg,
                  column.border,
                )}
              >
                <div className="flex items-center justify-between px-1 mb-1">
                  <div className="flex items-center gap-2">
                    {column.icon}
                    <span className="text-xs font-bold text-black">
                      {column.title}
                    </span>
                  </div>
                  <span className="w-5 h-5 flex items-center justify-center rounded-lg bg-white border border-zinc-200 text-[10px] font-bold text-zinc-500">
                    {column.tasks.length}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  {column.tasks.length === 0 ? (
                    <div className="py-8 flex flex-col items-center justify-center border border-dashed border-zinc-200 rounded-xl bg-white/50">
                      <p className="text-[10px] font-medium text-zinc-400 italic">
                        لا توجد مهام
                      </p>
                    </div>
                  ) : (
                    column.tasks.map((t) => (
                      <motion.div
                        key={t.id}
                        layoutId={t.id}
                        className="card-base p-3 space-y-2 group hover:border-black/20 transition-colors"
                      >
                        <h4 className="text-[11px] font-bold text-black leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors">
                          {t.taskTitle}
                        </h4>
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] text-zinc-400 font-bold">
                            {formatDistanceToNow(t.date, { locale: ar })}
                          </span>
                          {t.type === "application" && (
                            <span className="text-[8px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-lg">
                              قيد المراجعة
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
