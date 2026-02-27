import { Metadata } from 'next';
import { getRoom } from './actions';
import RoomDetailsClient from './RoomDetailsClient';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  
  // Safely attempt to fetch room data
  const room = await getRoom(id);
  
  if (!room) {
    return {
      title: 'Space Details | Dove Neb',
      description: 'Find your next home away from home or permanent residence on Dove Neb.',
    };
  }

  return {
    title: `${room.title} in ${room.location} | Dove Neb`,
    description: room.description.substring(0, 160) + '...',
    openGraph: {
      title: room.title,
      description: room.description.substring(0, 160) + '...',
      type: 'website',
      siteName: 'Dove Neb',
      // Provide the actual listing image for the WhatsApp preview
      images: room.images && room.images.length > 0 ? [room.images[0]] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: room.title,
      description: room.description.substring(0, 160) + '...',
    }
  };
}

export default async function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RoomDetailsClient id={id} />;
}
