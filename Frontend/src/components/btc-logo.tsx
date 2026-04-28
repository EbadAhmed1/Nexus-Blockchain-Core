"use client"

export function BTCLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Bitcoin Logo - Classic Orange Circle with B */}
      <circle
        cx="50"
        cy="50"
        r="45"
        fill="#F7931A"
      />
      {/* Bitcoin B Symbol */}
      <path
        d="M 35 25 L 35 75 L 52 75 Q 65 75 65 65 L 65 55 Q 65 50 60 50 Q 65 50 65 45 L 65 35 Q 65 25 52 25 Z M 42 35 L 52 35 Q 58 35 58 40 Q 58 45 52 45 L 42 45 Z M 42 50 L 52 50 Q 58 50 58 55 Q 58 60 52 60 L 42 60 Z"
        fill="#FFFFFF"
      />
      {/* Inner highlight for depth */}
      <circle
        cx="50"
        cy="50"
        r="38"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1"
        opacity="0.15"
      />
    </svg>
  )
}

