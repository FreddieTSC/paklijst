import { motion, useReducedMotion } from 'motion/react';

interface Props {
  name: string;
  qty?: number;
  checked: boolean;
  addedManually: boolean;
  personName?: string | null;
  badge?: string | null;
  onToggle: () => void;
  onRemove: () => void;
}

export function ItemRow({ name, qty, checked, personName, badge, onToggle, onRemove }: Props) {
  const reduce = useReducedMotion();

  function handleRemove() {
    const msg = personName
      ? `Dag ${personName}, weet je zeker dat je geen "${name}" wilt meenemen deze vakantie?`
      : `Wil je "${name}" zeker niet meenemen op deze vakantie?`;
    if (window.confirm(msg)) onRemove();
  }

  return (
    <motion.div
      layout={!reduce}
      transition={{ type: 'spring', damping: 26, stiffness: 320 }}
      className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 border-b border-rule transition-colors
                  ${checked ? 'bg-paperX/40' : 'bg-white'}`}
    >
      <div className="flex-1 min-w-0">
        <div className={`text-sm md:text-[15px] tracking-tight transition-colors duration-300
                         ${checked ? 'line-through text-muted' : 'text-ink'}`}>
          {name}
          {qty && qty > 1 && (
            <span className={`num ml-1.5 text-xs md:text-sm ${checked ? 'text-muted' : 'text-muted'}`}>× {qty}</span>
          )}
        </div>
        {badge && <div className="text-[9px] md:text-[10px] uppercase tracking-wider text-flag">{badge}</div>}
      </div>

      <motion.button
        aria-label={checked ? 'Uitvinken' : 'Afvinken'}
        onClick={onToggle}
        whileTap={reduce ? undefined : { scale: 0.92 }}
        transition={{ type: 'spring', damping: 18, stiffness: 600 }}
        className={`w-7 h-7 md:w-9 md:h-9 rounded md:rounded-md border-2 flex items-center justify-center
                    text-[14px] md:text-[18px] font-semibold leading-none transition-colors
                    ${checked
                      ? 'bg-accent border-accent text-paper'
                      : 'border-accent text-transparent hover:bg-accent/5'}`}
      >✓</motion.button>

      <motion.button
        aria-label="Verwijderen uit lijst"
        onClick={handleRemove}
        whileTap={reduce ? undefined : { scale: 0.92 }}
        transition={{ type: 'spring', damping: 18, stiffness: 600 }}
        className={`w-7 h-7 md:w-9 md:h-9 rounded md:rounded-md border-2 flex items-center justify-center
                    text-[16px] md:text-[20px] font-semibold leading-none transition-colors
                    border-accent2 text-accent2 hover:bg-accent2/5`}
      >×</motion.button>
    </motion.div>
  );
}
