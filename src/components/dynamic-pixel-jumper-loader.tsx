
'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const PixelJumperGamePage = dynamic(() => import('@/app/games/pixel-jumper/page'), {
  ssr: false,
  loading: () => (
    <div className="container mx-auto px-4 py-8 flex flex-col items-center">
      <Skeleton className="h-[40px] w-[200px] mb-6 self-start" />
      <div className="flex flex-col items-center gap-6 p-4 md:p-8 w-full max-w-[700px]">
        <Skeleton className="h-[60px] w-full max-w-sm" /> {/* Title card header */}
        <Skeleton className="h-[450px] w-full" /> {/* Canvas placeholder */}
        <Skeleton className="h-[50px] w-[200px]" /> {/* Button placeholder */}
      </div>
    </div>
  ),
});

export default function DynamicPixelJumperLoader() {
  return <PixelJumperGamePage />;
}
