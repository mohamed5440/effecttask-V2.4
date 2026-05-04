import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

export const formatDuration = (duration: string | number) => {
  if (!duration) return "";
  const d = duration.toString();
  if (d === "1") return "يوم واحد";
  const num = Number(d);
  if (isNaN(num)) return d;
  if (num === 2) return "يومان";
  if (num > 2 && num <= 10) return `${num} أيام`;
  return `${num} يوم`;
};

export const formatRelativeTime = (date: Date | number) => {
  return formatDistanceToNow(date, { locale: ar, addSuffix: true });
};

export const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    open: "مفتوحة",
    searching: "جاري البحث",
    in_progress: "قيد التنفيذ",
    completed: "مكتملة",
    pending: "قيد المراجعة",
    accepted: "مقبول",
    rejected: "مرفوض",
    backup: "احتياط",
  };
  return labels[status] || status;
};

export const getStatusColors = (status: string) => {
  switch (status) {
    case "open":
    case "searching":
      return "bg-black text-white";
    case "in_progress":
    case "pending":
      return "bg-blue-50 text-blue-600 border border-blue-100";
    case "completed":
    case "accepted":
      return "bg-green-50 text-green-600 border border-green-100";
    case "rejected":
      return "bg-red-50 text-red-600 border border-red-100";
    case "backup":
      return "bg-amber-50 text-amber-600 border border-amber-100";
    default:
      return "bg-zinc-50 text-zinc-600 border border-zinc-100";
  }
};
