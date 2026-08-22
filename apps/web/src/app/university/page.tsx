import { universitiesRoute } from "@/app/universities/_components/constants";
import { redirect } from "next/navigation";

export default function Page() {
  redirect(universitiesRoute);
}
