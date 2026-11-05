import type { Metadata } from "next";
import { DashboardContent } from "@/screens/Dashboard";

export const metadata: Metadata = { title: "Painel | SmartBiz AI" };
export default function PanelPage() {
  return <DashboardContent />;
}
