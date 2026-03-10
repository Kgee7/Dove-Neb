
import { Suspense } from 'react';
import Rooms from './Rooms';
import { Loader2 } from 'lucide-react';

export default function RoomsListingPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen"><Loader2 className="h-12 w-12 animate-spin" /></div>}>
      <Rooms />
    </Suspense>
  );
}
