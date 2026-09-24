import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import QueryProviders from "./providers/QueryProvider";
import ThemeProvider from "./providers/ThemeProvider";
import "./globals.css";

// One family for the whole product: a dashboard of tables and figures reads
// better in Inter than in anything wider.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "Travelar — Travel Agency Management",
    template: "%s | Travelar",
  },
  description:
    "Multi-tenant travel agency management: ticketing, visa processing, Hajj & Umrah, and billing in one place.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Set by proxy.ts for this request. next-themes writes an inline script to
  // apply the theme before paint, and the CSP only lets it run with the nonce.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    // suppressHydrationWarning is required by next-themes, which writes the
    // theme class onto <html> before React hydrates.
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:rounded-md focus:bg-background focus:p-4"
        >
          Skip to main content
        </a>

        <ThemeProvider nonce={nonce}>
          <QueryProviders>
            {children}
            <Toaster richColors position="top-center" />
          </QueryProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
