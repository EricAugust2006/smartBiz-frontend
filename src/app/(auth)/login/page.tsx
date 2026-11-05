import type { Metadata } from "next";
import { B2BAuthForm } from "@/components/auth/b2b-auth-form";

export const metadata: Metadata = { title: "Login | SmartBiz AI" };
export default function LoginPage() {
  return <B2BAuthForm mode="login" />;
}
