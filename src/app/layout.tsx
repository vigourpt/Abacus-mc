import './globals.css';
import { ThemeProvider } from './providers';
import Sidebar from './sidebar';
import HeaderBar from '@/components/HeaderBar';

export const metadata = {
  title: 'Mission Control',
  description: 'Autonomous AI Startup Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var theme = localStorage.getItem('theme') || 'dark';
                document.documentElement.setAttribute('data-theme', theme);
              } catch (e) {}
            })();
          `
        }} />
      </head>
      <body>
        <ThemeProvider>
          <div className="layout">
            <Sidebar />
            <div className="main-wrapper">
              <HeaderBar />
              <main className="main-content">
                {children}
              </main>
            </div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
