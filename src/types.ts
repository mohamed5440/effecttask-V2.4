type UserRole = "admin" | "user";

export interface User {
  id: string;
  name: string;
  email?: string;
  password?: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
  rating: number;
  skills: string[];
  completedTasksCount: number;
  isOnline: boolean;
  createdAt: number;
}

type TaskStatus = "open" | "in_progress" | "completed";

export interface Task {
  id: string;
  title: string;
  description: string;
  requiredSkills: string[];
  duration?: string;
  attachments?: string[];
  status: TaskStatus;
  createdAt: number;
  authorId: string;
  assignedToUser?: string;
}

export type ApplicationStatus = "pending" | "accepted" | "rejected" | "backup";

export interface Message {
  id: string;
  taskId: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: number;
  attachments?: string[];
  replyToId?: string;
  reactions?: Record<string, string[]>; // emoji -> list of userIds
  readAt?: number;
}

export interface TaskApplication {
  id: string;
  taskId: string;
  userId: string;
  status: ApplicationStatus;
  appliedAt: number;
  comment: string;
  budget?: string;
  estimatedDuration?: string;
  attachments?: string[];
}

export interface AppNotification {
  id: string;
  userId: string;
  message: string;
  isRead: boolean;
  createdAt: number;
  type?: "task" | "chat" | "system";
  targetId?: string;
}

export interface Review {
  id: string;
  taskId: string;
  userId: string;
  raterId: string;
  rating: number;
  comment: string;
  createdAt: number;
}

export interface Rating {
  id: string;
  userId: string;
  raterId: string;
  taskId?: string;
  score: number;
  createdAt: number;
}

export interface TeamMember {
  id: string;
  userId: string;
  addedById?: string;
  joinedAt: number;
  role: string;
}

export interface TaskStatusHistory {
  id: string;
  taskId: string;
  oldStatus?: string;
  newStatus: string;
  changedById?: string;
  changedAt: number;
}
