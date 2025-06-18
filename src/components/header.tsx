import Link from 'next/link';
import { Gamepad2 } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-card shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
          <Gamepad2 size={32} />
          <h1 
            className="text-3xl font-headline"
          >
            Zyngrid
          </h1>
        </Link>
        <nav>
          {/* Future navigation links can go here */}
          {/* Example: <Link href="/leaderboard" className="text-foreground hover:text-accent transition-colors">Leaderboard</Link> */}
        </nav>
      </div>
    </header>
  );
}
