import { useState, useEffect, useRef } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useStore } from "../../store";
import {
  Bell,
  Target,
  Users,
  LogOut,
  Menu,
  X,
  MessageSquare,
  Briefcase,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { motion, AnimatePresence } from "motion/react";

export default function AppLayout() {
  const currentUser = useStore((state) => state.currentUser);
  const logout = useStore((state) => state.logout);
  const allNotifications = useStore((state) => state.notifications);
  const markNotificationRead = useStore((state) => state.markNotificationRead);
  const setSelectedTaskId = useStore((state) => state.setSelectedTaskId);
  const setLastNotificationType = useStore(
    (state) => state.setLastNotificationType,
  );
  const navigate = useNavigate();

  const notifications = allNotifications.filter(
    (n) => n.userId === currentUser?.id,
  );

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target as Node)
      ) {
        setIsNotifOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleNotificationClick = async (notification: any) => {
    await markNotificationRead(notification.id);

    if (notification.type === "task" || notification.type === "chat") {
      if (notification.targetId) {
        setLastNotificationType(notification.type);
        setSelectedTaskId(notification.targetId);
        if (location.pathname !== "/") {
          navigate("/");
        }
      }
    }
    setIsNotifOpen(false);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div
      className="min-h-screen flex flex-col bg-white"
      dir="rtl"
    >
      <header className="fixed top-0 start-0 w-full bg-white border-b border-zinc-100 z-50 flex flex-col">
        <div className="responsive-container">
          <div className="flex justify-between items-center h-16 relative gap-3 sm:gap-4">
            <div className="flex-none flex items-center justify-start z-10">
              <Link
                to="/"
                className="flex items-center gap-2 text-lg sm:text-xl font-bold text-black tracking-tight shrink-0"
              >
                <Target className="w-5 h-5 sm:w-6 sm:h-6 text-black shrink-0" />
                <span className="inline-block whitespace-nowrap">إيفيكت تاسك</span>
              </Link>
            </div>

            <nav className="hidden md:flex flex-1 gap-4 xl:gap-8 items-center justify-center h-full">
              <Link
                to="/"
                className={`inline-flex items-center px-1 h-full text-xs lg:text-sm font-bold border-b-2 transition-colors ${
                  location.pathname === "/"
                    ? "border-black text-black"
                    : "border-transparent text-zinc-400 hover:text-black hover:border-zinc-200"
                }`}
              >
                {currentUser?.role === "admin" ? "إدارة المهام" : "سوق المهام"}
              </Link>
              <Link
                to="/members"
                className={`inline-flex items-center px-1 h-full text-xs lg:text-sm font-bold border-b-2 transition-colors ${
                  location.pathname === "/members"
                    ? "border-black text-black"
                    : "border-transparent text-zinc-400 hover:text-black hover:border-zinc-200"
                }`}
              >
                الأعضاء
              </Link>
              <Link
                to="/profile"
                className={`inline-flex items-center px-1 h-full text-xs lg:text-sm font-bold border-b-2 transition-colors ${
                  location.pathname === "/profile"
                    ? "border-black text-black"
                    : "border-transparent text-zinc-400 hover:text-black hover:border-zinc-200"
                }`}
              >
                ملفي الشخصي
              </Link>
            </nav>

            <div className="flex-none flex justify-end items-center gap-1 sm:gap-4 z-10 relative">
              {/* Notifications */}
              {currentUser && (
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => {
                      setIsNotifOpen(!isNotifOpen);
                      setIsMenuOpen(false);
                    }}
                    className="p-1 sm:p-2 text-zinc-400 hover:text-black focus:outline-none relative transition-colors"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 end-1.5 block h-2 w-2 rounded-full bg-black border border-white" />
                    )}
                  </button>

                  <AnimatePresence>
                    {isNotifOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="fixed sm:absolute top-[72px] sm:top-full start-2 end-2 sm:start-auto sm:end-0 sm:mt-4 w-auto sm:w-80 max-w-[calc(100vw-16px)] sm:max-w-none rounded-xl py-2 bg-white border border-zinc-100 focus:outline-none z-[60] text-start flex flex-col"
                      >
                        <div className="px-4 py-3 flex justify-between items-center bg-white/80 backdrop-blur-md rounded-t-xl sticky top-0 z-10 border-b border-zinc-100">
                          <h3 className="text-sm font-bold text-black uppercase tracking-tight">
                            الإشعارات
                          </h3>
                          {unreadCount > 0 && (
                            <span className="text-[10px] bg-black text-white px-2 py-0.5 rounded-xl font-bold">
                              {unreadCount} جديد
                            </span>
                          )}
                        </div>
                        <div className="overflow-y-auto max-h-[60vh] md:max-h-96 overscroll-contain">
                          {notifications.length === 0 ? (
                            <div className="px-4 py-8 text-xs text-center text-zinc-400 font-bold tracking-tight uppercase">
                              لا يوجد إشعارات
                            </div>
                          ) : (
                            notifications.map((notification) => (
                              <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                key={notification.id}
                                onClick={() =>
                                  handleNotificationClick(notification)
                                }
                                className={`px-4 py-3 hover:bg-black/5 cursor-pointer transition-colors flex gap-3 items-start ${!notification.isRead ? "bg-white border-e-2 border-black" : ""}`}
                              >
                                <div
                                  className={`p-2 rounded-lg shrink-0 ${notification.type === "chat" ? "bg-blue-50 text-blue-500" : notification.type === "task" ? "bg-amber-50 text-amber-500" : "bg-zinc-50 text-zinc-500"}`}
                                >
                                  {notification.type === "chat" ? (
                                    <MessageSquare className="w-3.5 h-3.5" />
                                  ) : (
                                    <Briefcase className="w-3.5 h-3.5" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-zinc-600 font-bold tracking-tight leading-snug">
                                    {notification.message}
                                  </p>
                                  <p className="text-[10px] text-zinc-400 mt-1 font-bold uppercase tracking-tighter">
                                    {formatDistanceToNow(
                                      notification.createdAt,
                                      {
                                        addSuffix: true,
                                        locale: ar,
                                      },
                                    )}
                                  </p>
                                </div>
                              </motion.div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Profile dropdown & User Switcher for demo */}
              <div
                className={`relative flex items-center gap-2 sm:gap-4 ${currentUser ? "border-s border-zinc-100 ps-2.5 sm:ps-6" : ""} ms-1 sm:ms-0`}
                ref={menuRef}
              >
                {currentUser ? (
                  <>
                    <div className="text-end hidden lg:flex flex-col items-end shrink-0 max-w-[120px] md:max-w-none truncate text-ellipsis">
                      <span className="text-sm font-bold text-black tracking-tight truncate w-full">
                        {currentUser.name}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                        {currentUser.role === "admin" ? "مدير" : "عضو فريق"}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setIsMenuOpen(!isMenuOpen);
                        setIsNotifOpen(false);
                      }}
                      className="flex text-sm focus:outline-none transition-all active:scale-95 relative"
                    >
                      <img
                        className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl object-cover aspect-square border border-zinc-100 hover:border-black/20 transition-all"
                        src={
                          currentUser.avatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name || "مستخدم")}&background=000&color=fff`
                        }
                        alt={currentUser.name}
                      />
                      <span 
                        className={`absolute -bottom-0.5 -end-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${currentUser.isOnline ? "bg-green-500" : "bg-zinc-300"}`}
                      />
                    </button>

                    <AnimatePresence>
                      {isMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="origin-top-end absolute end-0 top-12 mt-3 w-56 rounded-xl py-2 bg-white border border-zinc-100 focus:outline-none z-50 text-start overflow-hidden"
                        >
                          <div className="px-4 py-2 border-b border-zinc-100 mb-1">
                            <button
                              onClick={() => useStore.getState().updateUser(currentUser.id, { isOnline: !currentUser.isOnline })}
                              className="w-full flex items-center justify-between group/status"
                            >
                              <div className="flex flex-col items-start gap-0.5">
                                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none">حالة التواجد</span>
                                <span className={`text-xs font-bold leading-none ${currentUser.isOnline ? "text-green-600" : "text-zinc-500"}`}>
                                  {currentUser.isOnline ? "متصل الآن" : "غير متصل"}
                                </span>
                              </div>
                              <div className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${currentUser.isOnline ? "bg-black" : "bg-zinc-100"}`}>
                                <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300 ${currentUser.isOnline ? "end-1" : "start-1"}`} />
                              </div>
                            </button>
                          </div>
                          <Link
                            to="/profile"
                            onClick={() => setIsMenuOpen(false)}
                            className="w-full text-start px-4 py-3 hover:bg-black/5 flex items-center gap-3 transition-colors text-sm font-bold text-black"
                          >
                            <Users className="w-4 h-4" />
                            الملف الشخصي
                          </Link>
                          <button
                            onClick={() => {
                              logout();
                              setIsMenuOpen(false);
                            }}
                            className="w-full text-start px-4 py-2 hover:bg-red-50 flex items-center gap-3 transition-colors text-sm font-bold text-red-600 border-t border-zinc-100 mt-1 pt-2"
                          >
                            <LogOut className="w-4 h-4" />
                            تسجيل الخروج
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <Link
                    to="/login"
                    className="px-6 py-2 bg-black text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-all active:scale-95"
                  >
                    تسجيل الدخول
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full responsive-container pt-20 sm:pt-24 md:pt-28 pb-8 sm:pb-12 md:pb-20 mb-20 sm:mb-24 lg:mb-0 relative min-h-[600px]">
        <Outlet />
      </main>



      {/* Mobile nav */}
      <div className="md:hidden fixed bottom-4 sm:bottom-6 inset-x-2 sm:inset-x-8 bg-white/90 backdrop-blur-md border border-zinc-200 flex justify-around p-1.5 z-50 rounded-2xl w-[calc(100%-16px)] sm:w-auto mx-auto max-w-sm">
        <Link
          to="/"
          className={`flex flex-col items-center gap-1.5 p-2 flex-1 rounded-xl transition-all duration-300 ${
            location.pathname === "/" ? "bg-black text-white" : "text-zinc-500 hover:bg-zinc-50"
          }`}
        >
          <Target className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-tight">
            {currentUser?.role === "admin" ? "الإدارة" : "المهام"}
          </span>
        </Link>
        <Link
          to="/members"
          className={`flex flex-col items-center gap-1.5 p-2 flex-1 rounded-xl transition-all duration-300 ${
            location.pathname === "/members"
              ? "bg-black text-white"
              : "text-zinc-500 hover:bg-zinc-50"
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-tight text-center">
            الأعضاء
          </span>
        </Link>
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className={`flex flex-col items-center gap-1.5 p-2 flex-1 rounded-xl transition-all duration-300 ${
            isMobileMenuOpen ? "bg-black text-white" : "text-zinc-500 hover:bg-zinc-50"
          }`}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-tight text-center">
            القائمة
          </span>
        </button>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-[60] flex items-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full bg-white rounded-t-xl p-6 pb-32 flex flex-col gap-4 border-t border-zinc-100 max-h-[90vh] overflow-y-auto overscroll-contain"
            >
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-bold text-black tracking-tight">
                  القائمة
                </h2>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 bg-zinc-100 rounded-xl text-zinc-500 hover:text-black"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {currentUser ? (
                <>
                  <div className="flex items-center gap-4 p-4 rounded-xl border border-zinc-100 mb-2">
                    <img
                      src={
                        currentUser.avatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name || "مستخدم")}&background=000&color=fff`
                      }
                      alt={currentUser.name}
                      className="w-12 h-12 rounded-lg object-cover aspect-square"
                    />
                    <div>
                      <p className="font-bold text-black">{currentUser.name}</p>
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                        {currentUser.role === "admin"
                          ? "مدير النظام"
                          : "عضو فريق"}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border border-zinc-100 mb-2">
                    <button
                      onClick={() => useStore.getState().updateUser(currentUser.id, { isOnline: !currentUser.isOnline })}
                      className="w-full flex items-center justify-between"
                    >
                      <div className="flex flex-col items-start gap-1">
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">حالة التواجد</span>
                        <span className={`font-bold ${currentUser.isOnline ? "text-green-600" : "text-zinc-500"}`}>
                          {currentUser.isOnline ? "متصل الآن" : "غير متصل"}
                        </span>
                      </div>
                      <div className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${currentUser.isOnline ? "bg-black" : "bg-zinc-100"}`}>
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${currentUser.isOnline ? "end-1" : "start-1"}`} />
                      </div>
                    </button>
                  </div>
                  
                  <Link
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex justify-between items-center p-4 bg-zinc-50 rounded-xl font-bold text-black hover:bg-zinc-100 transition-colors"
                  >
                    <span>ملفي الشخصي</span>
                    <Users className="w-5 h-5 text-zinc-400" />
                  </Link>

                  <button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex justify-between items-center p-4 rounded-xl font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors mt-4"
                  >
                    <span>تسجيل الخروج</span>
                    <LogOut className="w-5 h-5" />
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full py-4 text-center bg-black text-white rounded-xl font-bold active:scale-95 transition-all mt-4"
                >
                  تسجيل الدخول
                </Link>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
