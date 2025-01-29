import { thesesRoute } from "@/app/theses/_components/constants";
import { redirect } from "next/navigation";

export default function Page() {
  redirect(thesesRoute);
}
