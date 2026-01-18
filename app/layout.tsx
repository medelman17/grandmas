import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover", // For notched devices
};

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = "https://bubbeh.vercel.app";

export const metadata: Metadata = {
  title: "Counsel of Grandmas",
  description:
    "Get advice from 5 wise AI grandmas with very different perspectives. They're always online, and they're always judging.",
  metadataBase: new URL(siteUrl),
  keywords: ["AI", "grandmas", "advice", "chat", "AI chat", "life advice", "multi-agent"],
  authors: [{ name: "Counsel of Grandmas" }],
  openGraph: {
    title: "Counsel of Grandmas",
    description: "5 AI grandmas with very different perspectives, ready to give you advice about life, love, and that thing you're definitely overthinking.",
    url: siteUrl,
    siteName: "Counsel of Grandmas",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Counsel of Grandmas",
    description: "5 AI grandmas ready to judge—er, advise you. Always online. Always judging.",
    creator: "@bubbeh",
  },
  robots: {
    index: true,
    follow: true,
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
