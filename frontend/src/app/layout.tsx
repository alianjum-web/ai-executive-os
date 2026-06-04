import type { Metadata } from "next";
import Script from "next/script";
import { Plus_Jakarta_Sans, DM_Sans } from "next/font/google";
import { StoreProvider } from "@/common/organisms/providers/StoreProvider";
import { ThemeProvider } from "@/common/organisms/providers/ThemeProvider";
import { AuthProvider } from "@/auth/organisms/AuthProvider";
import { readThemeScript } from "@/common/lib/theme";
import "./globals.css";

const heading = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const body = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "AI Executive OS",
  description:
    "AI-powered executive OS — knowledge agent and project routing",
  icons: {
    icon: "/brand/logo-mark.svg",
    apple: "/brand/logo-mark.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-theme="dark"
      className={`${heading.variable} ${body.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col font-sans">
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: readThemeScript() }}
        />
        <StoreProvider>
          <ThemeProvider>
            <AuthProvider>{children}</AuthProvider>
          </ThemeProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
