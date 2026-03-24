import type { ComponentType, SVGProps } from 'react';
import type { PdpFeatureIconKey, PdpTrustIconKey } from './domain-config';

type SvgIcon = ComponentType<SVGProps<SVGSVGElement>>;

function AtelierIconFabric() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path
        d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
    </svg>
  );
}

function AtelierIconPrint() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path
        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
    </svg>
  );
}

function AtelierIconCare() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
    </svg>
  );
}

function IconTeeSilhouette() {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path
        d="M9 3h6l1 2h4v3l-2.5 1.5L16 20H8L6.5 9.5 4 8V5h4l1-2z"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
    </svg>
  );
}

function IconTruck() {
  return (
    <svg className="h-5 w-5 text-deep-teal" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path
        d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconShield() {
  return (
    <svg className="h-5 w-5 text-deep-teal" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconLock() {
  return (
    <svg className="h-5 w-5 text-deep-teal" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeWidth={1.5} />
      <path d="M7 11V7a5 5 0 0110 0v4" strokeWidth={1.5} />
    </svg>
  );
}

export const PDP_FEATURE_ICONS: Record<PdpFeatureIconKey, SvgIcon> = {
  FabricIcon: AtelierIconFabric,
  PrintIcon: AtelierIconPrint,
  SilhouetteIcon: IconTeeSilhouette,
  CareIcon: AtelierIconCare,
};

export const PDP_TRUST_ICONS: Record<PdpTrustIconKey, SvgIcon> = {
  Truck: IconTruck,
  Shield: IconShield,
  Lock: IconLock,
};
