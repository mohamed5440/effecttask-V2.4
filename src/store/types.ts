import {
  User,
  Task,
  TaskApplication,
  AppNotification,
  Review,
  Message,
  Rating,
  TeamMember,
  TaskStatusHistory,
  ApplicationStatus,
} from "../types";

export interface AuthSlice {
  currentUser: User | null;
  authError: string | null;
  onlineUsers: string[];
  allowedEmails: string[];
  initialize: (force?: boolean) => Promise<void>;
  logout: (silent?: boolean) => Promise<void>;
  addAllowedEmail: (email: string) => Promise<void>;
  removeAllowedEmail: (email: string) => Promise<void>;
}

export interface TaskSlice {
  tasks: Task[];
  applications: TaskApplication[];
  users: User[];
  reviews: Review[];
  ratings: Rating[];
  teamMembers: TeamMember[];
  taskStatusHistory: TaskStatusHistory[];
  notifications: AppNotification[];
  selectedTaskId: string | null;
  setSelectedTaskId: (id: string | null) => void;
  lastNotificationType: "task" | "chat" | "system" | null;
  setLastNotificationType: (type: "task" | "chat" | "system" | null) => void;
  createTask: (
    task: Omit<Task, "id" | "createdAt" | "status" | "authorId">,
  ) => Promise<void>;
  applyForTask: (
    taskId: string,
    comment: string,
    budget?: string,
    estimatedDuration?: string,
    attachments?: string[],
  ) => Promise<void>;
  updateApplicationStatus: (
    applicationId: string,
    status: ApplicationStatus,
  ) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  completeTaskAndRate: (
    taskId: string,
    userId: string,
    rating: number,
    comment: string,
  ) => Promise<void>;
  updateUser: (userId: string, data: Partial<User>) => Promise<void>;
  uploadAvatar: (userId: string, file: File) => Promise<string | null>;
  uploadFile: (bucket: string, file: File) => Promise<string | null>;
  fetchUser: (userId: string) => Promise<User | null>;
  deleteTask: (taskId: string) => Promise<void>;
}

export interface ChatSlice {
  messages: Message[];
  typingUsers: Record<string, string[]>;
  sendMessage: (
    taskId: string,
    receiverId: string,
    content: string,
    attachments?: string[],
    replyToId?: string,
  ) => Promise<void>;
  addReaction: (messageId: string, emoji: string) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  setTyping: (taskId: string, isTyping: boolean) => void;
}

export interface RealtimeSlice {
  isInitialized: boolean;
  error: string | null;
  dbStatus: { connected: boolean; message: string; host: string } | null;
  lastSyncTimestamp: number | null;
  setCurrentUser: (userId: string) => void;
  setupRealtime: (userId: string) => void;
  fetchInitialData: () => Promise<void>;
  checkDbStatus: () => Promise<void>;
}

export interface AppState
  extends AuthSlice, TaskSlice, ChatSlice, RealtimeSlice {}
