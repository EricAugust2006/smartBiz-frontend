import type { Metadata } from "next";
import BrandSettings from "@/screens/BrandSettings";

export const metadata: Metadata = { title: "Configuração de tema | SmartBiz AI" };

export default function ThemeSettingsPage() {
  return <BrandSettings />;
}
