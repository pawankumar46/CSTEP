import { redirect } from "next/navigation";
import { ROUTES } from "@/lib/routes";

export default function RegisterRedirectPage() {
  redirect(ROUTES.signup);
}
