import { redirect } from 'next/navigation';
import { loadConfig } from '@/src/db/configs';

export default async function Home() {
  const config = loadConfig();
  if (!config.textProvider.enabled) redirect('/onboarding');
  redirect('/dashboard');
}
