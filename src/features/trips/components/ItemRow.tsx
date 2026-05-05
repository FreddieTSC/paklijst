import { useState, useRef, useEffect } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface Props {
  name: string;
  checked: boolean;
  addedManually: boolean;
  badge?: string | null;          // e.g. "AANDOEN"
  onToggle: () => void;
  onRemove: () => void;
}

export function ItemRow({ name, checked, addedManually, badge, onToggle, onRemove }: Props) {
  const [confirming, setConfirming] = useState(false);
  const tRef = useRef<number | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => () => { if (tRef.current) window.clearTimeout(tRef.current); }, []);

  function handleRemove() {
    if (addedManually) { onRemove(); return; }
    if (confirming) { onRemove(); return; }
    setConfirming(true);
    if (tRef.current) window.clearTimeout(tRef.current);
    tRef.current = window.setTimeout(() => setConfirming(false), 2500);
  }

  return (
    <motion.div
      layout={!reduce}
      transition={{ type: 'spring', damping: 26, stiffness: 320 }}
      className={`flex items-center gap-3 px-4 py-3 border-b border-rule transition-colors
                  ${checked ? 'bg-paperX/40' : 'bg-white'}`}
    >
      <div className="flex-1 min-w-0">
        <div className={`text-[15px] tracking-tight transition-colors duration-300
                         ${checked ? 'line-through text-muted' : 'text-ink'}`}>
          {name}
        </div>
        {badge && <div className="mt-0.5 text-[10px] uppercase tracking-wider text-flag">{badge}</div>}
      </div>

      {/* Green check */}
      <motion.button
        aria-label={checked ? 'Uitvinken' : 'Afvinken'}
        onClick={onToggle}
        whileTap={reduce ? undefined : { scale: 0.92 }}
        transition={{ type: 'spring', damping: 18, stiffness: 600 }}
        className={`w-9 h-9 rounded-md border-2 flex items-center justify-center
                    text-[18px] font-semibold leading-none transition-colors
                    ${checked
                      ? 'bg-accent border-accent text-paper'
                      : 'border-accent text-transparent hover:bg-accent/5'}`}
      >✓</motion.button>

      {/* Red cross */}
      <motion.button
        aria-label={confirming ? 'Bevestig verwijderen' : 'Verwijderen uit lijst'}
        onClick={handleRemove}
        whileTap={reduce ? undefined : { scale: 0.92 }}
        transition={{ type: 'spring', damping: 18, stiffness: 600 }}
        className={`w-9 h-9 rounded-md border-2 flex items-center justify-center
                    text-[20px] font-semibold leading-none transition-colors
                    ${confirming
                      ? 'bg-accent2 border-accent2 text-paper'
                      : 'border-accent2 text-accent2 hover:bg-accent2/5'}`}
      >×</motion.button>
    </motion.div>
  );
}
