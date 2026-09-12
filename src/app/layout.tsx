import type { Metadata } from "next";
import { Fraunces, Work_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import QueryProviders from "./providers/QueryProvider";
import ThemeProvider from "./providers/ThemeProvider";
import "./globals.css";

const workSans = Work_Sans({ subsets: ["latin"], variable: "--font-work-sans" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });

export const metadata: Metadata = {
  title: {
    default: "Travelar — Travel Agency Management",
    template: "%s | Travelar",
  },
  description:
    "Multi-tenant travel agency management: ticketing, visa processing, Hajj & Umrah, and billing in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning is required by next-themes, which writes the
    // theme class onto <html> before React hydrates.
    <html lang="en" suppressHydrationWarning>
      <body className={`${workSans.variable} ${fraunces.variable} font-sans antialiased`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:rounded-md focus:bg-background focus:p-4"
        >
          Skip to main content
        </a>

        <ThemeProvider>
          <QueryProviders>
            {children}
            <Toaster richColors position="top-center" />
          </QueryProviders>
        </ThemeProvider>
      </body>
    </html>
  );
}
