import type { Metadata } from 'next';
import { Figtree, Fraunces, Shantell_Sans } from 'next/font/google';
import fs from 'fs';
import path from 'path';
import './globals.css';
import { PageInteractions } from '@/components/PageInteractions';
import { RouteCurtain } from '@/components/RouteCurtain';
import { PupActor } from '@/components/PupActor';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { WhatsAppBar } from '@/components/WhatsAppBar';
import { PawTrailCanvas } from '@/components/PawTrailCanvas';
import { siteConfig } from '@/data/siteConfig';

const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-figtree',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

const shantell = Shantell_Sans({
  subsets: ['latin'],
  variable: '--font-shantell',
  display: 'swap',
});

export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.description,
  applicationName: siteConfig.name,
  metadataBase: new URL(siteConfig.url),
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
    images: [{ url: '/brand/logo.png', width: 800, height: 800, alt: siteConfig.name }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.title,
    description: siteConfig.description,
    images: ['/brand/logo.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const curtainHtmlPath = path.join(process.cwd(), 'src/data/curtain.html');
  const headerHtmlPath = path.join(process.cwd(), 'src/data/header.html');
  const footerHtmlPath = path.join(process.cwd(), 'src/data/footer.html');

  const curtainHtml = fs.existsSync(curtainHtmlPath) ? fs.readFileSync(curtainHtmlPath, 'utf8') : '';
  const headerHtml = fs.existsSync(headerHtmlPath) ? fs.readFileSync(headerHtmlPath, 'utf8') : '';
  const footerHtml = fs.existsSync(footerHtmlPath) ? fs.readFileSync(footerHtmlPath, 'utf8') : '';

  return (
    <html
      lang="en"
      className={`${figtree.variable} ${fraunces.variable} ${shantell.variable}`}
    >
      <head>
        <link rel="stylesheet" href="/styles/original.css" />
      </head>
      <body className="theme-milk font-sans text-cocoa antialiased selection:bg-honey/40 selection:text-toffee-ink">
        <PageInteractions />
        <PupActor />
        <RouteCurtain initialHtml={curtainHtml} />
        <Header initialHtml={headerHtml} />
        {children}
        <Footer initialHtml={footerHtml} />
        <WhatsAppBar />
        <PawTrailCanvas />
      </body>
    </html>
  );
}
