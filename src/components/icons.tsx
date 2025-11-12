
import type { SVGProps } from "react";
import Image from 'next/image';

export const Icons = {
  logo: (props: SVGProps<SVGSVGElement>) => (
    <Image
      src="/logo.svg"
      alt="Dove Neb Logo"
      width={48}
      height={48}
      {...(props as any)} 
    />
  ),
};
