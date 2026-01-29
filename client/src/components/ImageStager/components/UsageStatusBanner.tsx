import { Link } from "wouter";
import { UsageStatus } from "../types";

interface UsageStatusBannerProps {
  usageStatus: UsageStatus | null;
  isLoadingUsage: boolean;
}

export function UsageStatusBanner({ usageStatus, isLoadingUsage }: UsageStatusBannerProps) {
  if (!usageStatus) {
    return null;
  }

  const totalRemaining = usageStatus.totalRemaining ?? usageStatus.remaining ?? 0;
  const paidRemaining = usageStatus.paidRemaining ?? totalRemaining;
  const isPremiumView = usageStatus.status === 'premium' || usageStatus.status === 'unlimited';
  const isExceeded = usageStatus.status === 'exceeded';

  if (usageStatus.status === 'payment_required') {
    return (
      <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <div className="flex items-center gap-2">
          {isLoadingUsage ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-200 border-t-amber-500" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <div className="text-left">
            <p className="font-medium">Paid access required.</p>
            <p className="text-xs">Choose a pack to unlock staging credits.</p>
            <Link to="/upgrade" className="mt-1 inline-flex text-xs font-semibold text-amber-900 underline">
              View plans
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isPremiumView) {
    return (
      <div className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        <div className="flex items-center gap-2">
          {isLoadingUsage ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-500" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-9.618 5.04C2.137 9.155 2 10.56 2 12c0 4.418 3.582 8 8 8s8-3.582 8-8c0-1.44-.137-2.845-.382-4.016z" />
            </svg>
          )}
          <div className="text-left">
            <p className="font-medium">{paidRemaining} paid staging{paidRemaining === 1 ? '' : 's'} remaining</p>
            {usageStatus.planId && (
              <p className="text-xs">
                Plan: {usageStatus.planId} · Expires {usageStatus.expiresAt ? new Date(usageStatus.expiresAt).toLocaleDateString() : 'soon'}
              </p>
            )}
            {usageStatus.accessToken && usageStatus.accessToken.usageLeft !== undefined && (
              <p className="text-xs">Token credits left: {usageStatus.accessToken.usageLeft}</p>
            )}
            {import.meta.env.DEV && usageStatus.status === 'unlimited' && (
              <p className="text-xs text-yellow-700">Dev mode: usage limits disabled</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (isExceeded) {
    return (
      <div className="mt-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
        <div className="flex items-center gap-2">
          {isLoadingUsage ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-rose-200 border-t-rose-500" />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
          <div className="text-left">
            <p className="font-medium">All paid credits are used.</p>
            <p className="text-xs">Purchase another pack to keep staging rooms.</p>
            <Link to="/upgrade" className="mt-1 inline-flex text-xs font-semibold text-rose-800 underline">
              Choose a pack
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
