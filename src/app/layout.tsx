import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Lola - Fullstack Developer Portfolio",
  description:
    "Professional portfolio of Lola, a fullstack developer seeking a full-time position.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#0D1B1E] text-[#C3DBC5]`}>
        {children}
      </body>
    </html>
  );
}
