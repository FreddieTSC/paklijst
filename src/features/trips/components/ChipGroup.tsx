import { iconFor } from '@/lib/tagIcons';

interface Option { id: string; label: string; }

interface Props {
  eyebrow: string;
  title: string;
  options: Option[];
  selected: string[];                // option ids
  onToggle: (id: string) => void;
}

export function ChipGroup({ eyebrow, title, options, selected, onToggle }: Props) {
  return (
    <fieldset className="border-t border-rule pt-5">
      <legend className="flex items-baseline justify-between w-full mb-3">
        <span><span className="eyebrow mr-3">{eyebrow}</span>
              <span className="text-[15px] font-medium tracking-tight">{title}</span></span>
        <span className="text-eyebrow text-muted">{selected.length}/{options.length}</span>
      </legend>
      <div className="flex flex-wrap gap-1.5">
        {options.length === 0
          ? <span className="text-sm text-muted italic">geen opties</span>
          : options.map(opt => {
            const on = selected.includes(opt.id);
            const icon = iconFor(opt.label);
            return (
              <button key={opt.id} type="button" onClick={() => onToggle(opt.id)}
                      className={`chip ${on ? 'chip-on' : ''}`}>
                {icon && <span className="mr-1.5 text-base leading-none">{icon}</span>}
                {opt.label}
              </button>
            );
          })}
      </div>
    </fieldset>
  );
}
