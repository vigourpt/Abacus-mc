import './globals.css';

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
