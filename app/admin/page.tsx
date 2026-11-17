import type { Metadata } from "next";
import Admin from "@/components/Admin";
import { ORGANIZACAO } from "@/lib/projeto";

export const metadata: Metadata = {
  title: `Cartinhas Recebidas · ${ORGANIZACAO}`,
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <Admin />;
}
