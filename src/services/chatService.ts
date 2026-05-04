import { Message } from "../types";
import { apiFetch } from "./api";

export const chatService = {
  async sendMessage(message: Omit<Message, "id" | "createdAt">) {
    return apiFetch("/api/messages", {
      method: "POST",
      body: JSON.stringify(message),
    });
  },

  async getMessages(taskId?: string) {
    const url = taskId ? `/api/messages?taskId=${taskId}` : "/api/messages";
    return apiFetch(url);
  },

  async updateMessage(messageId: string, updates: Partial<Message>) {
    return apiFetch(`/api/messages/${messageId}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    });
  },
};
