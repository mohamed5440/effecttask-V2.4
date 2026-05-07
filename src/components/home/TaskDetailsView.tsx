import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MessageSquare,
  CheckCircle,
  Target,
  X,
  Upload,
  Paperclip,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  Task,
  TaskApplication,
  User,
  ApplicationStatus,
  TaskStatusHistory,
} from "../../types";
import { cn } from "../../lib/utils";
import Chat from "./Chat";
import { ApplicantCard } from "./ApplicantCard";
import { useStore } from "../../store";
import { StatusBadge, DurationBadge } from "../ui/Badge";
import { ConfirmModal } from "../ui/ConfirmModal";
import { formatRelativeTime, formatDuration } from "../../lib/formatters";

interface TaskDetailsViewProps {
  selectedTask: Task | null;
  currentUser: User | null;
  applications: TaskApplication[];
  users: User[];
  taskStatusHistory: TaskStatusHistory[];
  onBack: () => void;
  onApply: (
    comment: string,
    budget?: string,
    duration?: string,
    attachments?: string[],
  ) => void;
  onUpdateApplicationStatus: (id: string, status: ApplicationStatus) => void;
  onRejectApplication: (id: string) => void;
  onShowRatingModal: () => void;
  onDeleteTask: (id: string) => void;
  isApplying: boolean;
  setIsApplying: (v: boolean) => void;
  comment: string;
  setComment: (v: string) => void;
  budget: string;
  setBudget: (v: string) => void;
  estimatedDuration: string;
  setEstimatedDuration: (v: string) => void;
  attachments: string[];
  setAttachments: (v: string[]) => void;
  autoOpenChat?: boolean;
}

