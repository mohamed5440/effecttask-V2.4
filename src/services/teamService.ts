import { apiFetch } from "./api";

export const teamService = {
  async getTeamMembers() {
    return apiFetch("/api/team");
  },

  async addToTeam(userId: string, addedById: string) {
    return apiFetch("/api/team", {
      method: "POST",
      body: JSON.stringify({ userId, addedById }),
    });
  },
};

export const historyService = {
  async logStatusChange(
    taskId: string,
    oldStatus: string,
    newStatus: string,
    changedById?: string,
  ) {
    return apiFetch("/api/history/status", {
      method: "POST",
      body: JSON.stringify({ taskId, oldStatus, newStatus, changedById }),
    });
  },
};
