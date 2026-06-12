import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Fluence AI — AI Sales Agent Platform',
    template: '%s | Fluence AI',
  },
  description:
    'Fluence AI is an AI-powered sales agent platform that automates customer conversations, qualifies leads, and drives revenue growth 24/7.',
  keywords: [
    'AI sales agent',
    'sales automation',
    'chatbot',
    'lead qualification',
    'customer engagement',
    'AI assistant',
    'sales AI',
    'conversational AI',
  ],
  authors: [{ name: 'Fluence AI' }],
  creator: 'Fluence AI',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    siteName: 'Fluence AI',
    title: 'Fluence AI — AI Sales Agent Platform',
    description:
      'Automate your sales conversations with AI. Qualify leads, handle objections, and close deals 24/7.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Fluence AI — AI Sales Agent Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fluence AI — AI Sales Agent Platform',
    description:
      'Automate your sales conversations with AI. Qualify leads, handle objections, and close deals 24/7.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen font-sans antialiased">
        {children}
        <Toaster
          position="top-right"
          gutter={8}
          toastOptions={{
            duration: 4000,
            style: {
              background: 'hsl(var(--card))',
              color: 'hsl(var(--card-foreground))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius)',
              fontSize: '0.875rem',
              fontFamily: 'var(--font-inter)',
              boxShadow:
                '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
              maxWidth: '420px',
            },
            success: {
              iconTheme: {
                primary: '#22c55e',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#f43f5e',
                secondary: '#ffffff',
              },
            },
            loading: {
              iconTheme: {
                primary: '#6366f1',
                secondary: '#ffffff',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
