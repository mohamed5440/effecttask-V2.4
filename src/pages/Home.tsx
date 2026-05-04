import { useState, useEffect } from "react";
import { useStore } from "../store";
import { Plus, X } from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { TaskCard } from "../components/home/TaskCard";
import { TaskDetailsView } from "../components/home/TaskDetailsView";
import { CreateTaskModal } from "../components/home/CreateTaskModal";
import { RatingModal } from "../components/home/RatingModal";

export default function Home() {
  const {
    currentUser,
    tasks,
    applications,
    applyForTask,
    updateApplicationStatus,
    users,
    createTask,
    completeTaskAndRate,
    deleteTask,
    taskStatusHistory,
    selectedTaskId,
    setSelectedTaskId,
    lastNotificationType,
  } = useStore();

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) || null;
  const [comment, setComment] = useState("");
  const [budget, setBudget] = useState<string>("");
  const [estimatedDuration, setEstimatedDuration] = useState<string>("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const [isApplying, setIsApplying] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rejectionModalAppId, setRejectionModalAppId] = useState<string | null>(
    null,
  );
  const [taskFilter, setTaskFilter] = useState<"all" | "open" | "mine">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const isAdmin = currentUser?.role === "admin";

  useEffect(() => {
    if (showCreateModal || showRatingModal || rejectionModalAppId) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showCreateModal, showRatingModal, rejectionModalAppId]);

  const filteredTasks = tasks.filter((task) => {
    if (taskFilter === "open" && task.status !== "open") return false;
    if (taskFilter === "mine" && task.assignedToUser !== currentUser?.id)
      return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        task.title.toLowerCase().includes(query) ||
        task.description.toLowerCase().includes(query) ||
        (task.requiredSkills || []).some((s) => s.toLowerCase().includes(query))
      );
    }
    return true;
  });

  const stats = {
    total: tasks.length,
    open: tasks.filter((t) => t.status === "open").length,
    completed: tasks.filter((t) => t.status === "completed").length,
    members: users.filter((u) => u.role !== "admin").length,
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-10 font-sans">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 md:gap-8 border-b border-zinc-100/50 pb-6 sm:pb-8 md:pb-12 text-start px-0">
        <div className="text-start max-w-2xl px-0 space-y-2 sm:space-y-3">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-black tracking-tight mb-1 uppercase leading-tight">
            {isAdmin
              ? "لوحة تحكم المسؤول"
              : currentUser
                ? "بوابة مهام الفريق"
                : "إيفيكت تاسك"}
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-zinc-500 font-medium leading-relaxed max-w-[95%]">
            {isAdmin
              ? "إدارة المهام، مراجعة المتقدمين، واختيار أفضل الكفاءات لفريقك."
              : currentUser
                ? "استعرض المهام المتاحة، قدم طلباتك، وطوّر سيرتك الذاتية داخل الفريق."
                : "استكشف المهام المتاحة للفريق. سجل دخولك لتقديم طلبات الاستلام."}
          </p>
        </div>

        {isAdmin && (
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-black text-white px-6 py-4 sm:px-8 sm:py-5 font-bold rounded-xl transition-colors w-full md:w-auto justify-center shrink-0 mt-2 md:mt-0"
          >
            <Plus className="w-5 h-5" />
            نشر مهمة جديدة
          </motion.button>
        )}
      </div>

      {/* Stats Section */}
      {isAdmin && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <div className="card-base p-4 sm:p-5 md:p-6 text-start min-w-0">
            <p className="text-[10px] sm:text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1 truncate">
              إجمالي المهام
            </p>
            <p className="text-xl sm:text-2xl md:text-3xl font-black text-black">
              {stats.total}
            </p>
          </div>
          <div className="card-base p-4 sm:p-5 md:p-6 text-start min-w-0">
            <p className="text-[10px] sm:text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1 truncate">
              مفتوحة للتقديم
            </p>
            <p className="text-xl sm:text-2xl md:text-3xl font-black text-black">
              {stats.open}
            </p>
          </div>
          <div className="card-base p-4 sm:p-5 md:p-6 text-start min-w-0">
            <p className="text-[10px] sm:text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1 truncate">
              منجزة بنجاح
            </p>
            <p className="text-xl sm:text-2xl md:text-3xl font-black text-black">
              {stats.completed}
            </p>
          </div>
          <div className="card-base p-4 sm:p-5 md:p-6 text-start min-w-0">
            <p className="text-[10px] sm:text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1 truncate">
              أعضاء الفريق
            </p>
            <p className="text-xl sm:text-2xl md:text-3xl font-black text-black">
              {stats.members}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 lg:gap-8 items-start relative min-h-[500px]">
        {/* Task List Column */}
        <div
          className={cn(
            "flex flex-col gap-4 transition-all duration-300 w-full min-w-0",
             selectedTaskId 
               ? "hidden lg:flex lg:col-span-5 xl:col-span-4" 
               : "flex col-span-1 lg:col-span-10 lg:col-start-2 xl:col-span-8 xl:col-start-3",
          )}
        >
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-black tracking-tight text-start">
              {isAdmin ? "المهام المنشورة" : "الفرص المتاحة"}
            </h2>
          </div>

          <div className="relative space-y-2">
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">
              بحث عن مهمة
            </label>
            <input
              type="text"
              placeholder="ابحث عن مهمة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 sm:px-5 py-3 sm:py-3.5 text-xs sm:text-sm focus:outline-none focus:border-black/20 font-medium text-start transition-all"
            />
          </div>

          <div className="flex p-0.5 sm:p-1 bg-zinc-50/50 border border-zinc-100 rounded-xl">
            {(["all", "open", "mine"] as const).map((filter) => {
              if (filter === "mine" && isAdmin) return null;
              return (
                <button
                  key={filter}
                  onClick={() => {
                    setTaskFilter(filter);
                    setSelectedTaskId(null);
                  }}
                  className={cn(
                    "flex-1 py-2 sm:py-2.5 md:py-3 text-[10px] sm:text-[11px] md:text-xs font-black rounded-lg sm:rounded-xl transition-all",
                    taskFilter === filter
                      ? "bg-black text-white"
                      : "text-zinc-500 hover:text-black",
                  )}
                >
                  {filter === "all"
                    ? "الكل"
                    : filter === "open"
                      ? "المفتوحة"
                      : "مهامي"}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-4 lg:max-h-[calc(100vh-280px)] lg:overflow-y-auto pe-0">
            <AnimatePresence mode="popLayout">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  isSelected={selectedTaskId === task.id}
                  isAssignedToMe={task.assignedToUser === currentUser?.id}
                  onClick={() => {
                    setSelectedTaskId(task.id);
                    setIsApplying(false);
                  }}
                  applicantsCount={
                    applications.filter((a) => a.taskId === task.id).length
                  }
                />
              ))}
            </AnimatePresence>
            {filteredTasks.length === 0 && (
              <div className="text-center py-12 text-zinc-400 text-sm font-medium">
                لا يوجد مهام مطابقة حالياً
              </div>
            )}
          </div>
        </div>

        {/* Task Details Column */}
        {selectedTaskId && (
          <div className="flex flex-col col-span-1 lg:col-span-7 xl:col-span-8 w-full min-w-0">
            <TaskDetailsView
              selectedTask={selectedTask}
              currentUser={currentUser}
              applications={applications}
              users={users}
              taskStatusHistory={taskStatusHistory}
              onBack={() => setSelectedTaskId(null)}
              onApply={(comment, budget, duration, attachments) => {
                applyForTask(
                  selectedTask!.id,
                  comment,
                  budget,
                  duration,
                  attachments,
                );
              }}
              onUpdateApplicationStatus={updateApplicationStatus}
              onRejectApplication={(id) => setRejectionModalAppId(id)}
              onShowRatingModal={() => setShowRatingModal(true)}
              onDeleteTask={deleteTask}
              isApplying={isApplying}
              setIsApplying={setIsApplying}
              comment={comment}
              setComment={setComment}
              budget={budget}
              setBudget={setBudget}
              estimatedDuration={estimatedDuration}
              setEstimatedDuration={setEstimatedDuration}
              attachments={attachments}
              setAttachments={setAttachments}
              autoOpenChat={lastNotificationType === "chat"}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={(taskData) => {
          createTask({
            title: taskData.title,
            description: taskData.description,
            requiredSkills: taskData.skills
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
            duration: taskData.duration,
            attachments: taskData.attachments,
          });
          setShowCreateModal(false);
        }}
      />

      <RatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        selectedTask={selectedTask}
        onSubmit={completeTaskAndRate}
      />

      <AnimatePresence>
        {rejectionModalAppId && (
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-3 sm:p-4"
            onClick={() => setRejectionModalAppId(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: "100%", scale: 1 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: "100%", scale: 1 }}
              className="bg-white rounded-t-xl sm:rounded-xl w-full max-w-sm border border-zinc-200 overflow-hidden pb-6 sm:pb-0"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-5 py-4 border-b border-zinc-100 flex justify-between items-center bg-white text-start">
                <h2 className="text-base sm:text-lg font-bold text-red-600 uppercase tracking-tight">
                  تأكيد الاستبعاد
                </h2>
                <button
                  onClick={() => setRejectionModalAppId(null)}
                  className="p-2 text-zinc-400 hover:text-black transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 sm:p-8 bg-white text-start">
                <p className="text-sm sm:text-base text-zinc-600 mb-8 font-bold leading-relaxed">
                  هل أنت متأكد من رغبتك في استبعاد هذا المتقدم من قائمة الانتظار
                  للمهمة؟
                </p>
                <div className="flex flex-col sm:flex-row justify-end gap-3 font-sans">
                  <button
                    onClick={() => setRejectionModalAppId(null)}
                    className="order-2 sm:order-1 w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-zinc-500 hover:bg-zinc-50 transition-colors text-sm border border-transparent hover:border-zinc-200 text-center"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={() => {
                      updateApplicationStatus(rejectionModalAppId, "rejected");
                      setRejectionModalAppId(null);
                    }}
                    className="order-1 sm:order-2 w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition-all active:scale-95 text-sm text-center"
                  >
                    تأكيد الاستبعاد
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
