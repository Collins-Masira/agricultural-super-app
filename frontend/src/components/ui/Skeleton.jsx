export function SkeletonCircle({ size = 2.75 }) {
  return <span className="asa-skeleton" style={{ width: `${size}rem`, height: `${size}rem`, borderRadius: '9999px', flexShrink: 0 }} />
}

export function SkeletonLine({ width = '100%', height = 0.85 }) {
  return <span className="asa-skeleton" style={{ display: 'block', width, height: `${height}rem` }} />
}

export function SkeletonBlock({ aspectRatio = '1 / 1' }) {
  return <span className="asa-skeleton" style={{ display: 'block', width: '100%', aspectRatio }} />
}
