import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import { Link } from "@nextui-org/link";
import clsx from "clsx";

export const dynamic = 'force-dynamic'

import { Providers } from "./providers";

import { getSiteConfig } from "@/config/site";
import { Navbar } from "@/components/navbar";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { footer: footerMenu } = await getSiteConfig();

  return (
    <html suppressHydrationWarning lang="en">
      <head />
      <body
        className={clsx(
          "min-h-screen bg-background font-sans antialiased",
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
                {footerMenu.map((link) => (
                  <Link
                    key={link.title}
                    isExternal
                    href={link.href}
                    className="text-default-600 hover:text-primary"
                  >
                    {link.title}
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
