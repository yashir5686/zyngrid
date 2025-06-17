
'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const SnakeGamePage = dynamic(() => import('@/app/games/snake/page'), {
  ssr: false,
  loading: () => (
    <div className="container mx-auto px-4 py-8 flex flex-col items-center">
      <Skeleton className="h-[40px] w-[200px] mb-6 self-start md:self-center" /> {/* Back button placeholder */}
      <Skeleton className="h-[300px] w-full max-w-[400px] md:h-[400px]" /> {/* Canvas placeholder */}
      <Skeleton className="h-[40px] w-[150px] mt-4" /> {/* Button placeholder */}
      <div className="mt-4 grid grid-cols-3 gap-2 w-full max-w-xs md:hidden"> {/* Mobile controls skeleton */}
        <div /> <Skeleton className="h-16 w-full" /> <div />
        <Skeleton className="h-16 w-full" /> <Skeleton className="h-16 w-full" /> <Skeleton className="h-16 w-full" />
      </div>
    </div>
  ),
});

export default function DynamicSnakeLoader() {
  return <SnakeGamePage />;
}
