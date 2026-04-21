/**
 * WalletIcon — SVG icon for wallet types.
 *
 * Ported from the prototype's shared.jsx with identical SVG paths and viewBox attributes.
 *
 * @param {Object} props
 * @param {string} props.type - Wallet type (bank, ewallet, credit, paylater, cash)
 * @param {number} [props.size=24] - Icon width and height in pixels
 * @param {Object} rest - Additional props spread onto the <svg> element
 */
export default function WalletIcon({ type, size = 24, ...rest }) {
  const icons = {
    bank: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...rest}>
        <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
      </svg>
    ),
    ewallet: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...rest}>
        <rect x="2" y="5" width="20" height="14" rx="3" />
        <path d="M16 12h2" />
      </svg>
    ),
    credit: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...rest}>
        <rect x="2" y="5" width="20" height="14" rx="3" />
        <path d="M2 10h20M7 15h2" />
      </svg>
    ),
    paylater: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...rest}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4l2.5 2.5" />
      </svg>
    ),
    cash: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...rest}>
        <rect x="2" y="7" width="20" height="10" rx="2" />
        <circle cx="12" cy="12" r="2.5" />
        <path d="M6 12h.01M18 12h.01" />
      </svg>
    ),
  };

  return icons[type] || icons.bank;
}
