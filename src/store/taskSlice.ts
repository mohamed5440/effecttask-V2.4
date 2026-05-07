import { StateCreator } from "zustand";
import { AppState, TaskSlice } from "./types";
import { dbService } from "../services/db";
import { uploadFile, getPublicUrl } from "../lib/storage";
import { STORAGE_BUCKETS } from "../constants";
import { toast } from "sonner";

export const createTaskSlice: StateCreator<AppState, [], [], TaskSlice> = (
  set,
  get,
) => ({
  tasks: [],
  applications: [],
  users: [],
  reviews: [],
  ratings: [],
  teamMembers: [],
  taskStatusHistory: [],
  notifications: [],
  selectedTaskId: null,
  setSelectedTaskId: (id) => set({ selectedTaskId: id }),
  lastNotificationType: null,
  setLastNotificationType: (type) => set({ lastNotificationType: type }),

  createTask: async (taskData) => {
    const { currentUser, users } = get();
    if (currentUser?.role !== "admin") {
      toast.error("غير مصرح لك بالقيام بهذا الإجراء");
      return;
    }
    const { data, error } = await dbService.createTask({
      ...taskData,
      authorId: currentUser.id,
    });
    if (error) {
      set({ error: "عذراً، لم نتمكن من نشر المهمة حالياً" });
    } else if (data) {
      const formattedTask = {
        ...data,
        requiredSkills: Array.isArray(data.requiredSkills)
          ? data.requiredSkills
          : [],
        attachments: Array.isArray(data.attachments) ? data.attachments : [],
      };
      set((state) => ({ tasks: [formattedTask, ...state.tasks].slice(0, 200) }));
      toast.success("رائع! تم نشر مهمتك الجديدة بنجاح.");

      const matchingUsers = users.filter(
        (user) =>
          user.id !== currentUser.id &&
          user.skills &&
          user.skills.some((skill) => data.requiredSkills.includes(skill)),
      );

      for (const user of matchingUsers) {
        await dbService.createNotification({
          userId: user.id,
          message: `مرحباً! هناك مهمة جديدة قد تهمك: "${data.title}"`,
          type: "task",
          targetId: data.id,
        });
      }
    }
  },

  applyForTask: async (
    taskId,
    comment,
    budget,
    estimatedDuration,
    attachments,
  ) => {
    const { currentUser, tasks } = get();
    if (!currentUser) return;

    const { data, error } = await dbService.createApplication({
      taskId,
      userId: currentUser.id,
      comment,
      budget,
      estimatedDuration,
      attachments,
    });
    if (error) {
      set({ error: "لم نتمكن من إرسال طلبك، يرجى المحاولة لاحقاً" });
      return;
    }
    if (data) {
      set((state) => ({ applications: [data, ...state.applications] }));
      toast.success("تم إرسال طلبك بنجاح، نتمنى لك التوفيق!");
    }

    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      await dbService.createNotification({
        userId: task.authorId,
        message: `مرحباً بك! قام العضو ${currentUser.name} بالتقديم على مهمتك: "${task.title}"`,
        type: "task",
        targetId: taskId,
      });
    }
  },

  updateApplicationStatus: async (applicationId, status) => {
    const { currentUser, applications, tasks } = get();
    const app = applications.find((a) => a.id === applicationId);
    if (!app) return;

    try {
      const task = tasks.find((t) => t.id === app.taskId);
      const oldTaskStatus = task?.status || "open";

      if (status === "accepted") {
        await dbService.assignTask(app.taskId, applicationId, app.userId);
        await dbService.logStatusChange(
          app.taskId,
          oldTaskStatus,
          "in_progress",
          currentUser?.id,
        );

        // Add to team_members if not already there
        const isAlreadyMember = get().teamMembers.some(
          (m) => m.userId === app.userId,
        );
        if (!isAlreadyMember) {
          const { data: memberData } = await dbService.addToTeam(
            app.userId,
            currentUser?.id || "",
          );
          if (memberData) {
            set((state) => ({
              teamMembers: [...state.teamMembers, memberData],
            }));
          }
        }

        set((state) => ({
          applications: state.applications.map((a) =>
            a.id === applicationId
              ? { ...a, status: "accepted" }
              : a.taskId === app.taskId && a.status === "pending"
                ? { ...a, status: "rejected" }
                : a,
          ),
          tasks: state.tasks.map((t) =>
            t.id === app.taskId
              ? { ...t, status: "in_progress", assignedToUser: app.userId }
              : t,
          ),
        }));

        await dbService.createNotification({
          userId: app.userId,
          message: `تهانينا! تم اختيارك لتنفيذ المهمة: "${task?.title || ""}"`,
          type: "task",
          targetId: app.taskId,
        });
        toast.success("تم قبول الطلب وبدء تنفيذ المهمة.");
      } else {
        const { error: appError } = await dbService.updateApplicationStatus(
          applicationId,
          status,
        );
        if (appError) throw appError;

        set((state) => ({
          applications: state.applications.map((a) =>
            a.id === applicationId ? { ...a, status } : a,
          ),
        }));

        const message =
          status === "rejected"
            ? `نعتذر، لم يتم اختيارك لمهمة "${task?.title || ""}". حظاً موفقاً في المرات القادمة.`
            : `تم وضع طلبك في قائمة الاحتياط لمهمة "${task?.title || ""}".`;

        await dbService.createNotification({
          userId: app.userId,
          message,
          type: "task",
          targetId: app.taskId,
        });
        toast.info(
          status === "rejected"
            ? "تم استبعاد المتقدم"
            : "تم وضع المتقدم في قائمة الاحتياط",
        );
      }
    } catch (err: any) {}
  },

  completeTaskAndRate: async (taskId, userId, rating, comment) => {
    const { currentUser, users, reviews, tasks } = get();
    if (!currentUser) return;

    try {
      const task = tasks.find((t) => t.id === taskId);
      const oldStatus = task?.status || "in_progress";

      await dbService.completeTask(taskId);
      await dbService.logStatusChange(
        taskId,
        oldStatus,
        "completed",
        currentUser.id,
      );

      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === taskId ? { ...t, status: "completed" } : t,
        ),
      }));

      const { data: revData, error: revError } = await dbService.createReview({
        taskId,
        userId,
        raterId: currentUser.id,
        rating,
        comment,
      });
      if (revError) throw revError;

      if (revData) {
        const updatedReviews = [revData, ...reviews];
        set({ reviews: updatedReviews });

        const targetUser = users.find((u) => u.id === userId);
        if (targetUser) {
          const userReviews = updatedReviews.filter((r) => r.userId === userId);
          const totalRating = userReviews.reduce((sum, r) => sum + r.rating, 0);
          const averageRating = totalRating / userReviews.length;
          const completedCount = (targetUser.completedTasksCount || 0) + 1;

          await get().updateUser(userId, {
            rating: Number(averageRating.toFixed(1)),
            completedTasksCount: completedCount,
          });
        }
      }

      await dbService.createNotification({
        userId,
        message: `عمل رائع! حصلت على تقييم (${rating} نجوم) على إنجازك للمهمة.`,
        type: "task",
        targetId: taskId,
      });

      toast.success("تم إنهاء المهمة وتسجيل تقييمك بنجاح. شكراً لك!");
    } catch (err: any) {}
  },

  updateUser: async (userId, updateData) => {
    const { data, error } = await dbService.updateUser(userId, updateData);
    if (error) {
      toast.error("عذراً، حدث خطأ أثناء التحديث");
      throw error;
    } else if (data) {
      const formattedUser = {
        ...data,
        skills: Array.isArray(data.skills) ? data.skills : [],
      };
      set((state) => ({
        users: state.users.map((u) => (u.id === userId ? formattedUser : u)),
        currentUser:
          state.currentUser?.id === userId ? formattedUser : state.currentUser,
      }));
      toast.success("تم تحديث معلومات الملف الشخصي بنجاح.");
    }
  },

  uploadAvatar: async (userId, file) => {
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast.error("الملف كبير جداً");
      return null;
    }

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const { path, error } = await uploadFile(
        STORAGE_BUCKETS.AVATARS,
        file,
        fileName,
      );

      if (error || !path) throw error;
      return getPublicUrl(STORAGE_BUCKETS.AVATARS, path);
    } catch (err: any) {
      toast.error("حدث خطأ أثناء رفع الصورة.");
      return null;
    }
  },

  uploadFile: async (bucket, file) => {
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast.error("الملف كبير جداً");
      return null;
    }

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}-${Date.now()}.${fileExt}`;
      const { path, error } = await uploadFile(bucket, file, fileName);

      if (error || !path) throw error;
      return getPublicUrl(bucket, path);
    } catch (err: any) {
      toast.error("حدث خطأ أثناء رفع الملف.");
      return null;
    }
  },

  deleteTask: async (taskId: string) => {
    const { currentUser, tasks } = get();
    const task = tasks.find((t) => t.id === taskId);
    if (currentUser?.role !== "admin" && task?.authorId !== currentUser?.id) {
      toast.error("غير مصرح لك بحذف هذه المهمة");
      return;
    }
    const { error } = await dbService.deleteTask(taskId);
    if (error) {
      toast.error(typeof error === "string" ? error : "عذراً، لم نتمكن من حذف المهمة");
    } else {
      set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== taskId),
        selectedTaskId: state.selectedTaskId === taskId ? null : state.selectedTaskId,
      }));
      toast.success("تمت إزالة المهمة من النظام بنجاح.");
    }
  },

  markNotificationRead: async (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n,
      ),
    }));
    await dbService.markNotificationRead(id);
  },

  fetchUser: async (userId: string) => {
    const { users } = get();
    const existing = users.find((u) => u.id === userId);
    if (existing) return existing;

    const { data } = await dbService.getUser(userId);
    if (data) {
      const formattedUser = {
        ...data,
        skills: Array.isArray(data.skills) ? data.skills : [],
      };
      set({ users: [...users, formattedUser] });
      return formattedUser;
    }
    return null;
  },
});
