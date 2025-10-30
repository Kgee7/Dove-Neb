
import Image from "next/image";
import Link from "next/link";
import { Icons } from "@/components/icons";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const heroImage = PlaceHolderImages.find(
    (img) => img.id === "hero-background"
  );
  return (
    <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-2">
      <div className="flex items-center justify-center p-4 sm:p-8">
        <div className="mx-auto w-full max-w-md">
          <Link
            href="/"
            className="mb-8 flex items-center justify-center gap-2 text-2xl font-bold text-foreground"
          >
            <Icons.logo className="h-7 w-7 text-primary" />
            <span>Dove Neb</span>
          </Link>
          {children}
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            data-ai-hint={heroImage.imageHint}
            fill
            sizes="50vw"
            className="object-cover"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
        <div className="relative z-10 flex h-full flex-col justify-end p-10 text-white">
          <div className="max-w-md rounded-lg bg-black/40 p-6 backdrop-blur-sm">
            <h2 className="text-3xl font-bold">
              Find your next opportunity.
            </h2>
            <p className="mt-4 text-lg text-zinc-200">
              Join thousands of users finding jobs, rooms, and new connections.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
