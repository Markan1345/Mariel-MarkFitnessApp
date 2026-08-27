import type { Metadata, Viewport } from "next";
import { Fraunces, Outfit } from "next/font/google";
import { SyncBootstrap } from "@/components/SyncBootstrap";
import { SITE_BASE_PATH } from "@/lib/site";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
});

export const metadata: Metadata = {
  title: "Lifting Together",
  description: "A shared workout tracker for the two of you. Log lifts, cardio, calories, and body weight on your phone.",
  applicationName: "Lifting Together",
  manifest: `${SITE_BASE_PATH}/manifest.webmanifest`,
  appleWebApp: {
    capable: true,
    title: "Lifting Together",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [{ url: `${SITE_BASE_PATH}/icon.svg`, type: "image/svg+xml" }],
    apple: [{ url: `${SITE_BASE_PATH}/apple-touch-icon.png` }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#fff2d9",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${fraunces.variable} antialiased`}>
        <div className="phone-shell">
          <SyncBootstrap />
          {children}
        </div>
      </body>
    </html>
  );
}
