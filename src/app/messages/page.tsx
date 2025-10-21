import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

export default function MessagesPage() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold font-headline mb-8">Messages</h1>
      <Card>
        <CardHeader>
          <CardTitle>Inbox</CardTitle>
          <CardDescription>
            Communicate with employers and job seekers.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-lg">
          <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold">Messaging Coming Soon</h3>
          <p className="text-muted-foreground">
            A secure messaging system to connect candidates and companies is on its way.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
