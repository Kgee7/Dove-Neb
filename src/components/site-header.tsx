"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo } from 'react';

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Icons } from "@/components/icons";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User as UserIcon, Loader2 } from "lucide-react";

type UserProfile = {
  firstName: string;
  lastName: string;
  photoURL?: string;
};

export function SiteHeader() {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const router = useRouter();

  const userDocRef = useMemo(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

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
    if(user?.displayName) {
        const names = user.displayName.split(' ');
        if (names.length > 1) {
            return `${names[0][0]}${names[names.length - 1][0]}`;
        }
        return names[0].substring(0, 2);
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

  const fullName = userProfile ? `${userProfile.firstName} ${userProfile.lastName}`.trim() : user?.displayName || "My Account";
  const photoURL = user?.photoURL || userProfile?.photoURL;


  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Icons.logo className="h-6 w-6 text-primary" />
          <span className="font-bold sm:inline-block">Dove Jobs</span>
        </Link>
        <nav className="hidden flex-1 items-center gap-4 text-sm lg:flex">
          {navLinks.map((link) => {
            if (link.protected && !user) return null;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "transition-colors hover:text-foreground/80",
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
             <Loader2 className="h-6 w-6 animate-spin" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={photoURL || ""}
                      alt={fullName}
                    />
                    <AvatarFallback>
                      {getInitials(userProfile?.firstName, userProfile?.lastName)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {fullName}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                 <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/profile")}>
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
               <Link href="/dashboard/list-room">
                <Button className="hidden sm:inline-flex" variant="outline">
                    List your space
                </Button>
               </Link>
                 <Link href="/dashboard/post-job">
                <Button className="hidden sm:inline-flex" variant="outline">
                    Post a Job
                </Button>
               </Link>
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
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "bg-accent hover:bg-accent/90"
                )}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
