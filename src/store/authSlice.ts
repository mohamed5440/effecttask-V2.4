import { StateCreator } from "zustand";
import { AppState, AuthSlice } from "./types";
import { dbService } from "../services/db";
import { SUPER_ADMIN_EMAILS } from "../constants";
import { toast } from "sonner";

export const createAuthSlice: StateCreator<AppState, [], [], AuthSlice> = (
  set,
  get,
) => ({
  currentUser: null,
  authError: null,
  onlineUsers: [],
  allowedEmails: [],

  initialize: async (force = false) => {
    const state = get();
    if (state.isInitialized && !force) return;

    set({ isInitialized: true, error: null, authError: null });
    await get().checkDbStatus();

    try {
      // Load session from localStorage
      const sessionStr = localStorage.getItem("app_session");
      const session = sessionStr ? JSON.parse(sessionStr) : null;

      if (session?.user) {
        const { data: authData } = await dbService.checkEmailAuthorized(
          session.user.email || "",
        );

        if (!authData?.authorized && !SUPER_ADMIN_EMAILS.includes(session.user.email?.toLowerCase().trim())) {
          localStorage.removeItem("app_session");
          set({ currentUser: null, isInitialized: true });
          return;
        }

        const { data: user } = await dbService.getUser(session.user.id);

        if (user) {
          const userEmail = session.user.email?.toLowerCase().trim();
          user.role = SUPER_ADMIN_EMAILS.includes(userEmail) ? "admin" : user.role || "user";
          user.skills = Array.isArray(user.skills) ? user.skills : [];
          set({ currentUser: user });
          get().setupRealtime(session.user.id);
        } else {
          // If session exists but user is missing, log them out silently
          localStorage.removeItem("app_session");
          set({ currentUser: null, isInitialized: true });
          return;
        }
      }

      await get().fetchInitialData();
    } catch (err: any) {
      console.error("Initialization error:", err);
      set({ error: "حدث خطأ في النظام" });
    }
  },

  logout: async (silent = false) => {
    try {
      await dbService.sendOffline();
    } catch(e) {
      console.error(e);
    }
    localStorage.removeItem("app_session");
    set({ currentUser: null });
    if (!silent) {
      toast.info("إلى اللقاء! تم تسجيل خروجك بنجاح.");
    }
  },

  addAllowedEmail: async (email: string) => {
    const { currentUser } = get();
    if (!currentUser || currentUser.role !== "admin") {
      toast.error("عذراً، هذه الخاصية متاحة للإدارة فقط.");
      return;
    }

    try {
      const { data, error } = await dbService.addAllowedEmail(
        email,
        currentUser.id,
      );
      if (error) throw error;
      if (data) {
        set((state) => ({ allowedEmails: [...state.allowedEmails, email] }));
        toast.success(`أهلاً بك! تمت إضافة ${email} إلى فريقنا.`);
      }
    } catch (error: any) {
      toast.error(typeof error === 'string' ? error : "حدث خطأ أثناء إضافة البريد");
    }
  },

  removeAllowedEmail: async (email: string) => {
    const { currentUser } = get();
    if (!currentUser || currentUser.role !== "admin") return;

    try {
      const { error } = await dbService.removeAllowedEmail(email);
      if (error) throw error;
      set((state) => ({
        allowedEmails: state.allowedEmails.filter((e) => e !== email),
      }));
      toast.success("تمت إزالة البريد الإلكتروني من القائمة.");
    } catch (error: any) {
      toast.error(typeof error === 'string' ? error : "حدث خطأ أثناء إزالة البريد");
    }
  },
});
