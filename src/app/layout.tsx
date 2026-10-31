import type { Metadata } from "next";
import "./globals.css";
import VisualEditsMessenger from "../visual-edits/VisualEditsMessenger";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";

const APP_TITLE = "SREE SAI DURGA – Shop Billing & Rental Management System";
const APP_DESCRIPTION = "Comprehensive billing, sales, rental equipment tracking, booking calendar, inventory, and customer analytics for SREE SAI DURGA shop.";

export const metadata: Metadata = {
  title: APP_TITLE,
  description: APP_DESCRIPTION,
  keywords: [
    "SREE SAI DURGA",
    "Shop Billing System",
    "Rental Billing",
    "Sales Invoicing",
    "Inventory Management",
    "Booking Calendar",
    "Customer Ledger",
    "Thiruvennai Nallur",
    "Villupuram"
  ],
  authors: [{ name: "SREE SAI DURGA" }],
  creator: "SREE SAI DURGA",
  publisher: "SREE SAI DURGA",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    title: APP_TITLE,
    description: APP_DESCRIPTION,
    siteName: "SREE SAI DURGA Billing",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: APP_TITLE,
    description: APP_DESCRIPTION,
  },
  icons: {
    icon: "/favicon.ico",
  },
};

const jsonLdData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "SREE SAI DURGA",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "All",
  "description": APP_DESCRIPTION,
  "creator": {
    "@type": "Organization",
    "name": "SREE SAI DURGA",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "MAIN ROAD",
      "addressLocality": "THIRUVENNAI NALLUR",
      "addressRegion": "VILLUPURAM Dt",
      "postalCode": "607203",
      "addressCountry": "IN"
    },
    "telephone": ["+91-9790548669", "+91-9442378669"]
  },
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "INR"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdData) }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <ErrorReporter />
          <Script
            src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts//route-messenger.js"
            strategy="afterInteractive"
            data-target-origin="*"
            data-message-type="ROUTE_CHANGE"
            data-include-search-params="true"
            data-only-in-iframe="true"
            data-debug="true"
            data-custom-data='{"appName": "SREE SAI DURGA", "version": "1.0.0", "greeting": "hi"}'
          />
          {children}
          <Toaster />
          <VisualEditsMessenger />
        </ThemeProvider>
      </body>
    </html>
  );
}