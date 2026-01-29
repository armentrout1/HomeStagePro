import { UsageStatus } from '../types';

const PAYMENT_REQUIRED_STATUS: UsageStatus = {
  usageCount: 0,
  limit: 0,
  remaining: 0,
  status: 'payment_required',
  message: 'Paid access required. Choose a pack to start staging.',
};

const normalizeUsageStatus = (data: any): UsageStatus => {
  const paidRemaining = typeof data.paidRemaining === 'number'
    ? data.paidRemaining
    : typeof data.totalRemaining === 'number'
    ? data.totalRemaining
    : typeof data.remaining === 'number'
    ? data.remaining
    : 0;

  const paidGranted = typeof data.paidGranted === 'number'
    ? data.paidGranted
    : typeof data.limit === 'number'
    ? data.limit
    : paidRemaining;

  const paidUsed = typeof data.paidUsed === 'number'
    ? data.paidUsed
    : typeof data.usageCount === 'number'
    ? data.usageCount
    : paidGranted - paidRemaining;

  const status: UsageStatus['status'] = data.status && typeof data.status === 'string'
    ? data.status
    : paidRemaining > 0
    ? 'premium'
    : 'exceeded';

  return {
    ...data,
    usageCount: paidUsed,
    limit: paidGranted,
    remaining: paidRemaining,
    status,
  } as UsageStatus;
};

export async function fetchUsageStatus(): Promise<UsageStatus | null> {
  try {
    const response = await fetch('/api/usage-status', {
      cache: 'no-store',
      credentials: 'include',
    });

    if (response.ok) {
      const data = await response.json();
      return normalizeUsageStatus(data);
    }

    if (response.status === 402) {
      const data = await response.json().catch(() => null);
      return {
        ...PAYMENT_REQUIRED_STATUS,
        message: data?.message ?? PAYMENT_REQUIRED_STATUS.message,
      };
    }

    const errorData = await response.json().catch(() => null);
    console.error('Failed to fetch usage status', response.status, errorData);
  } catch (error) {
    console.error('Error fetching usage status:', error);
  }
  return null;
}
