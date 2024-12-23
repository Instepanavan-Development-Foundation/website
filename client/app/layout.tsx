import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import { Link } from "@nextui-org/link";
import clsx from "clsx";

import { Providers } from "./providers";

import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export const socialLinks = [
  {
    name: "GitHub",
    href: "https://github.com",
  },
  {
    name: "Twitter",
    href: "https://twitter.com",
  },
  {
    name: "LinkedIn",
    href: "https://linkedin.com",
  },
] 

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning lang="en">
      <head />
      <body
        className={clsx(
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable,
        )}
      >
        <Providers themeProps={{ attribute: "class", defaultTheme: "dark" }}>
          <div className="relative flex flex-col h-screen">
            <Navbar />
            <main className="container mx-auto max-w-7xl pt-16 px-6 flex-grow">
              {children}
            </main>
            <footer className="w-full flex flex-col items-center justify-center py-3 gap-2">
              <div className="flex gap-4">
                {socialLinks.map((link) => (
                  <Link
                    key={link.name}
                    isExternal
                    href={link.href}
                    className="text-default-600 hover:text-primary"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
