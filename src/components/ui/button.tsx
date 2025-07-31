'use client';
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import clsx from 'clsx';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: 'default' | 'ghost';
  size?: 'sm' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ asChild, variant = 'default', size, className, ...props }, ref) => {
    const Comp: any = asChild ? Slot : 'button';

    return (
      <Comp
        ref={ref}
        className={clsx(
          'inline-flex items-center justify-center rounded-md text-sm font-medium',
          variant === 'default' && 'bg-primary text-primary-foreground hover:opacity-90',
          variant === 'ghost' && 'hover:bg-accent hover:text-foreground',
          size === 'icon' && 'h-8 w-8 p-0',
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';
export default Button;
