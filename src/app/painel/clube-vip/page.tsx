import type { Metadata } from "next";
import { ClubPanel } from "@/screens/Club";

export const metadata: Metadata = { title: "Clube VIP | SmartBiz AI" };

export default function ClubVipPage() {
  return <ClubPanel />;
}
