import type { Metadata } from "next";
import { B2CStoreLogin } from "@/components/customer/b2c-store-login";

export const metadata: Metadata = {
  title: "Acesse seu clube | SmartBiz AI",
  description: "Entre no clube de vantagens da sua loja.",
};

export default async function StoreLoginPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <B2CStoreLogin tenantSlug={slug} />;
}
