import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: Props) {
  const params = await searchParams;
  if (!params || Object.keys(params).length === 0) {
    redirect("/universities");
  }

  // Build the query string from params
  const queryString = new URLSearchParams(
    Object.entries(params).reduce((acc, [key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => acc.append(key, v));
      } else if (value !== undefined) {
        acc.append(key, value);
      }
      return acc;
    }, new URLSearchParams())
  ).toString();

  const paramStr = queryString ? `?${queryString}` : "";
  const newUrl = `/universities${paramStr}`;
  redirect(newUrl);
}
