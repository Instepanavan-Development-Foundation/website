import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import Link from "next/link";
import clsx from "clsx";

export const dynamic = "force-dynamic";

import { Providers } from "./providers";
import { PostHogProvider } from "./posthog-provider";

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
    icons: {
      icon: logo.url,
      shortcut: logo.url,
      apple: logo.url,
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
  const { footer: footerMenu, footerSocial: footerSocialMenu } =
    await getSiteConfig();

  return (
    <html suppressHydrationWarning lang="en">
      <head />
      <body
        suppressHydrationWarning
        className={clsx("min-h-screen bg-background antialiased")}
      >
        <PostHogProvider>
        <Providers themeProps={{ attribute: "class", defaultTheme: "light" }}>
          <div className="relative flex flex-col h-screen">
            <Navbar />
            <main className="container mx-auto max-w-7xl pt-2 flex-grow">
              {children}
            </main>
            <footer className="w-full flex flex-col items-start container mx-auto max-w-7xl py-3 gap-2">
              <div className="flex flex-col md:flex-row md:gap-10 gap-2">
                <div className="flex flex-col items-start gap-1">
                  {footerMenu.map((link) => (
                    <Link
                      key={link.title}
                      className="text-default-600 hover:text-primary"
                      href={link.href}
                      target="_blank"
                    >
                      {link.title}
                    </Link>
                  ))}
                </div>
                {footerSocialMenu.length > 0 && (
                  <div className="flex flex-col items-start gap-1">
                    {footerSocialMenu.map((link) => (
                      <Link
                        key={link.title}
                        className="text-default-600 hover:text-primary"
                        href={link.href}
                        target="_blank"
                      >
                        {link.title}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <div className="text-sm text-default-500">
                Կայքը բաց կոդով է՝{" "}
                <Link
                  className="text-primary"
                  href="https://en.wikipedia.org/wiki/GNU_Affero_General_Public_License"
                  target="_blank"
                >
                  AGPL արտոնագրով
                </Link>
                ։ Կարող եք դիտել, ներդրում ունենալ կամ վերաբաշխել այն արտոնագրի
                պայմաններով{" "}
                <Link
                  className="text-primary"
                  href="https://github.com/Instepanavan-Development-Foundation/website"
                  target="_blank"
                >
                  այստեղ
                </Link>
                ։
              </div>
            </footer>
          </div>
        </Providers>
        </PostHogProvider>
      </body>
    </html>
  );
}
