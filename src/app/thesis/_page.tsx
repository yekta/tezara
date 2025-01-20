import { siteTitle } from "@/lib/constants";
import { getTwitterMeta } from "@/lib/helpers";
import { Metadata } from "next";

export default async function Page() {
  return <div>Tezler</div>;
}

const title = `Tezler | ${siteTitle}`;
const description = "Tezler";

export const metadata: Metadata = {
  title,
  description,
  twitter: getTwitterMeta({
    title,
    description,
  }),
};
