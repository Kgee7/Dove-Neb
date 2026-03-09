
"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from 'react';

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { useUser, useAuth, useDoc, useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetClose, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User as UserIcon, Loader2, Menu, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import NotificationsDropdown from "./notifications-dropdown";

type UserProfile = {
  firstName: string;
  lastName: string;
  preferredName?: string;
  photoURL?: string | null;
};

export function SiteHeader() {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const userDocRef = useMemo(() => {
    if (!isUserLoading && user && firestore) {
      return doc(firestore, 'users', user.uid);
    }
    return null;
  }, [firestore, user, isUserLoading]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  const handleSignOut = async () => {
    if (auth) {
      await auth.signOut();
    }
    router.push("/");
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`;
    }
    if (firstName) {
      return firstName.substring(0, 2);
    }
    if (user?.email) {
        return user.email.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  const navLinks = [
    { href: "/jobs", label: "Jobs" },
    { href: "/rooms", label: "Rooms" },
    { href: "/dashboard", label: "Dashboard", protected: true },
  ];

  const fullName = userProfile?.preferredName || (userProfile ? `${userProfile.firstName} ${userProfile.lastName}`.trim() : user?.displayName || "My Account");
  const photoURL = user?.photoURL ?? userProfile?.photoURL;


  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center px-4 sm:px-8">
        <Link href="/" className="mr-4 sm:mr-6 flex items-center space-x-2 shrink-0">
          <Image src="/logo.png" alt="Dove Neb Logo" width={24} height={24} className="text-primary" priority />
          <span className="font-bold text-sm sm:text-base hidden xs:inline-block">Dove Neb</span>
        </Link>
        <nav className="hidden flex-1 items-center gap-4 sm:gap-6 text-sm lg:flex">
          {navLinks.map((link) => {
            if (link.protected && !user) return null;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "transition-colors hover:text-foreground font-medium",
                  pathname?.startsWith(link.href)
                    ? "text-foreground"
                    : "text-foreground/60"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-2">
          {isUserLoading || (user && isProfileLoading) ? (
             <Loader2 className="h-5 w-5 animate-spin" />
          ) : user ? (
            <div className="flex items-center gap-1 sm:gap-2">
              <NotificationsDropdown />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full focus-visible:ring-0"
                  >
                    <Avatar className="h-8 w-8 border border-muted">
                      {photoURL && <AvatarImage
                        src={photoURL}
                        alt={fullName}
                      />}
                      <AvatarFallback className="text-[10px] sm:text-xs">
                        {getInitials(userProfile?.firstName, userProfile?.lastName)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 mt-2" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-bold leading-none truncate">
                        {fullName}
                      </p>
                      <p className="text-[10px] leading-none text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                   <DropdownMenuItem onClick={() => router.push("/dashboard")} className="cursor-pointer">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/profile")} className="cursor-pointer">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="lg:hidden">
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                    <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Menu className="h-5 w-5" />
                    </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-[85%] max-w-xs p-0">
                        <SheetHeader className="p-6 border-b text-left">
                            <SheetTitle className="text-lg font-bold flex items-center gap-2">
                                <Image src="/logo.png" alt="Logo" width={24} height={24} />
                                Dove Neb
                            </SheetTitle>
                        </SheetHeader>
                        <div className="p-6 space-y-6">
                            <div className="space-y-3">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Navigation</p>
                                {navLinks.map(link => (
                                    <Link key={link.href} href={link.href} onClick={() => setIsMobileMenuOpen(false)} className={cn("block text-sm font-medium py-2 px-3 rounded-md transition-colors", pathname === link.href ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted")}>
                                        {link.label}
                                    </Link>
                                ))}
                            </div>
                            <Separator />
                            <div className="space-y-3">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Postings</p>
                                <Link href="/dashboard/list-room" onClick={() => setIsMobileMenuOpen(false)} className="block py-2">
                                    <Button variant="outline" className="w-full justify-start h-10 text-xs">Lodge Now</Button>
                                </Link>
                                <Link href="/dashboard/post-job" onClick={() => setIsMobileMenuOpen(false)} className="block py-2">
                                    <Button variant="outline" className="w-full justify-start h-10 text-xs">Post a Job</Button>
                                </Link>
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
              </div>
            </div>
          ) : (
            <>
               <div className="hidden lg:flex items-center space-x-2">
                <Link href="/dashboard/list-room">
                    <Button variant="outline" size="sm" className="h-8 px-3 text-xs">
                        Lodge Now
                    </Button>
                </Link>
                <Link href="/dashboard/post-job">
                    <Button variant="outline" size="sm" className="h-8 px-3 text-xs">
                        Post a Job
                    </Button>
                </Link>
                <Link
                    href="/login"
                    className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-8 px-3 text-xs")}
                >
                    Sign In
                </Link>
                <Link
                    href="/signup"
                    className={cn(
                    buttonVariants({ variant: "default", size: "sm" }), "h-8 px-3 text-xs font-bold"
                    )}
                >
                    Sign Up
                </Link>
               </div>

              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    className="p-2 lg:hidden"
                  >
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[85%] max-w-xs p-0">
                    <SheetHeader className="flex flex-row justify-between items-center py-4 px-6 border-b">
                         <Link href="/" className="flex items-center space-x-2" onClick={() => setIsMobileMenuOpen(false)}>
                            <Image src="/logo.png" alt="Dove Neb Logo" width={24} height={24} className="text-primary" />
                            <span className="font-bold">Dove Neb</span>
                        </Link>
                        <SheetTitle className="sr-only">Mobile Menu</SheetTitle>
                        <SheetClose asChild>
                           <Button variant="ghost" size="icon" className="rounded-full">
                             <X className="h-5 w-5" />
                             <span className="sr-only">Close menu</span>
                           </Button>
                        </SheetClose>
                    </SheetHeader>
                    <div className="p-6">
                        <div className="flex flex-col space-y-4">
                            <div className="space-y-2">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-3">Explore</p>
                                <Link href="/jobs" onClick={() => setIsMobileMenuOpen(false)} className="block py-2 px-3 text-sm font-medium hover:bg-muted rounded-md">Jobs</Link>
                                <Link href="/rooms" onClick={() => setIsMobileMenuOpen(false)} className="block py-2 px-3 text-sm font-medium hover:bg-muted rounded-md">Rooms</Link>
                            </div>
                            <Separator />
                            <div className="space-y-3">
                                <Link href="/dashboard/list-room" onClick={() => setIsMobileMenuOpen(false)}>
                                    <Button variant="outline" className="w-full justify-start h-10 text-xs">Lodge Now</Button>
                                </Link>
                                <Link href="/dashboard/post-job" onClick={() => setIsMobileMenuOpen(false)}>
                                    <Button variant="outline" className="w-full justify-start h-10 text-xs">Post a Job</Button>
                                </Link>
                                 <Link href="/support" onClick={() => setIsMobileMenuOpen(false)}>
                                    <Button variant="outline" className="w-full justify-start h-10 text-xs">Help Center</Button>
                                </Link>
                            </div>
                            <div className="border-t pt-4 space-y-3">
                                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                                    <Button variant="ghost" className="w-full justify-start h-10 text-xs">Sign In</Button>
                                </Link>
                                <Link href="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                                    <Button className="w-full justify-start h-10 text-xs font-bold">Sign Up</Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </SheetContent>
              </Sheet>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
