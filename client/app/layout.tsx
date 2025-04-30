import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import Link from "next/link";
import clsx from "clsx";

export const dynamic = "force-dynamic";

import { Providers } from "./providers";

import { getSiteConfig } from "@/config/site";
import { Navbar } from "@/components/navbar";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    // { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export async function generateMetadata(): Promise<Metadata> {
  const { title, logo } = await getSiteConfig();

  return {
    title: {
      template: `%s - ${title}`,
      default: title,
    },
    openGraph: {
      type: "website",
      images: { url: logo.url },
    },
  };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { footer: footerMenu } = await getSiteConfig();

  return (
    <html suppressHydrationWarning lang="en">
      <head />
      <body className={clsx("min-h-screen bg-background antialiased")}>
        <Providers themeProps={{ attribute: "class", defaultTheme: "light" }}>
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
                    target="_blank"
                    href={link.href}
                    className="text-default-600 hover:text-primary"
                  >
                    {link.title}
                  </Link>
                ))}
              </div>
              <div>
                Site is open source under AGPL license. 
                Feel free to view, contribute or redistribute it under the terms of the license <Link href="https://github.com/instepanavan/website" target="_blank" className="text-primary">here</Link>.
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
