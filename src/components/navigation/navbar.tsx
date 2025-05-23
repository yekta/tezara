import ScIcon from "@/components/icons/sc-icon";
import Logo from "@/components/logo/logo";
import NavbarTabs from "@/components/navigation/navbar-tabs";
import NavbarWrapper from "@/components/navigation/navbar-wrapper";
import { LinkButton } from "@/components/ui/button";
import { NavigationMenuItem } from "@/components/ui/navigation-menu";
import { sc } from "@/lib/constants";

export default async function Navbar({}: { className?: string }) {
  return (
    <NavbarWrapper>
      <div className="flex shrink min-w-0 items-center">
        <div className="flex shrink-0 flex-wrap items-center justify-start gap-1.5">
          <NavigationMenuItem asChild>
            <LinkButton
              aria-label="Home"
              href="/"
              size="icon"
              variant="ghost"
              className="size-8.5 rounded-lg"
            >
              <Logo />
            </LinkButton>
          </NavigationMenuItem>
        </div>
        <div className="shrink min-w-0 items-center justify-center px-1.5 hidden sm:flex">
          <NavbarTabs />
        </div>
      </div>
      <div className="flex shrink min-w-0 items-center justify-end gap-1.5">
        {/* <NavigationMenuItem asChild>
          <LinkButton
            aria-label={sc.buymeacoffee.name}
            href={sc.buymeacoffee.href}
            size="sm"
            target="_blank"
            className="bg-yellow-300 px-3.5 shrink min-w-0 not-touch:hover:bg-yellow-400 active:bg-yellow-400  py-1.5 text-foreground dark:text-background gap-2"
          >
            <ScIcon
              slug={sc.buymeacoffee.slug}
              className="size-7 p-0.75 -my-3 -ml-3 rounded-full bg-yellow-100 text-foreground dark:text-background shrink-0"
            />
            <p className="shrink min-w-0 whitespace-nowrap overflow-hidden overflow-ellipsis">
              Bağış
            </p>
          </LinkButton>
        </NavigationMenuItem> */}
        <NavigationMenuItem asChild>
          <LinkButton
            aria-label={sc.x.name}
            href={sc.x.href}
            size="icon"
            variant="ghost"
            className="size-8.5 rounded-lg"
            target="_blank"
          >
            <ScIcon slug={sc.x.slug} className="size-6 shrink-0" />
          </LinkButton>
        </NavigationMenuItem>
        <NavigationMenuItem asChild>
          <LinkButton
            aria-label={sc.github.name}
            href={sc.github.href}
            size="icon"
            variant="ghost"
            className="size-8.5 rounded-lg"
            target="_blank"
          >
            <ScIcon slug={sc.github.slug} className="size-6 shrink-0" />
          </LinkButton>
        </NavigationMenuItem>
      </div>
    </NavbarWrapper>
  );
}
