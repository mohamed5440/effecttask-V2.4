import { userService } from "./userService";
import { taskService } from "./taskService";
import { notificationService } from "./notificationService";
import { chatService } from "./chatService";
import { adminService } from "./adminService";
import { teamService, historyService } from "./teamService";
import { apiFetch } from "./api";

export const dbService = {
  ...userService,
  ...taskService,
  ...notificationService,
  ...chatService,
  ...adminService,
  ...teamService,
  ...historyService,

  async getInitialData(table: string, _limit = 100) {
    const tableToEndpoint: Record<string, string> = {
      tasks: "/api/tasks",
      users: "/api/users",
      applications: "/api/applications",
      notifications: "/api/notifications",
      reviews: "/api/reviews",
      messages: "/api/messages",
      ratings: "/api/ratings",
      team_members: "/api/team",
      task_status_history: "/api/history/status",
      allowed_emails: "/api/admin/allowed-emails",
    };

    if (tableToEndpoint[table]) {
      return apiFetch(tableToEndpoint[table]);
    }
    
    return { data: [], error: "Endpoint not specifically implemented for " + table };
  },
};
