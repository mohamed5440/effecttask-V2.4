import { SUPER_ADMIN_EMAILS } from "../constants";
import { apiFetch } from "./api";

export const adminService = {
  async getAllowedEmails() {
    return apiFetch("/api/admin/allowed-emails");
  },

  async addAllowedEmail(email: string, addedById: string) {
    return apiFetch("/api/admin/allowed-emails", {
      method: "POST",
      body: JSON.stringify({ email, addedById }),
    });
  },

  async removeAllowedEmail(email: string) {
    return apiFetch(`/api/admin/allowed-emails/${email}`, {
      method: "DELETE",
    });
  },

  async checkEmailAuthorized(email: string) {
    const cleanEmail = email.toLowerCase().trim();
    if (SUPER_ADMIN_EMAILS.includes(cleanEmail)) {
      return { data: { authorized: true }, error: null };
    }
    return apiFetch(`/api/admin/check-auth/${cleanEmail}`);
  },

  async logAccessAttempt(email: string, action: string, status: string) {
    return apiFetch("/api/admin/logs", {
      method: "POST",
      body: JSON.stringify({
        email,
        action,
        status,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "server",
      }),
    });
  },
};
