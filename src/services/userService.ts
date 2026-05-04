import { User } from "../types";
import { apiFetch, apiSignup, apiLogin } from "./api";

export const userService = {
  async login(credentials: any) {
    return apiLogin(credentials);
  },

  async signup(userData: any) {
    return apiSignup(userData);
  },

  async getUser(userId: string) {
    return apiFetch(`/api/users/${userId}`);
  },

  async getUserByEmail(email: string) {
    return apiFetch(`/api/users/by-email/${email}`);
  },

  async createUser(user: Partial<User>) {
    return this.signup(user);
  },

  async updateUser(userId: string, data: Partial<User>) {
    return apiFetch(`/api/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  },

  async sendHeartbeat() {
    return apiFetch("/api/users/heartbeat", {
      method: "POST",
    });
  },

  async sendOffline() {
    return apiFetch("/api/users/offline", {
      method: "POST",
    });
  },

  async createRating(
    userId: string,
    raterId: string,
    taskId: string | null,
    score: number,
  ) {
    return apiFetch("/api/ratings", {
      method: "POST",
      body: JSON.stringify({ userId, raterId, taskId, score }),
    });
  },
};
