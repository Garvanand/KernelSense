import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KernelSense — Operating System Intelligence",
  description: "See inside your machine. Real-time process genealogy, memory landscape, and AI-powered anomaly detection.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans">
        <div className="void-gradient noise fixed inset-0 z-0" />
        <div className="relative z-10 h-screen w-screen overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
