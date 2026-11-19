import type { Metadata } from "next";
import Copilot from "@/screens/Copilot";

export const metadata: Metadata = { title: "Copiloto | SmartBiz AI" };

export default function CopilotPage() {
  return <Copilot />;
}
