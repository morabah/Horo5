import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getGaMeasurementId, getMetaPixelId, hasAnySemIds } from './config';
import { initWebVitalsReporting } from './webVitals';

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.async = true;
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

function loadClarity(projectId: string) {
  if (typeof document === 'undefined') return;
  if (document.querySelector('script[src*="clarity.ms"]')) return;
  const inline = document.createElement('script');
  inline.textContent = `(function(c,l,a,r,i,t,y){
c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", ${JSON.stringify(projectId)});`;
  document.head.appendChild(inline);
}

export function AnalyticsRoot() {
  const location = useLocation();
  const gaId = getGaMeasurementId();
  const pixelId = getMetaPixelId();
  const [ready, setReady] = useState(false);
  const initRef = useRef(false);

  useEffect(() => {
    const clarityId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID?.trim();
    if (clarityId) loadClarity(clarityId);
  }, []);

  useEffect(() => {
    if (!hasAnySemIds() || initRef.current) return;
    initRef.current = true;

    const run = async () => {
      if (gaId) {
        await loadScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`);
        window.dataLayer = window.dataLayer || [];
        window.gtag = function gtag(...args: unknown[]) {
          window.dataLayer!.push(args);
        };
        window.gtag('js', new Date());
        initWebVitalsReporting();
      }

      if (pixelId) {
        const inline = document.createElement('script');
        inline.textContent = `
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', ${JSON.stringify(pixelId)});
`;
        document.head.appendChild(inline);
      }

      setReady(true);
    };

    void run().catch(() => {
      setReady(true);
    });
  }, [gaId, pixelId]);

  useEffect(() => {
    if (!ready) return;
    const path = location.pathname + location.search;
    if (window.gtag && gaId) {
      window.gtag('config', gaId, { page_path: path });
    }
    if (window.fbq && pixelId) {
      window.fbq('track', 'PageView');
    }
  }, [location.pathname, location.search, ready, gaId, pixelId]);

  return null;
}
