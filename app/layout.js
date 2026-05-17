import './globals.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import { SocketProvider } from '@/context/SocketContext';

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
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Outfit:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <AuthProvider>
          <SocketProvider>
            <div className="mesh-bg" />
            {children}
            <Toaster
              position="bottom-right"
              toastOptions={{
                style: {
                  background: '#1a1a27',
                  color: '#f0f0ff',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: '0.875rem',
                  fontFamily: 'Inter, sans-serif',
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
        </AuthProvider>
      </body>
    </html>
  );
}
