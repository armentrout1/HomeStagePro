import { UsageStatus } from '../types';

export async function fetchUsageStatus(): Promise<UsageStatus | null> {
  try {
    const response = await fetch('/api/usage-status', { cache: 'no-store' });
    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (error) {
    console.error('Error fetching usage status:', error);
  }
  return null;
}
