import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Counsel of Grandmas",
  description:
    "Get advice from 5 wise grandmas with very different perspectives. They're always online, and they're always judging.",
  openGraph: {
    title: "Counsel of Grandmas",
    description: "5 AI grandmas ready to give you advice about life, love, and everything in between.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.className}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
