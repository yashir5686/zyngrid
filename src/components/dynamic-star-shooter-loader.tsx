
'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const StarShooterGamePage = dynamic(() => import('@/app/games/star-shooter/page'), {
  ssr: false,
  loading: () => (
    <div className="container mx-auto px-4 py-8 flex flex-col items-center">
      <Skeleton className="h-[40px] w-[200px] mb-6 self-start md:self-center" /> {/* Back button placeholder */}
      <div className="flex flex-col items-center gap-6 p-2 md:p-4 w-full max-w-[400px]">
        <Skeleton className="h-[50px] md:h-[60px] w-full max-w-md" /> {/* Title card header */}
        <Skeleton className="h-[400px] md:h-[600px] w-full" /> {/* Canvas placeholder (LOGIC_CANVAS_HEIGHT) */}
        <Skeleton className="h-[40px] md:h-[50px] w-[150px] md:w-[200px]" /> {/* Button placeholder */}
         {/* Mobile controls skeleton */}
        <div className="fixed bottom-4 left-4 right-4 flex justify-between items-center z-10 p-2 rounded-lg md:hidden">
            <div className="flex gap-2">
                <Skeleton className="h-16 w-16" />
                <Skeleton className="h-16 w-16" />
            </div>
            <Skeleton className="h-20 w-20 rounded-full" />
        </div>
      </div>
    </div>
  ),
});

export default function DynamicStarShooterLoader() {
  return <StarShooterGamePage />;
}
