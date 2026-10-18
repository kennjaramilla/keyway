import { Avatar as AvatarPrimitive } from "radix-ui";
import { cn } from "@/lib/cn";

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : "";
  return (first + last).toUpperCase() || "?";
}

export type AvatarProps = {
  name: string;
  src?: string;
  size?: "sm" | "md";
  className?: string;
  /** Set when the name is already shown next to the avatar. */
  decorative?: boolean;
};

export function Avatar({ name, src, size = "md", className, decorative }: AvatarProps) {
  return (
    <AvatarPrimitive.Root
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : name}
      aria-hidden={decorative || undefined}
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-soft font-semibold text-primary",
        size === "sm" ? "size-7 text-xs" : "size-9 text-sm",
        className,
      )}
    >
      {src && <AvatarPrimitive.Image src={src} alt="" className="size-full object-cover" />}
      <AvatarPrimitive.Fallback>{initials(name)}</AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
