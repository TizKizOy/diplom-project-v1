import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/hooks/useAuth';
import './globals.scss';

export const metadata: Metadata = {
  title: 'МГИРО - Курсы повышения квалификации',
  description: 'Платформа для дистанционного обучения педагогов',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
