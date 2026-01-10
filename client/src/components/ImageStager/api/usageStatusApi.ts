import { UsageStatus } from '../types';

export async function fetchUsageStatus(): Promise<UsageStatus | null> {
  try {
    const response = await fetch('/api/usage-status', { cache: 'no-store', credentials: 'include' });
    if (response.ok) {
      const data = await response.json();
      
      // Normalize token-based response into legacy UsageStatus shape
      if ('totalRemaining' in data && !('remaining' in data)) {
        data.remaining = data.totalRemaining;
        data.limit = data.freeLimit ?? 2;
        data.usageCount = (data.freeUsed ?? 0) + (data.paidUsed ?? 0);
        data.status = data.totalRemaining > 0 ? 'premium' : 'exceeded';
      }
      
      return data;
    }
  } catch (error) {
    console.error('Error fetching usage status:', error);
  }
  return null;
}
