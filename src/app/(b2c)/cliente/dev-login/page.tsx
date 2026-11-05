import type { Metadata } from "next";
import { B2CDevLogin } from "@/components/customer/b2c-dev-login";

export const metadata: Metadata = { title: "Dev Login B2C | SmartBiz AI" };

export default function B2CDevLoginPage() {
  return <B2CDevLogin />;
}
