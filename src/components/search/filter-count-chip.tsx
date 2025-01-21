import { cn } from "@/components/ui/utils";

type Props = {
  className?: string;
  children: string;
};
export default function FilterCountChip({ children, className }: Props) {
  return (
    <p
      className={cn(
        "shrink-0 bg-warning/16 text-warning font-mono text-xs px-1 py-px font-extrabold rounded-sm",
        className
      )}
    >
      {children}
    </p>
  );
}
