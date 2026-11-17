import type { Metadata, Viewport } from "next";
import { Fredoka, Gochi_Hand } from "next/font/google";
import "./globals.css";

const fredoka = Fredoka({ subsets: ["latin"], variable: "--font-fredoka", display: "swap" });
const gochi = Gochi_Hand({ subsets: ["latin"], weight: "400", variable: "--font-gochi", display: "swap" });

export const metadata: Metadata = {
  title: "Minha Cartinha",
  description: "Escreva sua cartinha: seu nome, sua idade, seus tamanhos e 3 pedidos!",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>💌</text></svg>",
  },
};

export const viewport: Viewport = {
  themeColor: "#9ee0ff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${fredoka.variable} ${gochi.variable}`}>
      <body>{children}</body>
    </html>
  );
}
