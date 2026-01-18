import { LandingPage } from '@/features/landing/ui/LandingPage';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function Page() {
  const { userId } = await auth();

  if (userId) {
    redirect('/en-US/dashboard');
  }

  return <LandingPage />;
}
