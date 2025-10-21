import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="container py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
            <h1 className="text-3xl font-bold font-headline">Employer Dashboard</h1>
            <p className="text-muted-foreground">Manage your job postings and applicants.</p>
        </div>
        <Button className="bg-accent hover:bg-accent/90">
            <PlusCircle className="mr-2 h-4 w-4"/>
            Post a New Job
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Job Postings</CardTitle>
          <CardDescription>
            You have no active job postings.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-lg">
            <Briefcase className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold">No Jobs Posted Yet</h3>
            <p className="text-muted-foreground mb-4">Get started by posting your first job opening.</p>
            <Button className="bg-accent hover:bg-accent/90">
                <PlusCircle className="mr-2 h-4 w-4"/>
                Post a Job
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
