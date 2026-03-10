import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  glowColor?: 'blue' | 'cyan' | 'green';
}

export function StatCard({ label, value, change, icon: Icon, trend, glowColor = 'blue' }: StatCardProps) {
  const glowClass = glowColor === 'blue' ? 'glow-blue' : glowColor === 'cyan' ? 'glow-cyan' : 'glow-green';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass rounded-xl p-5 hover:border-primary/30 transition-all duration-300 hover:${glowClass}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Icon size={20} className="text-primary" />
        </div>
        {change && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            trend === 'up' ? 'bg-accent/10 text-accent' : trend === 'down' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'
          }`}>
            {change}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </motion.div>
  );
}
