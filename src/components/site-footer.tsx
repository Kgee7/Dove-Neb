import { Icons } from "./icons";

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="container py-8">
        <div className="flex flex-col items-center justify-center gap-4 lg:flex-row lg:justify-between">
            <div className="flex items-center space-x-2">
                <Icons.logo className="h-6 w-6" />
                <p className="text-center text-sm font-bold leading-loose md:text-left">
                    Dove Jobs
                </p>
            </div>
          <p className="text-center text-sm text-muted-foreground md:text-left">
            Built to connect dreams with direction.
          </p>
          <p className="text-center text-sm text-muted-foreground md:text-left">
            &copy; {new Date().getFullYear()} Dove Jobs, Inc. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
