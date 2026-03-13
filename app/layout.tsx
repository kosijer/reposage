import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RepoSage",
  description: "AI-powered repository insights and graph visualization",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
