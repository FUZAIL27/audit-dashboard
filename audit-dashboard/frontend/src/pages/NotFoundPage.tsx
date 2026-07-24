import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4 bg-base-950 text-center">
      <ShieldAlert size={40} className="text-text-muted" />
      <div>
        <h1 className="font-display text-2xl text-text-primary">Page not found</h1>
        <p className="mt-1 text-sm text-text-muted">
          The page you're looking for doesn't exist or was moved.
        </p>
      </div>
      <Link to="/dashboard">
        <Button variant="secondary">Back to dashboard</Button>
      </Link>
    </div>
  );
}
