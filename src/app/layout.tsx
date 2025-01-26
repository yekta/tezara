import Footer from "@/components/navigation/footer";
import Navbar from "@/components/navigation/navbar";
import Providers from "@/components/providers/providers";
import { Toaster } from "@/components/ui/sonner";
import { siteDescription, siteTagline, siteTitle } from "@/lib/constants";
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
import Script from "next/script";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";
import BottomBar from "@/components/navigation/bottom-bar";

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
  twitter: {
    title,
    description: siteDescription,
    card: "summary_large_image",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          data-website-id={env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
          data-domains={env.NEXT_PUBLIC_UMAMI_DOMAINS}
          src={`${env.NEXT_PUBLIC_UMAMI_HOST_URL}/script.js`}
        />
      </head>
      <body
        className={`${sans.variable} ${mono.variable} w-full flex flex-col min-h-[100svh] relative items-center bg-background text-foreground antialiased break-words`}
      >
        <Providers>
          <NextTopLoader
            zIndex={9999}
            showSpinner={false}
            color="hsl(var(--primary))"
            shadow={false}
            height={2}
          />
          <Navbar />
          <div className="pointer-events-none h-13 sm:h-16 w-full" />
          {children}
          <Footer
            classNameInner="sm:pb-[calc(env(safe-area-inset-bottom)+0.75rem)] md:pb-[calc(env(safe-area-inset-bottom)+0.5rem)] "
            className="bottom-[calc(env(safe-area-inset-bottom)+3rem)] sm:bottom-0"
          />
          <BottomBar className="h-[calc(env(safe-area-inset-bottom)+3rem)] pb-[env(safe-area-inset-bottom)] sm:hidden" />
          <div className="h-[calc(env(safe-area-inset-bottom)+3rem)] sm:hidden" />
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
