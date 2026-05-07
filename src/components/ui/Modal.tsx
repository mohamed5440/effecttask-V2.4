import React from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../lib/utils";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 text-start"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={cn(
              "bg-white rounded-xl w-full max-w-4xl border border-zinc-100 flex flex-col max-h-[90vh] overflow-hidden relative",
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button Integrated - Top Corner */}
            <button
              onClick={onClose}
              className="absolute top-6 start-6 p-2 bg-zinc-50 rounded-xl text-zinc-400 hover:text-black hover:bg-zinc-100 transition-all z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="px-6 sm:px-12 py-10 overflow-y-auto custom-scrollbar">
              <div className="mb-8 text-center sm:text-start">
                <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight mb-2">
                  {title}
                </h2>
                <p className="text-sm font-medium text-zinc-400 leading-relaxed max-w-lg">
                  {description}
                </p>
              </div>

              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
