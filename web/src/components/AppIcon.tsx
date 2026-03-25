import type { SVGProps } from 'react';

export type AppIconName =
  | 'menu'
  | 'close'
  | 'search'
  | 'shopping_bag'
  | 'straighten'
  | 'layers'
  | 'verified'
  | 'history'
  | 'payments'
  | 'explore'
  | 'checkroom'
  | 'local_shipping';

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
