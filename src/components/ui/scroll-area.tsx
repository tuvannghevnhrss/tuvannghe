'use client';
import * as React from 'react';
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import clsx from 'classnames';

export function ScrollArea({ className, children }: React.ComponentPropsWithoutRef<'div'>) {
  return (
    <ScrollAreaPrimitive.Root className={clsx('overflow-hidden', className)}>
      <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollAreaPrimitive.Scrollbar
        orientation="vertical"
        className="flex touch-none select-none p-0.5"
      >
        <ScrollAreaPrimitive.Thumb className="flex-1 bg-muted rounded-full" />
      </ScrollAreaPrimitive.Scrollbar>
    </ScrollAreaPrimitive.Root>
  );
}