import { cn } from '../lib/cn';
import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-card border border-border rounded-xl p-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
