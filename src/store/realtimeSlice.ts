import { StateCreator } from "zustand";
import { AppState, RealtimeSlice } from "./types";
import { dbService } from "../services/db";
export const createRealtimeSlice: StateCreator<
  AppState,
  [],
  [],
  RealtimeSlice
> = (set, get) => ({
  isInitialized: false,
  error: null,
  dbStatus: null,
  lastSyncTimestamp: null,

  checkDbStatus: async () => {
    try {
      const response = await fetch("/api/health");
      const result = await response.json();
      if (result.db && !result.db.startsWith("connected")) {
        set({
          dbStatus: {
            connected: false,
            message: result.db,
            host: result.host,
          },
        });
      } else {
        set({
          dbStatus: {
            connected: true,
            message: "Connected",
            host: result.host || "",
          },
        });
      }
    } catch (e) {
      set({
        dbStatus: {
          connected: false,
          message: "Could not reach server health check",
          host: "unknown",
        },
      });
    }
  },

  setCurrentUser: (userId) => {
    const user = get().users.find((u) => u.id === userId);
    if (user) {
      set({ currentUser: user });
    }
  },

  setupRealtime: (userId: string) => {
    // Basic polling to keep data in sync with MySQL
    const pollInterval = setInterval(() => {
      const state = get();
      if (state.currentUser && state.currentUser.id === userId) {
        state.fetchInitialData();
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  },

  fetchInitialData: async () => {
    const { currentUser } = get();
    
    const tableToKey: Record<string, string> = {
      users: "users",
      tasks: "tasks",
      applications: "applications",
      notifications: "notifications",
      reviews: "reviews",
      messages: "messages",
      ratings: "ratings",
      team_members: "teamMembers",
      task_status_history: "taskStatusHistory",
      allowed_emails: "allowedEmails",
    };

    // Define which tables are strictly private and require login
    const privateTables = [
      "notifications",
      "messages",
      "team_members",
      "allowed_emails",
      "task_status_history",
      "ratings",
      "reviews"
    ];

    await Promise.all(
      Object.keys(tableToKey).map(async (table) => {
        // If the table is private and we don't have a user, skip it
        if (privateTables.includes(table) && !currentUser) {
          return;
        }

        // Further restrict allowed_emails to admins only to avoid unnecessary 403s
        if (table === "allowed_emails" && currentUser?.role !== "admin") {
          return;
        }

        const { data, error } = await dbService.getInitialData(table);
        if (error) {
          // Silent failure for guests or unauthorized fetches to avoid console noise
          if (error === "Access denied") return; 
          // console.error(`Error fetching ${table}:`, error);
        }
        if (data) {
          const finalData = (data as any[]).map((item) => {
            if (table === "users") {
              return {
                ...item,
                skills: Array.isArray(item.skills) ? item.skills : [],
              };
            }
            if (table === "tasks") {
              return {
                ...item,
                requiredSkills: Array.isArray(item.requiredSkills)
                  ? item.requiredSkills
                  : [],
                attachments: Array.isArray(item.attachments)
                  ? item.attachments
                  : [],
              };
            }
            if (table === "applications") {
              return {
                ...item,
                attachments: Array.isArray(item.attachments)
                  ? item.attachments
                  : [],
              };
            }
            if (table === "messages") {
              return {
                ...item,
                attachments: Array.isArray(item.attachments)
                  ? item.attachments
                  : [],
                reactions: Array.isArray(item.reactions) ? item.reactions : [],
              };
            }
            return item;
          });

          const key = tableToKey[table];
          const resultData =
            table === "allowed_emails"
              ? (data as any[]).map((d) => d.email)
              : finalData;

          // Deduplicate based on id if available
          const deduplicated = Array.isArray(resultData) 
            ? resultData.filter((item, index, self) => 
                !item.id || self.findIndex(t => t.id === item.id) === index
              )
            : resultData;

          set({ [key]: deduplicated } as any);

          // If the table was 'users', update currentUser specifically
          if (table === "users" && currentUser) {
            const updatedSelf = (deduplicated as any[]).find(u => u.id === currentUser.id);
            if (updatedSelf) {
              set({ currentUser: updatedSelf });
            }
          }
        }
      }),
    );
    set({ lastSyncTimestamp: Date.now() });
  },
});
