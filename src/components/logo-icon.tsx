// src/components/logo-icon.tsx
import type { SVGProps } from 'react';

export default function LogoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="32" // Default width, can be overridden by props
      height="32" // Default height, can be overridden by props
      viewBox="0 0 100 100" // Standardized viewBox for the design
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Bars on the left - Purple */}
      <rect x="13" y="37" width="7" height="26" fill="hsl(var(--primary))" /> {/* Tallest bar */}
      <rect x="23" y="27" width="7" height="46" fill="hsl(var(--primary))" /> {/* Middle height bar */}
      <rect x="33" y="47" width="7" height="16" fill="hsl(var(--primary))" /> {/* Shortest bar */}

      {/* Stylized 'Z' - White */}
      <path
        d="M43 33 H73 L53 67 H23 L43 33 Z"
        fill="hsl(var(--foreground))"
      />

      {/* Four purple circles on the right */}
      <circle cx="80" cy="38" r="4" fill="hsl(var(--primary))" />
      <circle cx="90" cy="38" r="4" fill="hsl(var(--primary))" />
      <circle cx="80" cy="48" r="4" fill="hsl(var(--primary))" />
      <circle cx="90" cy="48" r="4" fill="hsl(var(--primary))" />
    </svg>
  );
}
