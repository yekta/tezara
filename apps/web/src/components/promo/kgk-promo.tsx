import { cn } from "@/components/ui/utils";
import { staticAssetsRoute } from "@/lib/constants";
import Image from "next/image";

export const kgkHref =
  "https://kahvegibikahve.com/?utm_source=tezara.org&utm_medium=referral&utm_campaign=tezara-kgk-1";

const alts = {
  "bag-and-box": "kahvegibikahve - Salla Demle filtre kahve kutusu ve paketi",
  "bag-only": "kahvegibikahve - Salla Demle filtre kahve paketi",
};

type Props = {
  variant: keyof typeof alts;
  sizes: string;
  priority?: boolean;
  className?: string;
};

export default function KgkPromo({
  variant,
  sizes,
  priority,
  className,
}: Props) {
  const src = `${staticAssetsRoute}/promo/kgk-${variant}`;
  return (
    <a
      href={kgkHref}
      target="_blank"
      rel="sponsored noopener"
      aria-label="kahvegibikahve"
      className={cn(
        "group shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:ring-primary/50",
        className
      )}
    >
      <div className="relative size-full transition-transform duration-200 not-touch:group-hover:scale-105 group-active:scale-100">
        <Image
          src={`${src}.webp`}
          alt={alts[variant]}
          width={1920}
          height={1920}
          sizes={sizes}
          priority={priority}
          className="size-full"
        />
        <Image
          src={`${src}-overlay.svg`}
          alt=""
          width={1920}
          height={1920}
          priority={priority}
          className="absolute inset-0 size-full"
        />
      </div>
    </a>
  );
}
