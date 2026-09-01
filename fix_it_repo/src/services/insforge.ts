import { createClient } from '@insforge/sdk';

const baseUrl = (import.meta.env.VITE_INSFORGE_BASE_URL as string) || 'https://37v5babv.us-east.insforge.app';
const anonKey = (import.meta.env.VITE_INSFORGE_ANON_KEY as string) || 'anon_cb1681eb8340dc585ee724e9248a1f59c2f2e2193f489a867312998c3781b960';

export const insforge = createClient({
  baseUrl,
  anonKey,
});
