import type { Metadata } from "next";
import { MissionsManager } from "@/components/missions/missions-manager";

export const metadata: Metadata = { title: "Missões e Desafios | SmartBiz AI" };

export default function MissionsPage() {
  return <MissionsManager />;
}
