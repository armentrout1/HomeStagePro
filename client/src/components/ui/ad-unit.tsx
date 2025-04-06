import React, { useEffect, useRef } from 'react';

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

interface AdUnitProps {
  adSlot: string;
  adFormat?: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical';
  className?: string;
}

export function AdUnit({ adSlot, adFormat = 'auto', className = '' }: AdUnitProps) {
  const adRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    try {
      if (adRef.current && window.adsbygoogle) {
        // Push the ad configuration
        window.adsbygoogle.push({});
      }
    } catch (error) {
      console.error('Error loading AdSense ad:', error);
    }
  }, []);

  const getStyleForFormat = () => {
    switch (adFormat) {
      case 'rectangle':
        return { display: 'inline-block', width: '336px', height: '280px' };
      case 'horizontal':
        return { display: 'inline-block', width: '728px', height: '90px' };
      case 'vertical':
        return { display: 'inline-block', width: '160px', height: '600px' };
      case 'fluid':
      case 'auto':
      default:
        return { display: 'block' };
    }
  };

  return (
    <div className={`ad-container ${className}`} ref={adRef}>
      <ins
        className="adsbygoogle"
        style={getStyleForFormat()}
        data-ad-client="ca-pub-4627926361013694"
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
}