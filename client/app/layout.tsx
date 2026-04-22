import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Armenian } from "next/font/google";
import Link from "next/link";
import clsx from "clsx";

export const dynamic = "force-dynamic";

import { Providers } from "./providers";
import { PostHogProvider } from "./posthog-provider";

import { getSiteConfig } from "@/config/site";
import { Navbar } from "@/components/navbar";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const notoArmenian = Noto_Sans_Armenian({
  subsets: ["armenian"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-armenian",
  display: "swap",
});

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
    ...(process.env.MASTODON_PROFILE_URL && {
      other: { "fediverse:creator": process.env.MASTODON_PROFILE_URL },
    }),
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
    <html
      suppressHydrationWarning
      className={clsx(inter.variable, notoArmenian.variable)}
      lang="hy"
    >
      <head>
        {process.env.MASTODON_PROFILE_URL && (
          <link href={process.env.MASTODON_PROFILE_URL} rel="me" />
        )}
      </head>
      <body
        suppressHydrationWarning
        className={clsx("min-h-screen bg-white antialiased font-sans text-ink")}
      >
        <PostHogProvider>
          <Providers themeProps={{ attribute: "class", defaultTheme: "light" }}>
            <div className="relative flex flex-col min-h-screen">
              <Navbar />
              <main className="container mx-auto max-w-7xl px-4 md:px-8 pt-2 grow">
                {children}
              </main>
              <footer className="w-full mt-16 border-t border-cream-200">
                <div className="container mx-auto max-w-7xl px-4 md:px-8 py-10 flex flex-col gap-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                    <div className="flex flex-col md:flex-row md:gap-12 gap-4">
                      <div className="flex flex-col items-start gap-2">
                        {footerMenu.map((link) => (
                          <Link
                            key={link.title}
                            className="text-sm text-ink-muted hover:text-primary transition-colors"
                            href={link.href}
                            target="_blank"
                          >
                            {link.title}
                          </Link>
                        ))}
                      </div>
                      {footerSocialMenu.length > 0 && (
                        <div className="flex flex-col items-start gap-2">
                          {footerSocialMenu.map((link) => (
                            <Link
                              key={link.title}
                              className="text-sm text-ink-muted hover:text-primary transition-colors"
                              href={link.href}
                              target="_blank"
                            >
                              {link.title}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs text-ink-meta leading-relaxed">
                    Կայքը բաց կոդով է՝{" "}
                    <Link
                      className="text-primary hover:underline"
                      href="https://en.wikipedia.org/wiki/GNU_Affero_General_Public_License"
                      target="_blank"
                    >
                      AGPL արտոնագրով
                    </Link>
                    ։ Կարող եք դիտել, ներդրում ունենալ կամ վերաբաշխել այն
                    արտոնագրի պայմաններով{" "}
                    <Link
                      className="text-primary hover:underline"
                      href="https://github.com/Instepanavan-Development-Foundation/website"
                      target="_blank"
                    >
                      այստեղ
                    </Link>
                    ։
                  </div>
                </div>
              </footer>
            </div>
          </Providers>
        </PostHogProvider>
      </body>
    </html>
  );
}
