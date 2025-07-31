import * as React from "react";
import * as RadixScroll from "@radix-ui/react-scroll-area";

type ScrollAreaProps = React.ComponentPropsWithoutRef<
  typeof RadixScroll.Root
>;

export function ScrollArea({
  className,
  children,
  ...props
}: ScrollAreaProps) {
  return (
    <RadixScroll.Root
      className={`relative overflow-hidden ${className ?? ""}`}
      {...props}
    >
      <RadixScroll.Viewport className="h-full w-full rounded-[inherit]">
        {children}
      </RadixScroll.Viewport>
      {/* Thanh cuộn mặc định dọc */}
      <ScrollBar orientation="vertical" />
      {/* Tùy cần thanh cuộn ngang thì mở dòng dưới */}
      {/* <ScrollBar orientation="horizontal" /> */}
      <RadixScroll.Corner />
    </RadixScroll.Root>
  );
}

type ScrollBarProps = React.ComponentPropsWithoutRef<
  typeof RadixScroll.Scrollbar
>;

export function ScrollBar({
  className,
  orientation = "vertical",
  ...props
}: ScrollBarProps) {
  const base =
    orientation === "vertical"
      ? "h-full w-2.5 border-l"
      : "h-2.5 w-full border-t";

  return (
    <RadixScroll.Scrollbar
      orientation={orientation}
      className={`flex touch-none select-none transition-colors ${base} ${className ?? ""}`}
      {...props}
    >
      <RadixScroll.Thumb className="relative flex-1 rounded-full bg-muted-foreground/50" />
    </RadixScroll.Scrollbar>
  );
}
