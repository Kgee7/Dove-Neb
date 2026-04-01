

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

  const price = room.listingType === 'sale' 
    ? `${room.currencySymbol}${room.salePrice?.toLocaleString()}` 
    : `${room.currencySymbol}${room.priceNight?.toLocaleString() || room.priceMonth?.toLocaleString()}${room.priceNight ? '/night' : '/month'}`;

  const description = `${room.listingType === 'sale' ? 'Sale' : 'Rent'}: ${room.title} in ${room.location}. Price: ${price}. View details and photos on Dove Neb.`;
  const safeTwitterDesc = room.description ? room.description.substring(0, 160) + '...' : 'No description available.';

  return {
    title: `${room.title} in ${room.location} | Dove Neb`,
    description: description,
    openGraph: {
      title: room.title,
      description: description,
      type: 'website',
      siteName: 'Dove Neb',
      // Provide the actual listing image for the preview card
      // Note: WhatsApp prefers https URLs. If this is a data URI, unfurling may vary by device.
      images: room.images && room.images.length > 0 ? [
        {
          url: room.images[0],
          width: 1200,
          height: 630,
          alt: room.title,
        }
      ] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: room.title,
      description: safeTwitterDesc,
      images: room.images && room.images.length > 0 ? [room.images[0]] : [],
    }
  };
}

export default async function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RoomDetailsClient id={id} />;
}
