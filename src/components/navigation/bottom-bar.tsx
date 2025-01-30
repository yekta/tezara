import NavbarTabs from "@/components/navigation/navbar-tabs";
import TopLoader from "@/components/navigation/top-loader";
import { cn } from "@/components/ui/utils";

type Props = {
  className?: string;
};

export default function BottomBar({ className }: Props) {
  return (
    <nav
      className={cn(
        "w-full flex shadow-navbar shadow-shadow/[var(--opacity-shadow)] border-t fixed bottom-0 z-50 bg-background",
        className
      )}
    >
      <div className="w-full h-full flex p-0.75">
        <NavbarTabs className="w-full" classNameTab="flex-1 rounded-lg" />
      </div>
      <TopLoader />
    </nav>
  );
}
