// src/components/icons/PaymentIcons.tsx
// Payment-method badges shown in the footer trust row.

type IconProps = { className?: string };

export const VisaIcon = ({ className = "h-5 w-8" }: IconProps) => (
  <svg viewBox="0 0 48 30" className={className}>
    <rect width="48" height="30" rx="4" fill="#1A1F71" />
    <text x="24" y="20" textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic"
      fontWeight="bold" fontSize="13" fill="#FFFFFF" letterSpacing="0.5">VISA</text>
  </svg>
);

export const MastercardIcon = ({ className = "h-5 w-8" }: IconProps) => (
  <svg viewBox="0 0 48 30" className={className}>
    <rect width="48" height="30" rx="4" fill="#F5F5F5" />
    <circle cx="20" cy="15" r="9" fill="#EB001B" />
    <circle cx="28" cy="15" r="9" fill="#F79E1B" />
    <path d="M24 8.5a9 9 0 010 13 9 9 0 010-13z" fill="#FF5F00" />
  </svg>
);

export const ApplePayIcon = ({ className = "h-5 w-8" }: IconProps) => (
  <svg viewBox="0 0 48 30" className={className}>
    <rect width="48" height="30" rx="4" fill="#000000" />
    <g transform="translate(9,7) scale(0.4)" fill="#FFFFFF">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zm3.35-3.024c.837-1.012 1.4-2.427 1.245-3.831-1.207.052-2.662.805-3.532 1.818-.776.896-1.454 2.338-1.273 3.714 1.338.104 2.71-.688 3.56-1.701z"/>
    </g>
    <text x="32" y="19" textAnchor="middle" fontFamily="-apple-system, system-ui, sans-serif"
      fontWeight="600" fontSize="11" fill="#FFFFFF">Pay</text>
  </svg>
);

export const PaystackIcon = ({ className = "h-5 w-8" }: IconProps) => (
  <svg viewBox="0 0 48 30" className={className}>
    <rect width="48" height="30" rx="4" fill="#00C3F7" />
    <text x="24" y="19" textAnchor="middle" fontFamily="Arial, sans-serif"
      fontWeight="bold" fontSize="8.5" fill="#011B33" letterSpacing="0.1">Paystack</text>
  </svg>
);
