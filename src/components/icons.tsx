import type { SVGProps } from "react";

export const Icons = {
  logo: (props: SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.5.2.36.44.7.72 1.02.4.45.88.83 1.44 1.13.56.3 1.18.45 1.8.45s1.24-.15 1.8-.45c.56-.3 1.04-.68 1.44-1.13.28-.32.52-.66.72-1.02C19.13 20.17 22 16.42 22 12z" />
      <path d="M16 8a4 4 0 0 0-8 0c0 1.08.44 2.06.81 2.81" />
    </svg>
  ),
};
