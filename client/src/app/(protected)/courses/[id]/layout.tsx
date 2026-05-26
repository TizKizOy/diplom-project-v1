'use client';

import { usePathname } from 'next/navigation';
import { CourseLearnChrome } from '@/components/learn/CourseLearnChrome';

export default function CourseIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? '';
  if (pathname.includes('/manage')) return <>{children}</>;
  if (pathname.includes('/enroll')) return <>{children}</>;
  return <CourseLearnChrome>{children}</CourseLearnChrome>;
}
