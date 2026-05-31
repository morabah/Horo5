import type { SVGProps } from 'react';

export type AppIconName =
  | 'menu'
  | 'close'
  | 'search'
  | 'person'
  | 'shopping_bag'
  | 'straighten'
  | 'layers'
  | 'verified'
  | 'history'
  | 'payments'
  | 'explore'
  | 'checkroom'
  | 'local_shipping'
  | 'link'
  | 'share'
  | 'content_copy'
  | 'favorite'
  | 'instagram'
  | 'whatsapp'
  | 'arrow_right';

type AppIconProps = Omit<SVGProps<SVGSVGElement>, 'children'> & {
  name: AppIconName;
};

function iconPaths(name: AppIconName) {
  switch (name) {
    case 'menu':
      return (
        <>
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </>
      );
    case 'close':
      return (
        <>
          <path d="M6 6l12 12" />
          <path d="M18 6L6 18" />
        </>
      );
    case 'search':
      return (
        <>
          <circle cx="11" cy="11" r="6.5" />
          <path d="M16 16l4 4" />
        </>
      );
    case 'person':
      return (
        <>
          <circle cx="12" cy="7.75" r="3" />
          <path d="M5.75 20a6.25 6.25 0 0112.5 0" />
        </>
      );
    case 'shopping_bag':
      return (
        <>
          <path d="M6.5 8.5h11l-1 10.5a1 1 0 01-.99.9H8.49a1 1 0 01-.99-.9L6.5 8.5z" />
          <path d="M9 9V7.75A3 3 0 0112 4.75a3 3 0 013 3V9" />
        </>
      );
    case 'straighten':
      return (
        <>
          <path d="M4 12h16" />
          <path d="M6.5 9.5v5" />
          <path d="M9 10.5v3" />
          <path d="M11.5 9.5v5" />
          <path d="M14 10.5v3" />
          <path d="M16.5 9.5v5" />
        </>
      );
    case 'layers':
      return (
        <>
          <path d="M12 4l7 4-7 4-7-4 7-4z" />
          <path d="M5 12l7 4 7-4" />
          <path d="M5 16l7 4 7-4" />
        </>
      );
    case 'verified':
      return (
        <>
          <path d="M12 3l2.2 1.3 2.5.2 1.3 2.2 2 1.6-.6 2.4.6 2.4-2 1.6-1.3 2.2-2.5.2L12 21l-2.2-1.3-2.5-.2-1.3-2.2-2-1.6.6-2.4-.6-2.4 2-1.6 1.3-2.2 2.5-.2L12 3z" />
          <path d="M8.2 12.2l2.5 2.4 5.1-5.4" />
        </>
      );
    case 'history':
      return (
        <>
          <path d="M4.5 12A7.5 7.5 0 1112 19.5" />
          <path d="M4.5 6.5V12h5.5" />
          <path d="M12 8.5v4l2.5 1.5" />
        </>
      );
    case 'payments':
      return (
        <>
          <rect x="3.5" y="6" width="17" height="12" rx="2" />
          <path d="M3.5 10h17" />
          <path d="M7 15h3.5" />
        </>
      );
    case 'explore':
      return (
        <>
          <circle cx="12" cy="12" r="8" />
          <path d="M9 15l2.5-6 6-2.5-2.5 6L9 15z" />
          <path d="M11.5 9.5l3 3" />
        </>
      );
    case 'checkroom':
      return (
        <>
          <path d="M12 6.5a1.75 1.75 0 100-3.5 1.75 1.75 0 000 3.5z" />
          <path d="M7 10.5l5-3 5 3" />
          <path d="M9 11.5l-3.5 7.5" />
          <path d="M15 11.5l3.5 7.5" />
          <path d="M8.5 12.5h7" />
        </>
      );
    case 'local_shipping':
      return (
        <>
          <path d="M4 7.5h10v8H4z" />
          <path d="M14 10h3l2 2.5v3H14z" />
          <circle cx="8" cy="17.5" r="1.5" />
          <circle cx="17" cy="17.5" r="1.5" />
        </>
      );
    case 'link':
      return (
        <>
          <path d="M10 13a5 5 0 007.54.54l2-2a5 5 0 00-7.07-7.07l-1.42 1.41" />
          <path d="M14 11a5 5 0 00-7.54-.54l-2 2a5 5 0 007.07 7.07l1.41-1.41" />
        </>
      );
    case 'share':
      return (
        <>
          <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
          <path d="M16 6l-4-4-4 4" />
          <path d="M12 2v15" />
        </>
      );
    case 'content_copy':
      return (
        <>
          <rect x="8" y="8" width="12" height="12" rx="2" />
          <path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2" />
        </>
      );
    case 'favorite':
      return (
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      );
    case 'instagram':
      return (
        <>
          <rect x="4" y="4" width="16" height="16" rx="4" />
          <circle cx="12" cy="12" r="3.25" />
          <path d="M16.9 7.1h.01" />
        </>
      );
    case 'whatsapp':
      return (
        <>
          <path d="M20.5 11.8a8.1 8.1 0 01-12 7.1L4 20l1.2-4.3A8.1 8.1 0 1112.4 20" />
          <path d="M9.3 8.6c.25-.45.5-.45.75-.45h.55c.18 0 .45.05.68.5l.62 1.45c.1.25.08.45-.05.65l-.38.55c-.12.18-.1.35.05.55.45.72 1.08 1.33 1.85 1.8.22.13.4.16.58-.05l.62-.72c.18-.2.42-.25.66-.15l1.42.66c.28.13.45.32.42.62-.05.5-.38 1.1-.8 1.38-.38.25-1.72.58-3.8-.62-2.08-1.2-3.28-3.08-3.45-4.32-.08-.6.05-1.25.3-1.85z" />
        </>
      );
    case 'arrow_right':
      return (
        <>
          <path d="M5 12h14" />
          <path d="M13 6l6 6-6 6" />
        </>
      );
    default:
      return <circle cx="12" cy="12" r="8" />;
  }
}

export function AppIcon({ name, className, strokeWidth = 1.8, ...props }: AppIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      className={className}
      aria-hidden
      {...props}
    >
      {iconPaths(name)}
    </svg>
  );
}
