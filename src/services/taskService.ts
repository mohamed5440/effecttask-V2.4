import { Task, TaskApplication, ApplicationStatus, Review } from "../types";
import { apiFetch } from "./api";

export const taskService = {
  async createTask(task: Omit<Task, "id" | "createdAt" | "status">) {
    return apiFetch("/api/tasks", {
      method: "POST",
      body: JSON.stringify(task),
    });
  },

  async createApplication(
    application: Omit<TaskApplication, "id" | "appliedAt" | "status">,
  ) {
    return apiFetch(`/api/tasks/${application.taskId}/applications`, {
      method: "POST",
      body: JSON.stringify(application),
    });
  },

  async updateApplicationStatus(
    applicationId: string,
    status: ApplicationStatus,
  ) {
    return apiFetch(`/api/applications/${applicationId}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  async assignTask(taskId: string, applicationId: string, userId: string) {
    // This could also be a specialized endpoint
    return apiFetch(`/api/tasks/${taskId}/assign`, {
      method: "POST",
      body: JSON.stringify({ applicationId, userId }),
    });
  },

  async completeTask(taskId: string) {
    return apiFetch(`/api/tasks/${taskId}/complete`, {
      method: "POST",
    });
  },

  async createReview(review: Omit<Review, "id" | "createdAt">) {
    return apiFetch("/api/reviews", {
      method: "POST",
      body: JSON.stringify(review),
    });
  },

  async deleteTask(taskId: string) {
    return apiFetch(`/api/tasks/${taskId}`, {
      method: "DELETE",
    });
  },

  async getTasks() {
    return apiFetch("/api/tasks");
  },

  async getTask(taskId: string) {
    return apiFetch(`/api/tasks/${taskId}`);
  },

  async getApplications(taskId: string) {
    return apiFetch(`/api/tasks/${taskId}/applications`);
  },
};
