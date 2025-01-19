import Footer from "@/components/navigation/footer";
import Navbar from "@/components/navigation/navbar";
import Providers from "@/components/providers/providers";
import { Toaster } from "@/components/ui/sonner";
import {
  getPreviewUrl,
  siteDescription,
  siteTagline,
  siteTitle,
} from "@/lib/constants";
import { env } from "@/lib/env";
import {
  AlertCircleIcon,
  CheckCircleIcon,
  InfoIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";

const sans = localFont({
  src: "./fonts/DMSansVF.woff2",
  variable: "--font-sans",
  weight: "100 1000",
});
const mono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-mono",
  weight: "100 900",
});

const title = `${siteTitle} | ${siteTagline}`;

export const viewport: Viewport = {
  themeColor: "#ffffff",
};
export const metadata: Metadata = {
  title,
  description: siteDescription,
  metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL),
  openGraph: {
    images: [
      {
        url: getPreviewUrl("home"),
        width: 1200,
        height: 630,
        alt: siteTitle,
      },
    ],
  },
  twitter: {
    title,
    description: siteDescription,
    card: "summary_large_image",
    images: [
      {
        url: getPreviewUrl("home"),
        width: 1200,
        height: 630,
        alt: siteTitle,
      },
    ],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${sans.variable} ${mono.variable} bg-background text-foreground antialiased break-words`}
      >
        <Providers>
          <NextTopLoader
            zIndex={9999}
            showSpinner={false}
            color="hsl(var(--primary))"
            shadow={false}
            height={2}
          />
          <div className="w-full flex flex-col min-h-[100svh] relative">
            <Navbar />
            <div className="pointer-events-none h-14 w-full" />
            <div className="w-full flex flex-col flex-1">{children}</div>
            <Footer />
          </div>
          <Toaster
            position="top-right"
            icons={{
              error: <TriangleAlertIcon className="size-full" />,
              close: <XIcon strokeWidth={2.5} className="size-full" />,
              success: <CheckCircleIcon className="size-full" />,
              warning: <AlertCircleIcon className="size-full" />,
              info: <InfoIcon className="size-full" />,
            }}
            closeButton={true}
            duration={60000}
          />
        </Providers>
      </body>
    </html>
  );
}
