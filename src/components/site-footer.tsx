
import Link from "next/link";
import Image from "next/image";

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="container py-8">
        <div className="flex flex-col items-center justify-center gap-4 lg:flex-row lg:justify-between">
          <div className="flex items-center space-x-2">
            <Image src="/logo.png" alt="Dove Neb Logo" width={24} height={24} />
            <p className="text-center text-sm font-bold leading-loose md:text-left">
              Dove Neb
            </p>
          </div>
          <div className="flex flex-col items-center gap-2 text-center text-sm text-muted-foreground md:flex-row md:gap-4">
             <Link href="/blog" className="hover:underline">Guide</Link>
             <Link href="/support" className="hover:underline">Support</Link>
             <Link href="/terms-of-service" className="hover:underline">Terms of Service</Link>
             <Link href="/privacy-policy" className="hover:underline">Privacy Policy</Link>
          </div>
          <p className="text-center text-sm text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} Dove Neb, Inc. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
