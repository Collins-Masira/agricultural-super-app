import './ui.css'

export function Tabs({ items, value, onChange, className = '' }) {
  return (
    <div className={`asa-tabs ${className}`} role="tablist">
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          role="tab"
          aria-selected={item.value === value}
          className={`asa-tabs__tab ${item.value === value ? 'asa-tabs__tab--active' : ''}`}
          onClick={() => onChange(item.value)}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}