import type { Metadata } from "next";
import { B2BAuthForm } from "@/components/auth/b2b-auth-form";

export const metadata: Metadata = { title: "Cadastro | SmartBiz AI" };
export default function RegisterPage() {
  return <B2BAuthForm mode="register" />;
}
