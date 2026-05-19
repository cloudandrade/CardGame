import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VSF — Very Snap Fight",
  description: "TCG web simples: 3 cartas vs 3 cartas",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fira+Sans:wght@400;600&family=Jomhuria&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
