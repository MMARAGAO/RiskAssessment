import { redirect } from "next/navigation";

export default function Page() {
  redirect("/sistema/dashboard");
  return null;
}
