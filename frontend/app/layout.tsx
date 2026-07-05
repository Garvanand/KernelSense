import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KernelSense | Next-Gen Telemetry",
  description: "Deep observability across platforms.",
};

import { Toaster } from "@/components/ui/toast";
import { OnboardingModal } from "@/components/ui/onboarding-modal";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased text-foreground bg-background">
        {children}
        <Toaster />
        <OnboardingModal />
      </body>
    </html>
  );
}
