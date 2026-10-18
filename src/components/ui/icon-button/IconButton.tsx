import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Button, type ButtonProps } from "../button";

export type IconButtonProps = Omit<ButtonProps, "children" | "asChild"> & {
  /** Required: icon-only buttons need an accessible name. */
  label: string;
  icon: ReactNode;
};

export function IconButton({
  label,
  icon,
  className,
  variant = "ghost",
  size = "md",
  ...props
}: IconButtonProps) {
  const square = size === "sm" ? "size-8" : size === "lg" ? "size-11" : "size-10";
  return (
    <Button
      aria-label={label}
      variant={variant}
      size={size}
      className={cn(square, "px-0", className)}
      {...props}
    >
      <span aria-hidden className="contents">
        {icon}
      </span>
    </Button>
  );
}
