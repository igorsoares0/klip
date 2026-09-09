/**
 * Every icon in the design is inline SVG on a 16x16 viewBox, stroke 1.5.
 * Nav path data is ported verbatim from the prototype's NAV array.
 */

type IconProps = {
  className?: string;
  size?: number;
};

function Stroke({
  d,
  size = 16,
  className,
  fill = "none",
}: IconProps & { d: string; fill?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill={fill}
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

export const NAV_ICON_PATHS = {
  dashboard: "M2 3.5h5v4H2zM9 3.5h5v9H9zM2 9.5h5v3H2z",
  links: "M6.5 9.5l3-3M6 4.5l1-1a2.5 2.5 0 013.5 3.5l-1 1M10 11.5l-1 1A2.5 2.5 0 015.5 9l1-1",
  projects: "M2 4.5a1 1 0 011-1h3l1.2 1.5H13a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1z",
  analytics: "M2.5 13V8M6.5 13V3.5M10.5 13V9.5M14 13V6",
  qr: "M2.5 2.5h4v4h-4zM9.5 2.5h4v4h-4zM2.5 9.5h4v4h-4zM9.5 9.5h1.6v1.6H9.5zM11.9 11.9h1.6v1.6h-1.6z",
  domains:
    "M8 2a6 6 0 100 12A6 6 0 008 2zM2.3 8h11.4M8 2c1.6 1.8 2.4 3.8 2.4 6S9.6 12.2 8 14c-1.6-1.8-2.4-3.8-2.4-6S6.4 3.8 8 2z",
  api: "M6 3.5L2.5 8 6 12.5M10 3.5L13.5 8 10 12.5",
  billing: "M2 5.5a1 1 0 011-1h10a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1zM2 7.5h12",
  settings:
    "M8 10a2 2 0 100-4 2 2 0 000 4zM13 8l1-1.2-1-1.7-1.5.4-1.3-.8L9.8 3H6.2l-.4 1.7-1.3.8L3 5.1 2 6.8 3 8l-1 1.2 1 1.7 1.5-.4 1.3.8.4 1.7h3.6l.4-1.7 1.3-.8 1.5.4 1-1.7z",
} as const;

export type NavIconName = keyof typeof NAV_ICON_PATHS;

export function NavIcon({ name, ...props }: IconProps & { name: NavIconName }) {
  return <Stroke d={NAV_ICON_PATHS[name]} {...props} />;
}

export const LinkGlyph = (props: IconProps) => (
  <Stroke d={NAV_ICON_PATHS.links} {...props} />
);

export const SearchIcon = (props: IconProps) => (
  <Stroke d="M7.2 12a4.8 4.8 0 100-9.6 4.8 4.8 0 000 9.6zM13.5 13.5l-2.9-2.9" {...props} />
);

export const PlusIcon = (props: IconProps) => (
  <Stroke d="M8 3.5v9M3.5 8h9" {...props} />
);

export const ChevronDown = (props: IconProps) => (
  <Stroke d="M4.5 6.5L8 10l3.5-3.5" {...props} />
);

export const ChevronLeft = (props: IconProps) => (
  <Stroke d="M9.5 4L6 8l3.5 4" {...props} />
);

export const ChevronRight = (props: IconProps) => (
  <Stroke d="M6.5 4L10 8l-3.5 4" {...props} />
);

export const CheckIcon = (props: IconProps) => (
  <Stroke d="M3.5 8.5l3 3 6-7" {...props} />
);

export const CloseIcon = (props: IconProps) => (
  <Stroke d="M4 4l8 8M12 4l-8 8" {...props} />
);

export const AlertIcon = (props: IconProps) => (
  <Stroke d="M8 2.8l5.5 10H2.5zM8 6.8v2.6M8 11.3h.01" {...props} />
);

export const CopyIcon = (props: IconProps) => (
  <Stroke
    d="M5.5 5.5V3.6a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1h-1.9M3.5 5.5h6a1 1 0 011 1v6a1 1 0 01-1 1h-6a1 1 0 01-1-1v-6a1 1 0 011-1z"
    {...props}
  />
);

export const ArrowRight = (props: IconProps) => (
  <Stroke d="M3 8h10M9 4l4 4-4 4" {...props} />
);

export const FolderIcon = (props: IconProps) => (
  <Stroke d={NAV_ICON_PATHS.projects} {...props} />
);

export const DotsIcon = (props: IconProps) => (
  <Stroke d="M4 8h.01M8 8h.01M12 8h.01" {...props} />
);

export const SidebarIcon = (props: IconProps) => (
  <Stroke d="M2.5 3.5h11v9h-11zM6.5 3.5v9" {...props} />
);

/** Official four-colour Google mark for the auth screens. */
export function GoogleMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 009 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 010-3.44V4.95H.96a9 9 0 000 8.1l3.01-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 00.96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}
