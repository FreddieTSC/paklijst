import { useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Props { title: string; onClose: () => void; children: ReactNode; }

export function Modal({ title, onClose, children }: Props) {
  useEffect(() => {
    function onEsc(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onEsc);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end md:items-center justify-center px-3 md:px-6"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        <motion.div
          className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
          onClick={onClose}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        />
        <motion.div
          role="dialog" aria-modal="true" aria-label={title}
          className="relative w-full max-w-xl bg-paper rounded-lg border border-rule shadow-card my-6"
          initial={{ y: 24, scale: 0.98, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          exit={{ y: 24, scale: 0.98, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
        >
          <header className="flex items-center justify-between px-5 py-4 border-b border-rule">
            <h2 className="text-h2 font-semibold tracking-tight">{title}</h2>
            <button onClick={onClose} aria-label="Sluiten"
                    className="w-8 h-8 rounded-md hover:bg-paperX flex items-center justify-center text-lg leading-none text-muted">
              ×
            </button>
          </header>
          <div className="p-5">{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
