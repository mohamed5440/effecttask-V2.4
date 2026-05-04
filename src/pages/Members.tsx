import React, { useState } from "react";
import { useStore } from "../store";
import { motion, AnimatePresence } from "motion/react";
import { MemberCard } from "../components/members/MemberCard";
import { UserPlus, Mail, X, Shield, Users } from "lucide-react";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function Members() {
  const {
    users,
    reviews,
    currentUser,
    allowedEmails,
    addAllowedEmail,
    removeAllowedEmail,
  } = useStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"members" | "management">(
    "members",
  );
  const [newEmail, setNewEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isAdmin = currentUser?.role === "admin";

  if (!isAdmin && activeTab === "management") {
    setActiveTab("members");
  }

  const sortedUsers = [...users]
    .filter((u) => u.role !== "admin")
    .filter((u) => {
      if (!searchQuery) return true;
      return (
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.skills || []).some((s) =>
          s.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      );
    })
    .sort((a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      return b.completedTasksCount - a.completedTasksCount;
    });

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || isSubmitting) return;

    setIsSubmitting(true);
    await addAllowedEmail(newEmail);
    setNewEmail("");
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-4 sm:space-y-8 text-start">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6">
        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-black tracking-tight">
            {activeTab === "members"
              ? `أعضاء فريقنا (${sortedUsers.length})`
              : "إدارة الدعوات المعتمدة"}
          </h1>
          {isAdmin && (
            <div className="flex items-center gap-1 p-1 bg-zinc-50 border border-zinc-100/50 rounded-xl w-full sm:w-fit">
              <button
                onClick={() => setActiveTab("members")}
                className={`flex-1 sm:flex-none text-[10px] uppercase tracking-wider font-bold px-4 py-2 rounded-lg transition-all ${activeTab === "members" ? "bg-white text-black" : "text-zinc-500 hover:text-black"}`}
              >
                أعضاء فريقنا
              </button>
              <button
                onClick={() => setActiveTab("management")}
                className={`flex-1 sm:flex-none text-[10px] uppercase tracking-wider font-bold px-4 py-2 rounded-lg transition-all ${activeTab === "management" ? "bg-white text-black" : "text-zinc-500 hover:text-black"}`}
              >
                إدارة الدعوات
              </button>
            </div>
          )}
        </div>

        {activeTab === "members" && (
          <div className="relative w-full md:w-64 space-y-1.5">
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">
              بحث
            </label>
            <input
              type="text"
              placeholder="بحث عن عضو..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 sm:px-5 py-3 sm:py-3.5 text-xs sm:text-sm focus:outline-none focus:border-black/20 font-medium text-start transition-all"
            />
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "members" ? (
          <motion.div
            key="members-grid"
            variants={container}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0 }}
            className="grid-responsive"
          >
            {sortedUsers.map((user, index) => (
              <MemberCard
                key={user.id}
                user={user}
                index={index}
                reviews={reviews}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="management-panel"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6 max-w-2xl w-full"
          >
            {/* Add Individual Email */}
            <div className="bg-zinc-50/50 border border-zinc-100 rounded-xl p-5 sm:p-8 space-y-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-black">
                  <UserPlus className="w-5 h-5" />
                  <h2 className="font-bold tracking-tight text-base sm:text-lg">
                    دعوة زميل جديد
                  </h2>
                </div>
                <p className="text-zinc-500 text-[11px] sm:text-xs font-medium leading-relaxed">
                  بإمكانك إضافة البريد الإلكتروني للزملاء ليتمكنوا من الانضمام
                  للفريق
                </p>
              </div>

              <form onSubmit={handleAddEmail} className="flex flex-col gap-3">
                <div className="relative w-full space-y-1.5">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-1">
                    البريد الإلكتروني
                  </label>
                  <div className="relative">
                    <Mail className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="email"
                      required
                      placeholder="example@gmail.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full bg-white border border-zinc-100 rounded-xl ps-11 pe-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all font-medium transition-all"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || !newEmail}
                  className="w-full bg-black text-white py-3.5 rounded-xl font-bold text-sm hover:bg-zinc-800 disabled:opacity-50 transition-all active:scale-[0.98]"
                >
                  إرسال دعوة للفريق
                </button>
              </form>
            </div>

            {/* Allowed Emails List */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-zinc-400 px-2 justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    رسائل البريد المسموح بها
                  </span>
                </div>
                <span className="text-[10px] font-bold bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-xl">
                  {allowedEmails.length}
                </span>
              </div>

              <div className="grid gap-2">
                {allowedEmails.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-zinc-100 rounded-xl space-y-2">
                    <div className="bg-zinc-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto text-zinc-300">
                      <Mail className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-zinc-400">
                      لا يوجد أي بريد إلكتروني في قائمة الانتظار حالياً
                    </p>
                  </div>
                ) : (
                  allowedEmails.map((email) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      key={email}
                      className="bg-white border border-zinc-200 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 group hover:border-black/10 transition-colors"
                    >
                      <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 overflow-hidden">
                        <div className="w-8 h-8 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 shrink-0">
                          <Users className="w-4 h-4" />
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-zinc-700 truncate max-w-[200px] sm:max-w-none">
                          {email}
                        </span>
                        {users.some((u) => u.email === email) ? (
                          <span className="text-[8px] bg-green-50 text-green-600 px-1.5 py-0.5 rounded-xl font-bold uppercase tracking-tighter shrink-0">
                            مسجل بالفعل
                          </span>
                        ) : (
                          <span className="text-[8px] bg-zinc-50 text-zinc-400 px-1.5 py-0.5 rounded-xl font-bold uppercase tracking-tighter shrink-0">
                            في انتظار التسجيل
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => removeAllowedEmail(email)}
                        className="p-2 sm:p-2 text-zinc-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all sm:opacity-0 group-hover:opacity-100 self-end sm:self-auto shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
