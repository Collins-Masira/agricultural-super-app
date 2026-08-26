/** Minimal inline icons — no external icon dependency. */

function base(props) {
  return {
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: '0 0 24 24',
    width: 20,
    height: 20,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
    ...props,
  }
}

export function HomeIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </svg>
  )
}

export function UsersIcon(props) {
  return (
    <svg {...base(props)}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.5 2.9-5.5 6.5-5.5s6.5 2 6.5 5.5" />
      <path d="M16 4.8a3.5 3.5 0 0 1 0 6.4" />
      <path d="M17.5 15c1.6.8 4 2 4 5" />
    </svg>
  )
}

export function UserIcon(props) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20c0-3.9 3.4-6 7.5-6s7.5 2.1 7.5 6" />
    </svg>
  )
}

export function PlusIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function LogOutIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </svg>
  )
}

export function HeartIcon({ filled, ...props }) {
  return (
    <svg {...base(props)} fill={filled ? 'currentColor' : 'none'}>
      <path d="M12 20.5C7 16.5 3 13 3 8.8 3 6 5.2 4 7.8 4c1.6 0 3 .8 4.2 2.2C13.2 4.8 14.6 4 16.2 4 18.8 4 21 6 21 8.8c0 4.2-4 7.7-9 11.7Z" />
    </svg>
  )
}

export function CommentIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M21 12a8 8 0 0 1-8 8H4l2.5-3A8 8 0 1 1 21 12Z" />
    </svg>
  )
}

export function SearchIcon(props) {
  return (
    <svg {...base(props)}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

export function CommunityIcon(props) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a13 13 0 0 1 0 18M12 3a13 13 0 0 0 0 18M3 12h18" />
    </svg>
  )
}

export function MessageIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M21 12a8 8 0 0 1-8 8H4l2.5-3A8 8 0 1 1 21 12Z" />
      <path d="M8.5 10.5h7M8.5 13.5h4" />
    </svg>
  )
}

export function SparkleIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
      <path d="M12 8a4 4 0 0 0 4 4 4 4 0 0 0-4 4 4 4 0 0 0-4-4 4 4 0 0 0 4-4Z" />
    </svg>
  )
}

export function EyeIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export function EyeOffIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M3 3l18 18" />
      <path d="M10.6 5.2A9.5 9.5 0 0 1 12 5c6.5 0 10 7 10 7a15.6 15.6 0 0 1-3.4 4.3M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7a9.6 9.6 0 0 0 4-.86" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  )
}

export function CheckIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

export function XIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

export function ShieldIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M12 3l7 3v6c0 5-3.5 7.5-7 9-3.5-1.5-7-4-7-9V6l7-3Z" />
    </svg>
  )
}

export function LeafIcon(props) {
  return (
    <svg {...base(props)}>
      <path d="M20 4C11 4 4 10 4 19c9 0 16-6 16-15Z" />
      <path d="M5 20c3-3 6-7 8-11" />
    </svg>
  )
}