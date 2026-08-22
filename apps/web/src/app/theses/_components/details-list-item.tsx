import { cn } from "@/components/ui/utils";

type Props = {
  title: string;
  id: string;
  className?: string;
  children: React.ReactNode;
};

export default function DetailsListItem({
  title,
  id,
  className,
  children,
}: Props) {
  return (
    <li
      id={id}
      className={cn(
        "leading-normal py-2 border-t border-foreground/10",
        className
      )}
    >
      <span className="font-medium text-muted-foreground">{title}: </span>
      <span className="font-bold">{children}</span>
    </li>
  );
}
