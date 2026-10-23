import { kgkAsset, kgkHref } from "@/components/promo/kgk-promo";
import { LinkButton } from "@/components/ui/button";
import { HandshakeIcon } from "lucide-react";
import Image from "next/image";

export default function KgkSponsorCard() {
  return (
    <li className="w-full flex items-start justify-start sm:w-1/2 lg:w-1/3 p-1">
      <LinkButton
        href={kgkHref}
        target="_blank"
        rel="sponsored noopener"
        prefetch={false}
        variant="outline"
        className="w-full min-h-48 overflow-hidden active:bg-background-hover not-touch:hover:bg-background-hover flex flex-col gap-4 rounded-xl px-4 pt-3.5 pb-4 items-start justify-start"
      >
        <h2 className="w-full shrink min-w-0 text-left text-balance leading-tight font-bold">
          <HandshakeIcon className="inline-block size-[1.125em] -mt-0.5 mr-1.5 -ml-0.25" />
          Sponsor
        </h2>
        <div className="relative w-full flex-1">
          <Image
            src={kgkAsset("bag-and-box", "webp")}
            alt="kahvegibikahve - Salla Demle filtre kahve kutusu ve paketi"
            width={1920}
            height={1920}
            sizes="14rem"
            className="absolute left-1/2 top-[48%] h-[180%] w-auto max-w-none -translate-x-[50.75%] -translate-y-[54.25%]"
          />
        </div>
      </LinkButton>
    </li>
  );
}
