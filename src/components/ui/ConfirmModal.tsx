import React from "react";
import { Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  icon?: React.ReactNode;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "تأكيد",
  cancelText = "إلغاء",
  icon = <Trash2 className="w-8 h-8 sm:w-10 sm:h-10" />,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110] flex items-end sm:items-center justify-center p-3 sm:p-6 text-start"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-t-xl sm:rounded-xl w-full max-w-sm border border-zinc-200 p-6 sm:p-8 md:p-10 flex flex-col gap-6 sm:gap-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center space-y-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-50 text-red-500 rounded-xl flex items-center justify-center mx-auto mb-2">
                {icon}
              </div>
              <div className="space-y-2">
                <h3 className="text-xl sm:text-2xl font-black text-black">
                  {title}
                </h3>
                <p className="text-sm sm:text-base text-zinc-500 font-medium leading-relaxed px-2">
                  {description}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="w-full py-4 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors active:scale-95 text-base sm:text-lg"
              >
                {confirmText}
              </button>
              <button
                onClick={onClose}
                className="w-full py-4 bg-zinc-100 text-zinc-600 rounded-xl font-bold hover:bg-zinc-200 hover:text-black transition-colors active:scale-95 text-base sm:text-lg"
              >
                {cancelText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
