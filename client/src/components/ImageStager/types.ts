export type UsageStatus = {
  usageCount: number;
  limit: number;
  remaining: number;
  status: 'active' | 'exceeded' | 'premium';
  accessToken?: {
    type: 'day-pass' | 'pack-10' | 'unlimited';
    expiresAt: string;
    timeRemaining: string;
    usageLeft?: number;
  };
  // Token-based response fields (normalized into legacy fields above)
  totalRemaining?: number;
  paidRemaining?: number;
  freeRemaining?: number;
  freeLimit?: number;
  freeUsed?: number;
  paidGranted?: number;
  paidUsed?: number;
};

export type SaveImagePayload = {
  storageBucket?: string | null;
  originalStoragePath?: string | null;
  stagedStoragePath?: string | null;
  originalImageUrl?: string | null;
  stagedImageUrl?: string | null;
};
