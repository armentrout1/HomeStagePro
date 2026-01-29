export type UsageStatus = {
  usageCount: number;
  limit: number;
  remaining: number;
  status: 'active' | 'exceeded' | 'premium' | 'unlimited' | 'payment_required';
  message?: string;
  accessToken?: {
    type: 'day-pass' | 'pack-10' | 'unlimited';
    expiresAt: string;
    timeRemaining: string;
    usageLeft?: number;
  };
  // Token-based response fields (normalized into legacy fields above)
  totalRemaining?: number;
  paidRemaining?: number;
  paidGranted?: number;
  paidUsed?: number;
  planId?: string;
  quality?: string;
  expiresAt?: string;
};

export type SaveImagePayload = {
  storageBucket?: string | null;
  originalStoragePath?: string | null;
  stagedStoragePath?: string | null;
  originalImageUrl?: string | null;
  stagedImageUrl?: string | null;
};
