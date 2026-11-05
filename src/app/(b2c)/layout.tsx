import type { Metadata } from "next";
import type { ReactNode } from "react";
import { B2CProviders } from "@/components/providers/b2c-providers";

export const metadata: Metadata = {
  title: "Seu Clube | SmartBiz AI",
  description:
    "Acompanhe seus pontos, complete missões e descubra suas recompensas.",
};

export default function B2CLayout({ children }: { children: ReactNode }) {
  return <B2CProviders>{children}</B2CProviders>;
}
