import './globals.css';
import { Inter, Outfit } from 'next/font/google';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import { AppDataProvider } from '@/context/AppDataContext';
import { SocketProvider } from '@/context/SocketContext';
import ErrorBoundary from '@/components/ErrorBoundary';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-outfit',
  display: 'swap',
});

export const metadata = {
  title: 'SkillSwap — Barter Knowledge, Not Money',
  description:
    'Connect with people who want to learn what you teach and teach what you want to learn. Free skill exchanges, real connections.',
  keywords: 'skill swap, skill exchange, peer learning, free tutoring, barter economy',
  openGraph: {
    title: 'SkillSwap — Barter Knowledge, Not Money',
    description: 'Free peer-to-peer skill exchange platform',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${outfit.variable}`} style={{ colorScheme: 'dark' }}>
      <head>
        <meta name="theme-color" content="#0a0a0f" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        <ErrorBoundary>
          <AuthProvider>
            <AppDataProvider>
              <SocketProvider>
                <div className="mesh-bg" aria-hidden="true" />
                <div id="skip-to-main" />
                {children}
                <Toaster
                  position="bottom-right"
                  containerClassName="toast-container"
                  toastOptions={{
                    style: {
                      background: '#1a1a27',
                      color: '#f0f0ff',
                      border: '1px solid rgba(99,102,241,0.2)',
                      borderRadius: '0.875rem',
                      fontFamily: 'var(--font-inter), sans-serif',
                    },
                    success: {
                      iconTheme: { primary: '#6366f1', secondary: '#f0f0ff' },
                    },
                    error: {
                      iconTheme: { primary: '#ef4444', secondary: '#f0f0ff' },
                    },
                  }}
                />
              </SocketProvider>
            </AppDataProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
