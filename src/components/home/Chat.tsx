import React, { useState, useEffect, useRef } from "react";
import { useStore } from "../../store";
import { Message, User } from "../../types";
import { Send, MessageSquare, Check, CheckCheck, X, Plus, File } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "../../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

interface ChatProps {
  taskId: string;
  partnerId: string;
}

export default function Chat({ taskId, partnerId }: ChatProps) {
  const {
    messages,
    currentUser,
    users,
    sendMessage,
    typingUsers,
    setTyping,
    markAsRead,
    uploadFile,
    fetchUser,
  } = useStore();

  const [content, setContent] = useState("");
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);
  const [localPartner, setLocalPartner] = useState<User | undefined>(
    users.find((u) => u.id === partnerId),
  );

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const found = users.find((u) => u.id === partnerId);
    if (found) {
      setLocalPartner(found);
    } else {
      fetchUser(partnerId).then((user) => setLocalPartner(user || undefined));
    }
  }, [partnerId, users, fetchUser]);

  const partner = localPartner;
  const taskMessages = messages.filter((m) => m.taskId === taskId);
  const isPartnerTyping = typingUsers[taskId]?.includes(partnerId);
  const isPartnerOnline = partner?.isOnline;

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();

    // Mark messages as read
    const unreadMessages = taskMessages.filter(
      (m) => m.senderId === partnerId && !m.readAt,
    );
    unreadMessages.forEach((m) => markAsRead(m.id));
  }, [taskMessages.length]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100);
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!content.trim() && attachments.length === 0) || !currentUser) return;

    await sendMessage(
      taskId,
      partnerId,
      content.trim(),
      attachments.length > 0 ? attachments : undefined,
      replyTo?.id,
    );

    setContent("");
    setReplyTo(null);
    setAttachments([]);
    setTyping(taskId, false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    if (e.target.value.length > 0) {
      setTyping(taskId, true);
    } else {
      setTyping(taskId, false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const urls = await Promise.all(
        Array.from(files).map((file) => uploadFile("attachments", file)),
      );
      const validUrls = urls.filter((url): url is string => !!url);
      setAttachments((prev) => [...prev, ...validUrls]);
      toast.success("تم رفع الملفات بنجاح");
    } catch (error) {
      toast.error("حدث خطأ أثناء رفع الملفات، يرجى المحاولة مرة أخرى.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const formatDateLabel = (date: number) => {
    if (isToday(date)) return "اليوم";
    if (isYesterday(date)) return "الأمس";
    return format(date, "d MMMM yyyy", { locale: ar });
  };

  if (!currentUser) return null;

  if (!partner) {
    return (
      <div className="flex flex-col h-[400px] sm:h-[500px] border border-zinc-100 rounded-2xl bg-white items-center justify-center">
        <div className="w-8 h-8 border-4 border-black/10 border-t-black rounded-full animate-spin" />
        <p className="mt-4 text-xs font-bold text-zinc-400">جاري تحميل بيانات المحادثة...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[450px] sm:h-[550px] lg:h-[650px] bg-white rounded-xl border border-zinc-200 overflow-hidden text-start relative">
      {/* Chat Header */}
      <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-zinc-100 flex items-center justify-between bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative shrink-0">
            <img
              src={
                partner.avatar ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(partner.name || "User")}&background=000&color=fff`
              }
              alt=""
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl border border-zinc-200 bg-white object-cover aspect-square"
            />
            {isPartnerOnline && (
              <span className="absolute -bottom-0.5 -end-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 border-2 border-white rounded-full"></span>
            )}
          </div>
          <div className="text-start min-w-0">
            <h4 className="font-bold text-black text-xs sm:text-sm truncate">
              {partner.name}
            </h4>
            <div className="flex items-center gap-1.5 truncate">
              {isPartnerTyping ? (
                <div className="flex items-center gap-1">
                  <span className="text-[9px] sm:text-[10px] text-zinc-400 font-bold">
                    يكتب...
                  </span>
                  <div className="flex gap-0.5">
                    <span className="w-0.5 h-0.5 bg-zinc-300 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-0.5 h-0.5 bg-zinc-300 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-0.5 h-0.5 bg-zinc-300 rounded-full animate-bounce"></span>
                  </div>
                </div>
              ) : isPartnerOnline ? (
                <p className="text-[9px] sm:text-[10px] text-green-600 font-bold tracking-tight uppercase">
                  متصل
                </p>
              ) : (
                <p className="text-[9px] sm:text-[10px] text-zinc-400 font-bold tracking-tight uppercase">
                  غير متصل
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Messages list */}
      <div className="relative flex-1 overflow-hidden">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6 scroll-smooth bg-zinc-50/20 custom-scrollbar"
        >
          <AnimatePresence initial={false}>
            {taskMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400 text-xs font-bold gap-3">
                <div className="p-6 rounded-xl bg-zinc-50 border border-zinc-100">
                  <MessageSquare className="w-8 h-8 text-zinc-200" />
                </div>
                ابدأ المحادثة الآن لمناقشة تفاصيل المهمة
              </div>
            ) : (
              taskMessages.map((msg, index) => {
                const isMine = msg.senderId === currentUser.id;
                const nextMsg = taskMessages[index + 1];
                const prevMsg = taskMessages[index - 1];
                const isLastInGroup =
                  !nextMsg || nextMsg.senderId !== msg.senderId;

                const showDateSeparator =
                  !prevMsg ||
                  new Date(prevMsg.createdAt).toDateString() !==
                    new Date(msg.createdAt).toDateString();

                const repliedMsg = msg.replyToId
                  ? taskMessages.find((m) => m.id === msg.replyToId)
                  : null;

                return (
                  <React.Fragment key={msg.id}>
                    {showDateSeparator && (
                      <div className="flex items-center gap-4 my-4">
                        <div className="flex-1 h-px bg-zinc-100"></div>
                        <span className="text-[10px] font-black text-zinc-400 bg-zinc-50 border border-zinc-100 px-4 py-1.5 rounded-xl uppercase tracking-widest">
                          {formatDateLabel(msg.createdAt)}
                        </span>
                        <div className="flex-1 h-px bg-zinc-100"></div>
                      </div>
                    )}
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={cn(
                        "max-w-[92%] sm:max-w-[85%] md:max-w-[75%] flex flex-col group/msg",
                        isMine
                          ? "self-end items-end"
                          : "self-start items-start",
                        !isLastInGroup && "mb-[-18px]",
                      )}
                    >
                      {/* Reply preview above message */}
                      {repliedMsg && (
                        <div
                          className={cn(
                            "px-3 py-2 rounded-t-xl bg-zinc-100 border-x border-t border-zinc-200 text-[11px] mb-[-8px] max-w-full truncate opacity-60 flex items-center gap-2",
                            isMine ? "me-2" : "ms-2",
                          )}
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span className="font-bold truncate">
                            {repliedMsg.content || "مرفق"}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 max-w-full">
                        {!isMine && (
                          <button
                            onClick={() => setReplyTo(msg)}
                            className="opacity-0 group-hover/msg:opacity-100 p-1.5 rounded-xl hover:bg-zinc-100 transition-opacity text-zinc-400 shrink-0"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <div
                          className={cn(
                            "relative text-sm font-bold leading-relaxed break-words min-w-0 break-all sm:break-words overflow-hidden",
                            isMine
                              ? "bg-black text-white rounded-xl rounded-ts-none"
                              : "bg-white text-zinc-800 rounded-xl rounded-te-none border border-zinc-200",
                          )}
                        >
                          {/* Attachments */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className={cn(
                              "grid grid-cols-1 gap-1 min-w-0 sm:min-w-[200px]",
                              msg.content && "mb-1"
                            )}>
                              {msg.attachments?.map((url, i) => {
                                const isImage = url.startsWith("data:image/") || url.match(/\.(jpeg|jpg|gif|png)$/i);
                                return (
                                  <a
                                    key={i}
                                    href={url}
                                    download={`chat_attachment_${i + 1}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full overflow-hidden rounded-xl"
                                  >
                                    {isImage ? (
                                      <img
                                        src={url}
                                        alt=""
                                        className="w-auto h-auto max-w-[200px] sm:max-w-[250px] max-h-[250px] object-contain rounded-lg cursor-pointer hover:opacity-90 transition-opacity bg-black/5"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : (
                                      <div className="flex items-center gap-3 p-4 bg-zinc-100 rounded-xl hover:bg-zinc-200 transition-colors">
                                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-zinc-200">
                                          <File className="w-5 h-5 text-zinc-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">
                                            ملف مرفق
                                          </p>
                                          <p className="text-xs font-bold text-zinc-800 truncate">
                                            تحميل الملف
                                          </p>
                                        </div>
                                      </div>
                                    )}
                                  </a>
                                );
                              })}
                            </div>
                          )}

                          {msg.content && (
                            <div className="px-4 py-3 break-words whitespace-pre-wrap">
                              {msg.content}
                            </div>
                          )}
                        </div>

                        {isMine && (
                          <button
                            onClick={() => setReplyTo(msg)}
                            className="opacity-0 group-hover/msg:opacity-100 p-1.5 rounded-xl hover:bg-zinc-100 transition-opacity text-zinc-400 shrink-0"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {isLastInGroup && (
                        <div className="flex items-center gap-1.5 mt-1.5 px-1 text-start">
                          <span className="text-[10px] text-zinc-400 font-black">
                            {format(msg.createdAt, "HH:mm", { locale: ar })}
                          </span>
                          {isMine &&
                            (msg.readAt ? (
                              <CheckCheck className="w-3.5 h-3.5 text-green-500" />
                            ) : (
                              <Check className="w-3.5 h-3.5 text-zinc-400" />
                            ))}
                        </div>
                      )}
                    </motion.div>
                  </React.Fragment>
                );
              })
            )}
          </AnimatePresence>
        </div>

        {/* Scroll to bottom button */}
        <AnimatePresence>
          {showScrollButton && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              onClick={scrollToBottom}
              className="absolute bottom-4 start-1/2 -translate-x-1/2 p-2 bg-black text-white rounded-xl hover:bg-zinc-800 transition-colors z-20"
            >
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="border-t border-zinc-100 bg-white">
        {/* Reply Preview */}
        <AnimatePresence>
          {replyTo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-4 py-2 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between"
            >
              <div className="flex items-center gap-3 text-xs overflow-hidden">
                <MessageSquare className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <div className="flex flex-col truncate">
                  <span className="font-bold text-black">
                    رد على{" "}
                    {replyTo.senderId === currentUser.id
                      ? "نفسك"
                      : partner.name}
                  </span>
                  <span className="text-zinc-500 truncate">
                    {replyTo.content || "مرفق"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setReplyTo(null)}
                className="p-1 hover:bg-zinc-200 rounded-xl transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Attachments Preview */}
        <AnimatePresence>
          {attachments.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="p-4 flex flex-wrap gap-3 bg-zinc-50/50"
            >
              {attachments.map((url, i) => {
                const isImage = url.startsWith("data:image/") || url.match(/\.(jpeg|jpg|gif|png)$/i);
                return (
                  <div key={i} className="relative group shrink-0">
                    {isImage ? (
                      <img
                        src={url}
                        alt=""
                        className="w-16 h-16 rounded-xl object-cover border border-zinc-200"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-white border border-zinc-200 flex items-center justify-center">
                        <File className="w-6 h-6 text-zinc-300" />
                      </div>
                    )}
                    <button
                      onClick={() =>
                        setAttachments((prev) =>
                          prev.filter((_, idx) => idx !== i),
                        )
                      }
                      className="absolute -top-1.5 -start-1.5 bg-black text-white p-0.5 rounded-xl"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
              {isUploading && (
                <div className="w-16 h-16 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-zinc-400">
                    ...
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-2 sm:p-4">
          <div className="relative group">
            <textarea
              ref={inputRef}
              value={content}
              onChange={handleTyping}
              onKeyDown={handleKeyDown}
              placeholder="اكتب رسالتك..."
              rows={1}
              className="w-full px-4 sm:px-6 py-3.5 sm:py-4 pe-20 sm:pe-36 rounded-xl border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all text-sm bg-zinc-50 focus:bg-white font-medium text-start min-h-[52px] sm:min-h-[58px] max-h-40 resize-none leading-relaxed group-hover:border-zinc-300"
            />
            <div className="absolute end-1.5 sm:end-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 sm:gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                multiple
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="p-2 sm:p-2.5 rounded-xl text-zinc-400 hover:bg-zinc-100 hover:text-black transition-all disabled:opacity-30 active:scale-95 shrink-0"
                title="إرفاق ملف"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <button
                onClick={() => handleSend()}
                disabled={
                  (!content.trim() && attachments.length === 0) || isUploading
                }
                className="w-10 h-10 sm:auto sm:px-5 sm:h-11 rounded-xl bg-black text-white flex items-center gap-2 hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed group shrink-0 justify-center"
              >
                <span className="text-[11px] font-bold uppercase hidden sm:inline px-1">
                  إرسال
                </span>
                <Send className="w-4 h-4 rotate-180" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
