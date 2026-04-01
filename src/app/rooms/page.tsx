import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import Rooms from './Rooms';

export default function RoomsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <Rooms />
    </Suspense>
  );
}
