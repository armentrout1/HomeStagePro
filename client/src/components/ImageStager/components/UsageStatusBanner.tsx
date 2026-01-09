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

  const total = usageStatus.totalRemaining ?? usageStatus.remaining;
  const paid = usageStatus.paidRemaining ?? 0;
  const free = usageStatus.freeRemaining ?? usageStatus.remaining;
  const isPremiumView = usageStatus.status === 'premium' || usageStatus.totalRemaining !== undefined;

  return (
    <div className={`mt-2 text-center text-sm ${isPremiumView ? 'text-green-600' : usageStatus.remaining === 0 ? 'text-red-500' : 'text-gray-500'}`}>
      <div className="flex items-center justify-center gap-1">
        {isLoadingUsage ? (
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-primary mr-1"></div>
        ) : isPremiumView ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-9.618 5.04C2.137 9.155 2 10.56 2 12c0 4.418 3.582 8 8 8s8-3.582 8-8c0-1.44-.137-2.845-.382-4.016z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}

        {isPremiumView ? (
          <div className="text-left">
            <span className="font-medium">You have {total} stagings remaining</span>
            <div className="text-xs text-green-600 mt-1">
              {paid} paid + {free} free
            </div>
            {usageStatus.accessToken && (
              <div className="text-xs text-green-600 mt-1">
                {usageStatus.accessToken.type === 'day-pass' && (
                  <>Day Pass: {usageStatus.accessToken.timeRemaining}</>
                )}
                {usageStatus.accessToken.type === 'pack-10' && (
                  <>Pack: {usageStatus.accessToken.usageLeft} stagings remaining</>
                )}
                {usageStatus.accessToken.type === 'unlimited' && (
                  <>Unlimited Access: {usageStatus.accessToken.timeRemaining}</>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-left">
            <div className="font-medium">Free usage: 2 room stagings per IP address</div>
            {usageStatus.remaining > 0 ? (
              <div>
                You have {usageStatus.remaining} free staging{usageStatus.remaining !== 1 ? 's' : ''} remaining
              </div>
            ) : (
              <div>
                You have reached your free usage limit.{" "}
                <Link to="/upgrade">
                  <span className="text-primary font-medium underline">Upgrade now</span>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
