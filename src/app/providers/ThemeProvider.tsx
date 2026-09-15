"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

export default function ThemeProvider({
  children,
  nonce,
}: {
  children: React.ReactNode;
  /** From the request CSP; without it the theme script is blocked. */
  nonce?: string;
}) {
  return (
    // attribute="class" matches the @custom-variant dark selector in globals.css.
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem={false} nonce={nonce}>
      {children}
    </NextThemesProvider>
  );
}
