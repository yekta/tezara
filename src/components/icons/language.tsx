import { cn } from "@/components/ui/utils";
import { GlobeIcon } from "lucide-react";
import Image from "next/image";
import { ComponentProps } from "react";

const defaultClassName = "size-5 shrink-0";

type TVariant = string | null;

const supported: TVariant[] = [
  "Almanca",
  "Arapça",
  "Arnavutça",
  "Azerice",
  "Boşnakça",
  "Bulgarca",
  "Çekçe",
  "Çerkezce",
  "Çince",
  "Ermenice",
  "Farsça",
  "Felemenkçe",
  "Fransızca",
  "Gürcüce",
  "İngilizce",
  "İspanyolca",
  "İtalyanca",
  "Japonca",
  "Kazakça",
  "Kırgızca",
  "Korece",
  "Kürtçe",
  "Lehçe",
  "Macarca",
  "Makedonca",
  "Malayca",
  "Moğolca",
  "Özbekçe",
  "Portekizce",
  "Romence",
  "Rusça",
  "Slovence",
  "Türkçe",
  "Ukraynaca",
  "Yunanca",
];

export default function LanguageIcon({
  className,
  variant,
}: ComponentProps<"svg"> & { variant: TVariant }) {
  if (supported.includes(variant))
    return (
      <Image
        width={512}
        height={512}
        className={cn(defaultClassName, className)}
        alt={variant || "Dil İkonu"}
        src={`/flags/${variant}.svg`}
      />
    );
  return <GlobeIcon className={cn(defaultClassName, className)} />;
}
