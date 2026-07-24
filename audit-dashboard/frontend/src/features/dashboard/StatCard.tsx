import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/utils/cn';
import { formatNumber } from '@/utils/formatters';

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  accentClassName?: string;
  suffix?: string;
}

/** Animates the displayed number counting up to its target on mount/update. */
function useCountUp(target: number, durationMs = 600): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const from = value;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(from + (target - from) * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return value;
}

export function StatCard({ label, value, icon: Icon, accentClassName, suffix }: StatCardProps) {
  const animated = useCountUp(value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-panel p-5"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{label}</p>
          <p className="mt-2 font-display text-3xl font-semibold text-text-primary tabular-nums">
            {formatNumber(animated)}
            {suffix && <span className="ml-1 text-base text-text-muted">{suffix}</span>}
          </p>
        </div>
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', accentClassName ?? 'bg-signal/10 text-signal')}>
          <Icon size={18} />
        </div>
      </div>
    </motion.div>
  );
}
