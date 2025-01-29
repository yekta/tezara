import { thesesRoute } from "@/app/theses/_components/constants";
import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ slug?: string[] }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ params, searchParams }: Props) {
  const [paramsRes, searchParamsRes] = await Promise.all([
    params,
    searchParams,
  ]);
  // Preserve the path after `/thesis` if it exists
  const subPath = paramsRes?.slug ? `/${paramsRes.slug.join("/")}` : "";

  // Build the query string from searchParams
  const queryString = new URLSearchParams(
    Object.entries(searchParamsRes).reduce((acc, [key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => acc.append(key, v));
      } else if (value !== undefined) {
        acc.append(key, value);
      }
      return acc;
    }, new URLSearchParams())
  ).toString();

  const paramStr = queryString ? `?${queryString}` : "";

  // Construct the new URL
  const newUrl = `${thesesRoute}${subPath}${paramStr}`;

  redirect(newUrl);
}
