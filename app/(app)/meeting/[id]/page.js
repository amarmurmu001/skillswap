'use client';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import VideoCall from '@/components/VideoCall';

export default function MeetingPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <VideoCall
      roomName={params.id}
      displayName={user.name}
      userId={user.id}
      onLeave={() => router.push('/dashboard')}
    />
  );
}
