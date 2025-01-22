import ScIcon from "@/components/icons/sc-icon";
import Logo from "@/components/logo/logo";
import NavbarWrapper from "@/components/navigation/navbar-wrapper";
import { LinkButton } from "@/components/ui/button";
import { NavigationMenuItem } from "@/components/ui/navigation-menu";
import { sc } from "@/lib/constants";

export default async function Navbar({}: { className?: string }) {
  return (
    <NavbarWrapper>
      <div className="flex flex-wrap min-w-0 items-center justify-start gap-1.25 md:gap-1.5">
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
      <div className="flex flex-wrap min-w-0 items-center justify-end gap-1">
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
      </div>
    </NavbarWrapper>
  );
}
