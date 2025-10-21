"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Icons } from "@/components/icons";

export function SiteHeader() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/jobs", label: "Jobs" },
    { href: "/ai-matching", label: "AI Matching" },
    { href: "/dashboard", label: "Dashboard" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Icons.logo className="h-6 w-6 text-primary" />
          <span className="font-bold sm:inline-block">
            Dove Jobs
          </span>
        </Link>
        <nav className="hidden flex-1 items-center gap-4 text-sm lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "transition-colors hover:text-foreground/80",
                pathname === link.href ? "text-foreground" : "text-foreground/60"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <Button className="hidden sm:inline-flex" variant="outline">Post a Job</Button>
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "ghost" }),
              "hidden sm:inline-flex"
            )}
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className={cn(buttonVariants({ variant: "default" }), "bg-accent hover:bg-accent/90")}
          >
            Sign Up
          </Link>
        </div>
      </div>
    </header>
  );
}
