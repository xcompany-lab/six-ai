import * as React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type CyberVariant = 'cyan' | 'green' | 'gold' | 'rose' | 'magenta' | 'red' | 'yellow';
type CyberSize = 'sm' | 'md' | 'lg';

interface CyberIconProps {
  icon: LucideIcon;
  variant?: CyberVariant;
  size?: CyberSize;
  className?: string;
}

const sizeMap: Record<CyberSize, { outer: string; icon: string; radius: string }> = {
  sm: { outer: 'w-12 h-12', icon: 'w-5 h-5', radius: 'rounded-xl' },
  md: { outer: 'w-16 h-16', icon: 'w-7 h-7', radius: 'rounded-2xl' },
  lg: { outer: 'w-20 h-20', icon: 'w-9 h-9', radius: 'rounded-[22px]' },
};

export function CyberIcon({ icon: Icon, variant = 'cyan', size = 'md', className }: CyberIconProps) {
  const s = sizeMap[size];

  return (
    <div className={cn(`cyber-icon-outer cyber-${variant}`, s.outer, s.radius, className)}>
      <div className={cn('cyber-icon-mid', s.radius)}>
        <div className={cn('cyber-icon-face', s.radius)}>
          <Icon className={cn(s.icon, 'relative z-10')} />
        </div>
      </div>
    </div>
  );
}
