// src/components/logo-icon.tsx
import type { SVGProps } from 'react';

export default function LogoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="32" height="32" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  
  <rect width="100" height="100" rx="12" fill="#000000"/>

  
  <path d="M 30 35 L 70 35 L 30 65 L 70 65" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round"/>

  
  <rect x="21" y="48" width="4" height="10" fill="#9B59B6"/>
  <rect x="27" y="45" width="4" height="13" fill="#9B59B6"/>
  <rect x="33" y="50" width="4" height="8" fill="#9B59B6"/>

  
  <circle cx="78" cy="48" r="2" fill="#9B59B6"/>
  <circle cx="82" cy="52" r="2" fill="#9B59B6"/>
  <circle cx="74" cy="52" r="2" fill="#9B59B6"/>
  <circle cx="78" cy="56" r="2" fill="#9B59B6"/>
</svg>

  );
}
