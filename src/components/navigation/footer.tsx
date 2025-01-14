import ThemeButton from "@/components/theme-button";
import { cn } from "@/components/ui/utils";
import { siteTitle } from "@/lib/constants";

export default async function Footer({ className }: { className?: string }) {
  return (
    <footer
      className={cn(
        "w-full flex items-center justify-center text-center",
        className
      )}
    >
      <div
        className="w-full flex items-center justify-between overflow-hidden p-3 md:p-2
          pb-[calc(env(safe-area-inset-bottom)+0.75rem)] md:pb-[calc(env(safe-area-inset-bottom)+0.5rem)] 
          gap-6 ring-1 ring-border"
      >
        <div className="items-center justify-end gap-1.75 hidden md:flex">
          <div className="size-8.5 shrink-0" />
          <div className="size-8.5 shrink-0" />
          <div className="size-8.5 shrink-0" />
        </div>
        <div
          className="flex-1 min-w-0 font-medium justify-center items-start flex flex-col md:flex-row md:items-center md:justify-center 
            text-sm text-muted-foreground"
        >
          <p className="w-full md:w-auto px-1 shrink min-w-0 text-sm text-left">
            © {new Date().getFullYear()} {siteTitle}
          </p>
        </div>
        <div className="flex items-center justify-end gap-1.75">
          <ThemeButton />
        </div>
      </div>
    </footer>
  );
}
