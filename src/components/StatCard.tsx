import { LucideIcon } from 'lucide-react';
import { Card } from './ui/card';

interface StatCardProps {
  icon: LucideIcon;
  value: string;
  label: string;
  color?: 'primary' | 'accent';
}

export function StatCard({ icon: Icon, value, label, color = 'primary' }: StatCardProps) {
  const bgColor = color === 'primary' ? 'bg-primary/10' : 'bg-accent/10';
  const iconColor = color === 'primary' ? 'text-primary' : 'text-accent';

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4">
        <div className={`${bgColor} ${iconColor} p-3 rounded-lg`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <div className="text-foreground" style={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1.2 }}>{value}</div>
          <p className="text-muted-foreground">{label}</p>
        </div>
      </div>
    </Card>
  );
}
