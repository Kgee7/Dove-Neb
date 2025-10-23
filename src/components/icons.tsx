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
      <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3-3-3.5S13.5 10 12 10V3" />
      <path d="M5 22a7 7 0 0 1 7-7c0-2 1-3 3-3.5S17.5 10 19 10V3" />
    </svg>
  ),
};
