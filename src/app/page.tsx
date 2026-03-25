import { redirect } from "next/navigation";

// Root redirects to dashboard; middleware handles unauthed → /login
export default function RootPage() {
  redirect("/dashboard");
}
