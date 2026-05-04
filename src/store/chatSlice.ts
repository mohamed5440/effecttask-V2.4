import { StateCreator } from "zustand";
import { AppState, ChatSlice } from "./types";
import { dbService } from "../services/db";
import { toast } from "sonner";

export const createChatSlice: StateCreator<AppState, [], [], ChatSlice> = (
  set,
  get,
) => ({
  messages: [],
  typingUsers: {},

  sendMessage: async (taskId, receiverId, content, attachments, replyToId) => {
    const { currentUser, tasks } = get();
    if (!currentUser) return;
    try {
      const { data, error } = await dbService.sendMessage({
        taskId,
        senderId: currentUser.id,
        receiverId,
        content,
        attachments,
        replyToId,
      });
      if (error) throw error;
      if (data) {
        set((state) => {
          if (state.messages.some((m) => m.id === data.id)) return state;
          const formattedMsg = {
            ...data,
            attachments: Array.isArray(data.attachments) ? data.attachments : [],
            reactions: data.reactions || {},
          };
          return { messages: [...state.messages, formattedMsg] };
        });

        const task = tasks.find((t) => t.id === taskId);
        await dbService.createNotification({
          userId: receiverId,
          message: `رسالة جديدة من ${currentUser.name}${task ? ` بخصوص مهمة "${task.title}"` : ""}`,
          type: "chat",
          targetId: taskId,
        });
      }
    } catch (error: any) {
      toast.error("عذراً، لم نتمكن من إرسال رسالتك.");
    }
  },

  addReaction: async (messageId, emoji) => {
    const { currentUser, messages } = get();
    if (!currentUser) return;

    const msg = messages.find((m) => m.id === messageId);
    if (!msg) return;

    const reactions = { ...(msg.reactions || {}) };
    if (!reactions[emoji]) reactions[emoji] = [];

    if (reactions[emoji].includes(currentUser.id)) {
      reactions[emoji] = reactions[emoji].filter((id) => id !== currentUser.id);
      if (reactions[emoji].length === 0) delete reactions[emoji];
    } else {
      reactions[emoji].push(currentUser.id);
    }

    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId ? { ...m, reactions } : m,
      ),
    }));

    await dbService.updateMessage(messageId, { reactions });
  },

  markAsRead: async (messageId) => {
    const { currentUser, messages } = get();
    if (!currentUser) return;

    const msg = messages.find((m) => m.id === messageId);
    if (!msg || msg.senderId === currentUser.id || msg.readAt) return;

    const readAt = Date.now();
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId ? { ...m, readAt } : m,
      ),
    }));

    await dbService.updateMessage(messageId, { readAt });
  },

  setTyping: (_taskId, _isTyping) => {
    // In a fully realtime environment, we would post this to the server / sockets
  },
});
