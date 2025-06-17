
'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const SnakeGamePage = dynamic(() => import('@/app/games/snake/page'), {
  ssr: false,
  loading: () => (
    <div className="container mx-auto px-4 py-8 flex flex-col items-center">
      <Skeleton className="h-[40px] w-[200px] mb-6" />
      <Skeleton className="h-[400px] w-[400px]" />
      <Skeleton className="h-[40px] w-[150px] mt-4" />
    </div>
  ),
});

export default function DynamicSnakeLoader() {
  return <SnakeGamePage />;
}
