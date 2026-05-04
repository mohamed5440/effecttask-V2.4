import { AppNotification } from "../types";
import { apiFetch } from "./api";

export const notificationService = {
  async getNotifications() {
    return apiFetch("/api/notifications");
  },

  async createNotification(
    notification: Omit<AppNotification, "id" | "createdAt" | "isRead">,
  ) {
    return apiFetch("/api/notifications", {
      method: "POST",
      body: JSON.stringify(notification),
    });
  },

  async markNotificationRead(id: string) {
    return apiFetch(`/api/notifications/${id}`, {
      method: "PATCH",
    });
  },
};
