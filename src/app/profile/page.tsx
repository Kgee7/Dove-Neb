import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { User } from "lucide-react";

export default function ProfilePage() {
  return (
    <div className="container py-10">
       <h1 className="text-3xl font-bold font-headline mb-8">My Profile</h1>
      <Card>
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
          <CardDescription>
            This is where you will manage your profile information.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-lg">
          <User className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold">Profile Page Coming Soon</h3>
          <p className="text-muted-foreground">
            You'll be able to manage your personal details, resume, and more here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
