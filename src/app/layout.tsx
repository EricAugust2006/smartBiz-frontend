import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { themeInitializationScript } from "@/components/theme/theme-initialization-script";
import { ThemeProvider } from "@/components/theme/theme-provider";
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
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitializationScript }} />
      </head>
      <body>
        <ThemeProvider>
          <ToasterProvider>{children}</ToasterProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
