import Logo from "@/components/logo/logo";
import NavbarWrapper from "@/components/navigation/navbar-wrapper";
import { LinkButton } from "@/components/ui/button";
import { NavigationMenuItem } from "@/components/ui/navigation-menu";

export default async function Navbar({}: { className?: string }) {
  return (
    <NavbarWrapper>
      <div className="flex flex-1 min-w-0 items-center justify-start gap-1.25 md:gap-1.5">
        <NavigationMenuItem asChild>
          <LinkButton
            className="border-none p-1.75"
            variant="outline"
            aria-label="Home"
            href="/"
          >
            <Logo />
          </LinkButton>
        </NavigationMenuItem>
      </div>
    </NavbarWrapper>
  );
}
