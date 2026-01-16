import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";

export default function ThankYou() {
  const [location, setLocation] = useLocation();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'success' | 'canceled' | 'processing' | 'unknown'>('unknown');
  const [paymentInfo, setPaymentInfo] = useState<{
    plan?: string;
    accessUntil?: string;
    usageAllowed?: number;
  } | null>(null);

  useEffect(() => {
    // Extract the session_id from the URL
    const params = new URLSearchParams(window.location.search);
    const session = params.get('session_id');
    setSessionId(session);

    if (session) {
      // Check the payment status
      checkPaymentStatus(session);
    } else {
      // No session ID, payment status is unknown
      setPaymentStatus('unknown');
    }
  }, []);

  const checkPaymentStatus = async (session: string) => {
    try {
      const response = await apiRequest("GET", `/api/checkout-status?session_id=${session}`);
      
      if (!response.ok) {
        throw new Error("Failed to verify payment status");
      }
      
      const data = await response.json();
      
      if (data.status === 'complete') {
        setPaymentStatus('success');
        setPaymentInfo({
          plan: data.planName,
          accessUntil: data.accessUntil,
          usageAllowed: data.usageAllowed
        });
        
        // The access token is stored in an HTTP-only cookie by the server
        // No need to store it in localStorage
      } else if (data.status === 'canceled') {
        setPaymentStatus('canceled');
      } else {
        setPaymentStatus('processing');
      }
    } catch (error) {
      console.error("Error checking payment status:", error);
      setPaymentStatus('unknown');
    }
  };

  const renderContent = () => {
    switch (paymentStatus) {
      case 'success':
        return (
          <div className="text-center">
            <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
              <svg 
                className="w-8 h-8 text-green-600" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M5 13l4 4L19 7" 
                />
              </svg>
            </div>
            <h1 className="text-3xl font-extrabold mb-4">Thank You For Your Purchase!</h1>
            <p className="text-xl text-gray-600 mb-6">
              Your payment was successful and your access has been activated.
            </p>
            
            {paymentInfo && (
              <Card className="p-6 mb-8 max-w-md mx-auto">
                <h3 className="text-lg font-semibold mb-2">Purchase Details</h3>
                <div className="space-y-2 text-left">
                  {paymentInfo.plan && (
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-gray-600">Plan:</span>
                      <span className="font-medium">{paymentInfo.plan}</span>
                    </div>
                  )}
                  {paymentInfo.accessUntil && (
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-gray-600">Access Until:</span>
                      <span className="font-medium">{new Date(paymentInfo.accessUntil).toLocaleDateString()}</span>
                    </div>
                  )}
                  {paymentInfo.usageAllowed && (
                    <div className="flex justify-between border-b pb-2">
                      <span className="text-gray-600">Stagings Available:</span>
                      <span className="font-medium">{paymentInfo.usageAllowed}</span>
                    </div>
                  )}
                </div>
              </Card>
            )}
            
            <div className="space-x-4">
              <Button
                size="lg"
                onClick={() => {
                  sessionStorage.setItem("scrollToAiStager", "1");
                  window.location.href = "/";
                }}
              >
                Start Staging
              </Button>
            </div>
          </div>
        );
        
      case 'canceled':
        return (
          <div className="text-center">
            <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100">
              <svg 
                className="w-8 h-8 text-yellow-600" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                />
              </svg>
            </div>
            <h1 className="text-3xl font-extrabold mb-4">Payment Canceled</h1>
            <p className="text-xl text-gray-600 mb-6">
              Your payment was canceled and you have not been charged.
            </p>
            <div className="space-x-4">
              <Button variant="outline" asChild>
                <Link href="/upgrade">
                  Return to Upgrade
                </Link>
              </Button>
              <Button asChild>
                <Link href="/">
                  Return Home
                </Link>
              </Button>
            </div>
          </div>
        );
        
      case 'processing':
        return (
          <div className="text-center">
            <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100">
              <svg 
                className="w-8 h-8 text-blue-600 animate-spin" 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24"
              >
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                ></circle>
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
            <h1 className="text-3xl font-extrabold mb-4">Processing Your Payment</h1>
            <p className="text-xl text-gray-600 mb-6">
              Your payment is being processed. This may take a moment.
            </p>
            <p className="text-gray-500 mb-6">
              Please do not close this page. It will automatically update when the process is complete.
            </p>
            <Button 
              onClick={() => checkPaymentStatus(sessionId || '')}
              className="animate-pulse"
            >
              Check Status
            </Button>
          </div>
        );
        
      default:
        return (
          <div className="text-center">
            <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100">
              <svg 
                className="w-8 h-8 text-red-600" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                />
              </svg>
            </div>
            <h1 className="text-3xl font-extrabold mb-4">Payment Status Unknown</h1>
            <p className="text-xl text-gray-600 mb-6">
              We couldn't determine the status of your payment.
            </p>
            <div className="space-x-4">
              <Button variant="outline" asChild>
                <Link href="/upgrade">
                  Try Again
                </Link>
              </Button>
              <Button asChild>
                <Link href="/">
                  Return Home
                </Link>
              </Button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <Card className="p-8 shadow-lg">
          {renderContent()}
        </Card>
      </div>
    </div>
  );
}