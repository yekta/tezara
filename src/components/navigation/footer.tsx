import ThemeButton from "@/components/theme-button";
import { cn } from "@/components/ui/utils";
import { siteTitle } from "@/lib/constants";
import Link from "next/link";
import { ReactNode } from "react";

export default async function Footer({ className }: { className?: string }) {
  return (
    <footer
      className={cn(
        "w-full flex items-center justify-center text-center absolute left-0 bottom-0",
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
          <p className="w-full md:w-auto px-1 shrink min-w-0 text-sm text-left leading-tight">
            © {new Date().getFullYear()} {siteTitle}
          </p>
          <span className="px-0.5 md:px-0.75 hidden md:block text-muted-more-foreground">
            {" • "}
          </span>
          <div className="w-full mt-0.5 md:mt-0 md:w-auto shrink min-w-0 flex flex-row flex-wrap items-center justify-start">
            <FooterLink href="https://github.com/yekta/tezara">
              GitHub
            </FooterLink>
            {/* <span className="px-0.5 md:px-0.75 text-muted-more-foreground">
              •
            </span> */}
          </div>
        </div>
        <div className="flex items-center justify-end gap-1.75">
          <ThemeButton />
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ children, href }: { children: ReactNode; href: string }) {
  return (
    <Link
      prefetch={false}
      href={href}
      target="_blank"
      className="px-1 max-w-full flex items-center text-left min-w-0 not-touch:hover:text-foreground not-touch:hover:underline active:underline active:text-foreground rounded relative
      focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:ring-primary/50
      before:w-full before:h-full before:-translate-y-1/2 before:top-1/2 before:-translate-x-1/2 before:left-1/2 before:min-w-[48px] before:min-h-[48px] before:z-[-1] z-0 before:bg-transparent before:absolute"
    >
      <p className="max-w-full">{children}</p>
    </Link>
  );
}
