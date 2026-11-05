import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { ToasterProvider } from "@/components/ui/toaster";
import "@/index.css";

export const metadata: Metadata = {
  title: "SmartBiz AI",
  description: "Seu programa de fidelidade SmartBiz AI",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <ToasterProvider>{children}</ToasterProvider>
      </body>
    </html>
  );
}
