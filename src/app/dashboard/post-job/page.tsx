
'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useUser } from '@/firebase';
import { addDoc, collection } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { currencies } from '@/lib/currencies';
import { format } from 'date-fns';

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
import { Loader2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

const formSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters long.'),
  companyName: z.string().min(2, 'Company name is required.'),
  country: z.string().min(2, 'Country is required.'),
  location: z.string().min(2, 'City/State is required.'),
  type: z.enum(["Full-time", "Part-time", "Contract", "Internship", "Remote", "Hybrid"]),
  description: z.string().min(20, 'Description must be at least 20 characters long.'),
  currency: z.string().min(1, 'Currency is required.'),
  salaryMin: z.coerce.number().min(0).optional(),
  salaryMax: z.coerce.number().min(0).optional(),
  applicationMethod: z.enum(['email', 'whatsapp'], { required_error: 'Please select an application method.' }),
  applicationEmail: z.string().email('Please enter a valid email.').optional(),
  applicationWhatsapp: z.string().min(10, 'Please enter a valid WhatsApp number.').optional(),
  listingStartDate: z.string().min(1, 'Start date is required.'),
  listingEndDate: z.string().min(1, 'End date is required.'),
}).refine((data) => {
    if (data.applicationMethod === 'email') return !!data.applicationEmail;
    return true;
  }, {
    message: 'Email is required for this application method.',
    path: ['applicationEmail'],
  })
  .refine((data) => {
    if (data.applicationMethod === 'whatsapp') return !!data.applicationWhatsapp;
    return true;
  }, {
    message: 'WhatsApp number is required for this application method.',
    path: ['applicationWhatsapp'],
  });


type PostJobFormValues = z.infer<typeof formSchema>;

export default function PostJobPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<PostJobFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      companyName: '',
      country: '',
      location: '',
      description: '',
      currency: 'USD',
      salaryMin: undefined,
      salaryMax: undefined,
      applicationMethod: 'email',
      applicationEmail: '',
      applicationWhatsapp: '',
      listingStartDate: format(new Date(), 'yyyy-MM-dd'),
      listingEndDate: format(new Date(new Date().setMonth(new Date().getMonth() + 1)), 'yyyy-MM-dd'),
    },
  });

  const applicationMethod = form.watch('applicationMethod');

   useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [isUserLoading, user, router]);

  const onSubmit = async (data: PostJobFormValues) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in as an employer to post a job.',
      });
      return;
    }
    setIsLoading(true);

    const selectedCurrency = currencies.find(c => c.code === data.currency);
    const salaryCurrency = selectedCurrency?.code || 'USD';
    const salaryCurrencySymbol = selectedCurrency?.symbol || '$';

    try {
      const jobData = {
        ...data,
        salaryCurrency,
        salaryCurrencySymbol,
        applicationEmail: data.applicationMethod === 'email' ? data.applicationEmail : null,
        applicationWhatsapp: data.applicationMethod === 'whatsapp' ? data.applicationWhatsapp : null,
        employerId: user.uid,
        status: 'active',
        createdAt: new Date(),
      };

      await addDoc(collection(firestore!, 'jobs'), jobData);

      toast({
        title: 'Job Posted!',
        description: 'Your job listing is now live.',
      });
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Error posting job:', error);
      toast({
        variant: 'destructive',
        title: 'Posting Failed',
        description: error.message || 'Could not post your job.',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isUserLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] w-full items-center justify-center">
      <div className="container max-w-3xl py-12 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Post a New Job</CardTitle>
            <CardDescription>Fill out the details below to create a new job listing.</CardDescription>
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
                        <FormControl>
                          <Input placeholder="e.g., United States" {...field} />
                        </FormControl>
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
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Currency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {currencies.map(currency => (
                              <SelectItem key={currency.code} value={currency.code}>
                                {currency.code} - {currency.name}
                              </SelectItem>
                            ))}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="listingStartDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Listing Start Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormDescription>When the listing becomes public.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="listingEndDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Listing End Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormDescription>When the listing expires automatically.</FormDescription>
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
                          Use Markdown for formatting. Supports 5,000+ words.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="applicationMethod"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Application Method</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex items-center space-x-4"
                        >
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <RadioGroupItem value="email" id="email" />
                            </FormControl>
                            <Label htmlFor="email" className="font-normal">Email</Label>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <RadioGroupItem value="whatsapp" id="whatsapp" />
                            </FormControl>
                            <Label htmlFor="whatsapp" className="font-normal">WhatsApp</Label>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {applicationMethod === 'email' && (
                  <FormField
                    control={form.control}
                    name="applicationEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Application Email</FormLabel>
                        <FormControl>
                          <Input placeholder="recruiting@example.com" {...field} />
                        </FormControl>
                        <FormDescription>
                          Job seekers will send their applications to this email address.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {applicationMethod === 'whatsapp' && (
                  <FormField
                    control={form.control}
                    name="applicationWhatsapp"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Application WhatsApp Number</FormLabel>
                        <FormControl>
                          <Input placeholder="+1234567890" {...field} />
                        </FormControl>
                        <FormDescription>
                          Job seekers will contact this WhatsApp number. Include the country code.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Post Job'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
