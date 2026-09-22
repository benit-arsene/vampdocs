"use client";

interface IconProps {
  className?: string;
}

const baseProps = {
  xmlns: "http://www.w3.org/2000/svg",
  width: "24" as const,
  height: "24" as const,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function DocumentIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} {...baseProps}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

export function StarIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} {...baseProps}>
      <polygon points="12 17.27 18.18 21 15.82 13.5 22 9.24 14.81 8.63 12 2 9.19 8.63 2 9.24 8.18 13.5 5.82 21z" />
    </svg>
  );
}

export function FolderIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} {...baseProps}>
      <path d="M22 19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l3 3h5a2 2 0 0 1 2 2v11z" />
    </svg>
  );
}

export function CloudIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} {...baseProps}>
      <path d="M19.35 10.04A7.5 7.5 0 0 0 12 4c-3.76 0-6.84 2.88-7.42 6.64A5.99 5.99 0 0 0 10 20h8a4 4 0 0 0 1.35-7.96z" />
    </svg>
  );
}

export function HistoryIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} {...baseProps}>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 15" />
    </svg>
  );
}

export function CommentIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} {...baseProps}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function VideoIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} {...baseProps}>
      <path d="M22 16V8a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2l1.5 2h7L18 20h2a2 2 0 0 0 2-2z" />
      <path d="M10 9l5 3-5 3V9z" />
    </svg>
  );
}

export function LockIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} {...baseProps}>
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export function ShareIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} {...baseProps}>
      <path d="M22 16.52a4.5 4.5 0 1 0-1.41-8.56l-.73.73A6.5 6.5 0 0 0 5.48 13.5 4.5 4.5 0 1 0 10 18h8.5z" />
      <line x1="16" y1="8" x2="22" y2="2" />
      <line x1="15.75" y1="7.75" x2="21.25" y2="13.25" />
    </svg>
  );
}

export function ChevronDownIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} {...baseProps}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export function ChevronUpIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} {...baseProps}>
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

export function SearchIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} {...baseProps}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="15.64" y2="15.64" />
    </svg>
  );
}

export function PrinterIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} {...baseProps}>
      <polyline points="6 9 6 15 10 15" />
      <rect x="6" y="2" width="12" height="16" rx="2" />
      <path d="M6 15h-2a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2" />
    </svg>
  );
}

export function SpellCheckIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} {...baseProps}>
      <path d="M16 4h2a2 2 0 0 1 2 2v1H6V6a2 2 0 0 1 2-2h2" />
      <path d="M6 9h12v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9z" />
      <path d="M9 12h6" />
    </svg>
  );
}

export function FormatPaintIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} {...baseProps}>
      <path d="M2 2h10a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-4a2 2 0 0 1 2-2h8" />
    </svg>
  );
}

export function ZoomOutIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} {...baseProps}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="15.64" y2="15.64" />
      <line x1="7" y1="11" x2="15" y2="11" />
    </svg>
  );
}

export function ZoomInIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} {...baseProps}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="15.64" y2="15.64" />
      <line x1="11" y1="7" x2="11" y2="15" />
      <line x1="7" y1="11" x2="15" y2="11" />
    </svg>
  );
}

export function MinusIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} {...baseProps}>
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function PlusIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} {...baseProps}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

export function TextColorIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} {...baseProps}>
      <path d="M14 8a4 4 0 0 1-8 0 4 4 0 0 1 8 0z" />
      <path d="M14 8V6a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v2" />
      <circle cx="12" cy="14" r="3" />
    </svg>
  );
}

export function HighlighterIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} {...baseProps}>
      <path d="M9 7l6 6a6 6 0 0 1-6 6L7 15a6 6 0 0 1 2-8z" />
      <path d="M15 7l6 6a6 6 0 0 1-6 6l-4-4" />
    </svg>
  );
}

export function LinkIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} {...baseProps}>
      <path d="M10 14a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
      <path d="M14 14a3.5 3.5 0 0 0 0-7" />
      <line x1="8.5" y1="8.5" x2="15.5" y2="15.5" />
    </svg>
  );
}

export function ImageIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} {...baseProps}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5-5 5" />
    </svg>
  );
}

export function MoreHorizontalIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} {...baseProps}>
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
      <circle cx="5" cy="12" r="1" />
    </svg>
  );
}

export function PencilIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} {...baseProps}>
      <path d="M17 3a2.85 2.85 0 1 1 4 4L10 20l-4 1 1-4 10-11z" />
    </svg>
  );
}

export function UserIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} {...baseProps}>
      <path d="M20 21V12a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v9" />
      <circle cx="12" cy="7" r="3" />
    </svg>
  );
}

export function Share2Icon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} {...baseProps}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

export function XIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} {...baseProps}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function CheckIcon({ className = "h-4 w-4" }: IconProps) {
  return (
    <svg className={className} {...baseProps}>
      <polyline points="20 6 9 15 4 10" />
    </svg>
  );
}