export const TaskDetailsView: React.FC<TaskDetailsViewProps> = ({
  selectedTask,
  currentUser,
  applications,
  users,
  taskStatusHistory,
  onBack,
  onApply,
  onUpdateApplicationStatus,
  onRejectApplication,
  onShowRatingModal,
  onDeleteTask,
  isApplying,
  setIsApplying,
  comment,
  setComment,
  budget,
  setBudget,
  estimatedDuration,
  setEstimatedDuration,
  attachments,
  setAttachments,
  autoOpenChat,
}) => {
  const navigate = useNavigate();
  const { uploadFile, setLastNotificationType } = useStore();
  const isAdmin = currentUser?.role === "admin";
  const applyRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [isDurationFocused, setIsDurationFocused] = useState(false);

  React.useEffect(() => {
    if (autoOpenChat && selectedTask) {
      setTimeout(() => {
        chatRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 500);
      setLastNotificationType(null);
    }
  }, [selectedTask?.id, autoOpenChat]);

  const scrollToApply = () => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    setIsApplying(true);
    setTimeout(() => {
      applyRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const url = await uploadFile("attachments", file);
    if (url) {
      setAttachments([...attachments, url]);
    }
    setIsUploading(false);
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  if (!selectedTask) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-full min-h-[400px] flex items-center justify-center text-zinc-400"
      >
        <div className="text-center">
          <Target className="w-10 h-10 text-zinc-100 mx-auto mb-3" />
          <p className="text-sm font-medium">
            اختر مهمة من القائمة لعرض التفاصيل
          </p>
        </div>
      </motion.div>
    );
  }

  const myApplications = currentUser
    ? applications.filter((a) => a.userId === currentUser.id)
    : [];
  const currentTaskApp = myApplications.find(
    (a) => a.taskId === selectedTask.id,
  );
  const taskApplicants = applications.filter(
    (a) => a.taskId === selectedTask.id,
  );

  return (
    <motion.div
      key={selectedTask.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-white rounded-xl border border-zinc-100 p-4 sm:p-6 md:p-8 min-h-[300px] flex flex-col text-start mb-4 sm:mb-6 w-full max-w-full overflow-hidden"
    >
      <div className="md:hidden mb-4 sm:mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-black font-bold text-xs sm:text-sm bg-zinc-50/50 px-5 py-4 rounded-xl border border-zinc-100 transition-all active:scale-95 w-full"
        >
          <span>العودة لجميع المهام</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 sm:gap-8 mb-8 md:mb-10 text-start">
        <div className="flex-1 min-w-0 w-full space-y-3 sm:space-y-4 md:space-y-5">
          <div className="flex items-center gap-3 flex-wrap text-start">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-black tracking-tighter break-words leading-none uppercase">
              {selectedTask.title}
            </h1>
            {currentUser && selectedTask.assignedToUser === currentUser.id && (
              <span className="bg-black text-white px-3 py-1 rounded-lg text-[10px] sm:text-xs font-black inline-flex items-center gap-1.5 shadow-sm">
                <CheckCircle className="w-3.5 h-3.5" />
                {selectedTask.status === "completed" ? "أنجزتها أنت" : "تم تعيينها لك"}
              </span>
            )}
          </div>
          <div className="flex items-center flex-wrap gap-x-6 gap-y-3 text-xs sm:text-sm text-zinc-400 font-bold uppercase tracking-tight">
            <span className="whitespace-nowrap flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-zinc-300" />
              {formatRelativeTime(selectedTask.createdAt)}
            </span>
            <div className="flex items-center gap-2.5 flex-wrap">
              <StatusBadge status={selectedTask.status} className="h-6 font-black" />
              <DurationBadge duration={selectedTask.duration} className="h-6 font-black" />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto shrink-0 self-stretch sm:self-auto mt-2 sm:mt-0 items-start">
          {(isAdmin || selectedTask.authorId === currentUser?.id) && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100 flex items-center justify-center gap-2"
              title="حذف المهمة"
            >
              <Trash2 className="w-5 h-5 shrink-0" />
              <span className="text-xs font-bold sm:hidden">حذف المهمة</span>
            </button>
          )}
          {!isAdmin && selectedTask.status === "open" && !currentTaskApp && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={scrollToApply}
              className="bg-black text-white font-bold py-3 sm:py-2.5 px-6 rounded-xl hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0 w-full sm:w-auto"
            >
              {currentUser ? "تقديم طلب" : "سجل للتقديم"}
            </motion.button>
          )}
        </div>

        {!isAdmin && currentTaskApp && (
          <div
            className={cn(
              "px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 border shrink-0 transition-all w-full sm:w-auto justify-center sm:justify-start",
              currentTaskApp.status === "pending"
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : currentTaskApp.status === "accepted"
                  ? "bg-green-500 text-white border-green-600"
                  : "bg-red-50 text-red-600 border-red-100",
            )}
          >
            {currentTaskApp.status === "pending" ? (
              <>
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <span>الطلب قيد المراجعة</span>
              </>
            ) : currentTaskApp.status === "accepted" ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>الطلب مقبول</span>
              </>
            ) : (
              <>
                <X className="w-4 h-4" />
                <span>تم تعيين المهمة أو اختيار زميل آخر</span>
              </>
            )}
          </div>
        )}
      </div>

      <div className="prose prose-zinc max-w-none mb-6 sm:mb-8 lg:mb-10 text-start">
        <p className="text-zinc-600 leading-loose text-[13px] sm:text-sm md:text-[15px] whitespace-pre-wrap break-words">
          {selectedTask.description}
        </p>
        {(selectedTask.attachments?.length ?? 0) > 0 && (
          <div className="mt-6 flex flex-col items-start gap-2 text-start">
            <h3 className="text-xs font-bold text-black uppercase tracking-wider">
              مرفقات
            </h3>
            <div className="flex flex-wrap gap-2">
              {selectedTask.attachments?.map((url, idx) => (
                <a
                  key={idx}
                  href={url}
                  download={`attachment_${idx + 1}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  referrerPolicy="no-referrer"
                  className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-black text-[12px] sm:text-sm font-bold rounded-xl transition-colors min-w-0 max-w-full"
                  dir="ltr"
                >
                  <Paperclip className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate max-w-[200px] inline-block">
                    {(() => {
                      try {
                        return new URL(url).pathname.split("/").pop() || "ملف مرفق";
                      } catch (e) {
                        return "ملف مرفق";
                      }
                    })()}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {(selectedTask.requiredSkills?.length ?? 0) > 0 && (
        <div className="mb-10 text-start">
          <h3 className="text-xs font-bold text-zinc-400 mb-3 uppercase tracking-widest">
            المهارات المطلوبة
          </h3>
          <div className="flex flex-wrap gap-2 justify-start">
            {selectedTask.requiredSkills?.map((skill) => (
              <span
                key={skill}
                className="px-3 py-1.5 bg-black/[0.02] text-black rounded-lg text-sm font-bold border border-black/5"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Application Form for Users */}
      <AnimatePresence>
        {isApplying && !isAdmin && (
          <motion.div
            ref={applyRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-zinc-50/30 p-4 sm:p-6 md:p-8 rounded-xl border border-zinc-100 mt-6 sm:mt-8 overflow-hidden text-start"
          >
            <h3 className="text-xs sm:text-sm font-bold text-black mb-4 sm:mb-6 uppercase tracking-wider">
              أخبرنا لماذا أنت الشخص المناسب لهذه المهمة؟
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
              <div className="flex flex-col gap-1.5 text-start">
                <label className="block text-[10px] font-bold text-zinc-400 px-0.5 uppercase tracking-widest">
                  السعر المتوقع
                </label>
                <div className="relative group/budget">
                  <input
                    type="number"
                    min="0"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full px-4 py-3.5 sm:py-4 rounded-xl border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all text-sm bg-white font-sans text-start pe-24 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    placeholder="0"
                  />
                  <div className="absolute inset-y-0 end-4 flex items-center pointer-events-none">
                    <span className="text-sm font-bold text-black font-sans">
                      جنيه مصري
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 text-start">
                <label className="block text-[10px] font-bold text-zinc-400 px-0.5 uppercase tracking-widest">
                  مدة التنفيذ
                </label>
                <div className="relative group/duration">
                  <input
                    type="number"
                    min="1"
                    value={estimatedDuration}
                    onChange={(e) => setEstimatedDuration(e.target.value)}
                    onFocus={() => setIsDurationFocused(true)}
                    onBlur={() => setIsDurationFocused(false)}
                    className={cn(
                      "w-full px-4 py-3.5 sm:py-4 rounded-xl border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all text-sm bg-white font-sans text-start [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                      !isDurationFocused && estimatedDuration ? "text-transparent" : "text-black"
                    )}
                    placeholder="عدد الساعات"
                  />
                  {!isDurationFocused && estimatedDuration && (
                    <div className="absolute inset-y-0 end-4 flex items-center pointer-events-none">
                      <span className="text-sm font-bold text-black font-sans">
                        {formatDuration(estimatedDuration)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-1.5 mb-6">
              <label className="block text-[10px] font-bold text-zinc-400 px-0.5 uppercase tracking-widest">
                رسالتك لطلب المهمة
              </label>
              <textarea
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="اكتب رسالتك هنا، اشرح خبراتك السابقة وكيف ستنجز هذه المهمة..."
                className="w-full px-4 py-3.5 sm:py-4 rounded-xl border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-black focus:border-black transition-all text-sm resize-none bg-white font-sans text-start md:min-h-[120px]"
              />
            </div>

            <div className="mb-6 sm:mb-8">
              <div className="flex items-center justify-between mb-3">
                <label className="cursor-pointer text-xs font-bold text-black hover:text-zinc-600 transition-colors flex items-center gap-1.5 p-2 bg-white border border-zinc-100 rounded-xl">
                  <Upload className="w-4 h-4" />
                  <span>إرفاق ملفات (اختياري)</span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                  />
                </label>
              </div>

              <div className="flex flex-wrap gap-2 min-h-[40px]">
                {attachments.map((url, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-white border border-zinc-200 px-3 py-2 rounded-xl text-xs font-bold text-black group animate-in fade-in slide-in-from-bottom-1"
                  >
                    <Paperclip className="w-3.5 h-3.5 text-zinc-400" />
                    <span
                      className="truncate max-w-[120px] sm:max-w-[200px]"
                      dir="ltr"
                    >
                      {url.split("/").pop()}
                    </span>
                    <button
                      onClick={() => removeAttachment(idx)}
                      className="text-zinc-400 hover:text-red-500 transition-colors p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {isUploading && (
                  <div className="flex items-center gap-2 bg-black/5 border border-black/10 px-3 py-2 rounded-xl text-xs font-bold text-black animate-pulse">
                    جاري الرفع...
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  onApply(comment, budget, estimatedDuration, attachments);
                  setIsApplying(false);
                  setComment("");
                  setBudget("");
                  setEstimatedDuration("");
                  setAttachments([]);
                }}
                className="w-full sm:flex-1 py-4 bg-black text-white rounded-xl font-bold hover:bg-zinc-800 transition-all text-sm disabled:opacity-20 flex items-center justify-center gap-2 active:scale-[0.98]"
                disabled={!comment.trim() || isUploading}
              >
                إرسال الطلب الآن
              </button>
              <button
                onClick={() => {
                  setIsApplying(false);
                  setAttachments([]);
                }}
                className="w-full sm:w-auto px-10 py-4 bg-transparent text-zinc-400 hover:text-black font-bold transition-colors text-sm"
              >
                إلغاء
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Applicants View */}
      {(selectedTask.status === "open" || taskApplicants.length > 0) && (
        <div className="mt-auto pt-10 border-t border-zinc-100 text-start">
          <h3 className="text-lg font-bold text-black mb-6 flex items-center gap-3 justify-start">
            <div className="bg-black text-white w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-black shrink-0">
              {taskApplicants.length}
            </div>
            المتقدمون
          </h3>

          <div className="space-y-4">
            {taskApplicants.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-xl border border-dashed border-zinc-100 text-zinc-400 text-sm font-medium">
                لا يوجد متقدمين حتى الآن
              </div>
            ) : (
              taskApplicants.map((app) => {
                const applicant = users.find((u) => u.id === app.userId);
                if (!applicant) return null;
                return (
                  <ApplicantCard
                    key={app.id}
                    application={app}
                    applicant={applicant}
                    task={selectedTask}
                    isAdmin={isAdmin && selectedTask.status === "open"}
                    onUpdateStatus={onUpdateApplicationStatus}
                    onReject={onRejectApplication}
                  />
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Chat View for In Progress Tasks */}
      {selectedTask.status === "in_progress" && selectedTask.assignedToUser && (
        <motion.div
          ref={chatRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-10 pt-10 border-t border-zinc-100 text-start"
        >
          <div className="flex items-center gap-2 mb-6 justify-start">
            <h3 className="text-lg font-bold text-black uppercase tracking-tight">
              المحادثة المباشرة
            </h3>
            <MessageSquare className="w-5 h-5" />
          </div>
          <Chat
            taskId={selectedTask.id}
            partnerId={
              isAdmin ? selectedTask.assignedToUser : selectedTask.authorId
            }
          />
        </motion.div>
      )}

      {/* Assigned/Completed User View */}
      {(selectedTask.status === "in_progress" || selectedTask.status === "completed") && selectedTask.assignedToUser && (
        <div className="mt-auto pt-8 sm:pt-10 border-t border-zinc-100 text-start">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
            <h3 className="text-xs sm:text-sm font-bold text-zinc-500 uppercase tracking-tight">
              {selectedTask.status === "completed" ? "أنجزت بواسطة" : "تم تعيين المهمة إلى"}
            </h3>
            {isAdmin && selectedTask.status === "in_progress" && (
              <button
                onClick={onShowRatingModal}
                className="w-full sm:w-auto px-4 py-2 sm:py-1.5 bg-black text-white hover:bg-zinc-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                إنهاء وتقييم
              </button>
            )}
          </div>
          {(() => {
            const assignedUser = users.find(
              (u) => u.id === selectedTask.assignedToUser,
            );
            return assignedUser ? (
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 bg-white p-3 sm:p-4 rounded-xl border border-zinc-100 text-center sm:text-start">
                <img
                  src={
                    assignedUser.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(assignedUser.name || "مستخدم")}&background=000&color=fff`
                  }
                  alt=""
                  loading="lazy"
                  className="w-12 h-12 sm:w-10 sm:h-10 rounded-xl border border-zinc-200 bg-white object-cover aspect-square"
                />
                <div className="text-center sm:text-start">
                  <h4 className="font-bold text-black text-sm sm:text-base">
                    {assignedUser.name}
                  </h4>
                  {selectedTask.status === "completed" ? (
                    <p className="text-[11px] sm:text-xs text-black mt-0.5 flex items-center justify-center sm:justify-start gap-1 font-bold">
                      <span>المهمة مكتملة</span>
                      <CheckCircle className="w-3.5 h-3.5" />
                    </p>
                  ) : (
                    <p className="text-[11px] sm:text-xs text-zinc-500 mt-0.5 font-medium">
                      منفذ المهمة
                    </p>
                  )}
                </div>
              </div>
            ) : null;
          })()}
        </div>
      )}

      {/* Activity Log (Admin Only) */}
      {isAdmin &&
        taskStatusHistory.filter((h) => h.taskId === selectedTask.id).length >
          0 && (
          <div className="mt-10 pt-10 border-t border-zinc-100 text-start">
            <h3 className="text-sm font-bold text-zinc-500 mb-6 uppercase tracking-tight text-start">
              سجل النشاط
            </h3>
            <div className="space-y-6">
              {taskStatusHistory
                .filter((h) => h.taskId === selectedTask.id)
                .sort((a, b) => b.changedAt - a.changedAt)
                .map((history, idx) => (
                  <div
                    key={idx}
                    className="flex gap-4 items-start relative text-start"
                  >
                    <div className="w-4 h-4 rounded-full bg-zinc-100 border-2 border-white ring-1 ring-zinc-200 shrink-0 mt-1 relative z-10"></div>
                    <div>
                      <p className="text-sm text-black font-bold">
                        {history.newStatus === "in_progress"
                          ? "تم تعيين المهمة وبدء العمل"
                          : history.newStatus === "completed"
                            ? "تم إنهاء المهمة وتقييم العضو"
                            : "تم تغيير حالة المهمة"}
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-1">
                        {formatRelativeTime(history.changedAt)}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          onDeleteTask(selectedTask.id);
          onBack();
        }}
        title="تأكيد حذف المهمة"
        description="هل أنت متأكد من رغبتك في حذف هذه المهمة نهائياً من النظام؟ لا يمكن التراجع عن هذا الإجراء."
        confirmText="نعم، احذف المهمة"
        cancelText="تراجع"
      />
    </motion.div>
  );
};
