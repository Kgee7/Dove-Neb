
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useUser, useDoc } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Job } from '@/lib/job-data';
import { countries } from '@/lib/countries';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const formSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters long.'),
  companyName: z.string().min(2, 'Company name is required.'),
  country: z.string().min(1, 'Country is required.'),
  location: z.string().min(2, 'City/State is required.'),
  type: z.enum(["Full-time", "Part-time", "Contract", "Internship", "Remote", "Hybrid"]),
  description: z.string().min(20, 'Description must be at least 20 characters long.'),
  salaryMin: z.coerce.number().min(0).optional(),
  salaryMax: z.coerce.number().min(0).optional(),
  applicationEmail: z.string().email('Please enter a valid email.'),
});

type EditJobFormValues = z.infer<typeof formSchema>;

export default function EditJobPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const jobDocRef = useMemo(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'jobs', id);
  }, [firestore, id]);

  const { data: job, isLoading: isJobLoading } = useDoc<Job>(jobDocRef);

  const form = useForm<EditJobFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
        title: '',
        companyName: '',
        country: 'US',
        location: '',
        description: '',
        salaryMin: undefined,
        salaryMax: undefined,
        applicationEmail: '',
    },
  });

  useEffect(() => {
    if (job) {
      if (user?.uid !== job.employerId) {
        toast({ variant: 'destructive', title: 'Unauthorized', description: 'You cannot edit this job.' });
        router.push('/dashboard');
        return;
      }
      form.reset({
        ...job,
        applicationMethod: 'email', // Set default for existing jobs
        applicationEmail: job.applicationEmail || '',
        country: (job as any).country || 'US',
      });
    }
  }, [job, user, router, form, toast]);

  const onSubmit = async (data: EditJobFormValues) => {
    if (!user || !jobDocRef) return;

    setIsLoading(true);
    
    const selectedCountry = countries.find(c => c.code === data.country);
    const salaryCurrency = selectedCountry?.currency || 'USD';
    const salaryCurrencySymbol = selectedCountry?.currencySymbol || '$';

    try {
      await updateDoc(jobDocRef, { 
          ...data,
          applicationMethod: 'email',
          salaryCurrency,
          salaryCurrencySymbol,
      });
      toast({
        title: 'Job Updated!',
        description: 'Your job listing has been successfully updated.',
      });
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Error updating job:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'Could not update your job.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isUserLoading || isJobLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!job) {
    return (
         <div className="container py-12 text-center">
            <h1 className="text-3xl font-bold">Job not found</h1>
            <Link href="/dashboard">
                <Button variant="link" className="mt-4">Back to Dashboard</Button>
            </Link>
        </div>
    )
  }

  return (
    <div className="container max-w-3xl py-12">
        <div className="mb-8">
            <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
            </Link>
        </div>
      <Card>
        <CardHeader>
          <CardTitle>Edit Job Listing</CardTitle>
          <CardDescription>Update the details below for your job listing.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Senior Software Engineer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Acme Inc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a country" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {countries.map(country => (
                            <SelectItem key={country.code} value={country.code}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City / State</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., San Francisco, CA" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a job type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Full-time">Full-time</SelectItem>
                          <SelectItem value="Part-time">Part-time</SelectItem>
                          <SelectItem value="Contract">Contract</SelectItem>
                           <SelectItem value="Internship">Internship</SelectItem>
                           <SelectItem value="Remote">Remote</SelectItem>
                           <SelectItem value="Hybrid">Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="salaryMin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Salary (Optional)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="70000" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="salaryMax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Salary (Optional)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="120000" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the role, responsibilities, and requirements..."
                        className="min-h-[200px]"
                        {...field}
                      />
                    </FormControl>
                     <FormDescription>
                        Use Markdown for formatting.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="applicationEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Application Email</FormLabel>
                    <FormControl>
                      <Input placeholder="recruiting@example.com" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormDescription>
                      Job seekers will send their applications to this email address.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Changes'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
