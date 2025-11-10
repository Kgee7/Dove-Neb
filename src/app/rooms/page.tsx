
import { Suspense } from 'react';
import Rooms from './Rooms';

export default function RoomsListingPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64">Loading...</div>}>
      <Rooms />
    </Suspense>
  );
}
