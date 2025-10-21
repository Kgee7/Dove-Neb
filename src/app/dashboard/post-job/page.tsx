'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFirestore, useUser, setDocument, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import React, { useEffect } from 'react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Job } from '@/lib/data';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";


const formSchema = z.object({
  title: z.string().min(5, { message: 'Title must be at least 5 characters.' }),
  category: z.enum(['Engineering', 'Design', 'Marketing', 'Sales', 'Product']),
  type: z.enum(['Full-time', 'Part-time', 'Contract']),
  workArrangement: z.enum(['On-site', 'Remote', 'Hybrid']),
  location: z.string().min(2, { message: 'Location is required.' }),
  salary: z.string().min(1, { message: 'Salary is required.' }),
  currency: z.enum(['USD', 'EUR', 'GBP', 'JPY', 'CAD']),
  description: z.string().min(50, { message: 'Description must be at least 50 characters.' }),
  requirements: z.string().min(20, { message: 'Requirements must be at least 20 characters.' }),
  closingDate: z.date({
    required_error: "A closing date is required.",
  }),
  applicationEmail: z.string().email({ message: "Please enter a valid email." }).optional().or(z.literal('')),
  applicationWhatsApp: z.string().optional(),
});

function getCurrencySymbol(currency: string) {
    switch (currency) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'JPY': return '¥';
      case 'CAD': return 'CA$';
      default: return '$';
    }
  }

function PostJobPageContent() {
  const firestore = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  
  const editJobId = searchParams.get('edit');
  
  const jobRef = useMemoFirebase(() => {
    if (!firestore || !editJobId) return null;
    return doc(firestore, 'jobListings', editJobId);
  }, [firestore, editJobId]);

  const { data: jobToEdit, isLoading: isJobLoading } = useDoc<Job>(jobRef);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      location: '',
      salary: '',
      currency: 'USD',
      description: '',
      requirements: '',
      applicationEmail: '',
      applicationWhatsApp: '',
    },
  });

  const workArrangement = form.watch('workArrangement');

  useEffect(() => {
    if (jobToEdit) {
      form.reset({
        title: jobToEdit.title,
        category: jobToEdit.category,
        type: jobToEdit.type,
        workArrangement: jobToEdit.workArrangement || 'On-site',
        location: jobToEdit.location,
        salary: jobToEdit.salary,
        currency: jobToEdit.currency as any || 'USD',
        description: jobToEdit.description,
        requirements: Array.isArray(jobToEdit.requirements) ? jobToEdit.requirements.join('\n') : '',
        closingDate: new Date(jobToEdit.closingDate),
        applicationEmail: jobToEdit.applicationEmail || '',
        applicationWhatsApp: jobToEdit.applicationWhatsApp || '',
      });
    }
  }, [jobToEdit, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !firestore) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to post a job.' });
        return;
    }
    setLoading(true);

    const jobData = {
        ...values,
        location: values.workArrangement === 'Remote' ? 'Remote' : values.location,
        employerId: user.uid,
        postedDate: editJobId && jobToEdit ? jobToEdit.postedDate : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'}),
        closingDate: values.closingDate.toISOString().split('T')[0],
        requirements: values.requirements.split('\n').filter(req => req.trim() !== ''),
        company: user.displayName || 'A Great Company',
        currencySymbol: getCurrencySymbol(values.currency),
    };
    
    try {
        if(editJobId) {
            const jobDocRef = doc(firestore, 'jobListings', editJobId);
            await setDocument(jobDocRef, jobData, { merge: true });
        } else {
            const jobsCollection = collection(firestore, 'jobListings');
            const newDocRef = doc(jobsCollection);
            
            const companyLogos = PlaceHolderImages.filter(img => img.id.startsWith('company-logo'));
            const randomLogo = companyLogos[Math.floor(Math.random() * companyLogos.length)];
            
            const fullJobData = {
              ...jobData,
              id: newDocRef.id,
              logoUrl: randomLogo.imageUrl,
              logoBg: `bg-indigo-100`
            }
            await setDocument(newDocRef, fullJobData);
        }
        
        toast({
            title: `Job ${editJobId ? 'Updated' : 'Posted'}!`,
            description: `Your job listing has been successfully ${editJobId ? 'updated' : 'created'}.`,
        });
        router.push('/dashboard');
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: error.message || 'Could not save job.',
      });
    } finally {
        setLoading(false);
    }
  }

  if (editJobId && isJobLoading) {
    return (
        <div className="flex h-screen w-full items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    )
  }

  return (
    <div className="container max-w-3xl py-12">
      <Card>
        <CardHeader>
          <CardTitle>{editJobId ? 'Edit Job' : 'Post a New Job'}</CardTitle>
          <CardDescription>
            {editJobId ? 'Update the details for your job listing.' : 'Fill out the details below to create a new job listing.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Senior Frontend Developer" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
               <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Engineering">Engineering</SelectItem>
                        <SelectItem value="Design">Design</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Sales">Sales</SelectItem>
                        <SelectItem value="Product">Product</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a job type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Full-time">Full-time</SelectItem>
                        <SelectItem value="Part-time">Part-time</SelectItem>
                        <SelectItem value="Contract">Contract</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormField
                control={form.control}
                name="workArrangement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Work Arrangement</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select work arrangement" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="On-site">On-site</SelectItem>
                        <SelectItem value="Remote">Remote</SelectItem>
                        <SelectItem value="Hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {workArrangement !== 'Remote' && (
                <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g., San Francisco, CA" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <FormField
                    control={form.control}
                    name="salary"
                    render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                        <FormLabel>Salary Range / Rate</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g., 120,000 - 160,000 or 70 - 90 / hour" {...field} />
                        </FormControl>
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
                         <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                <SelectValue placeholder="Select a currency" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="USD">USD ($)</SelectItem>
                                <SelectItem value="EUR">EUR (€)</SelectItem>
                                <SelectItem value="GBP">GBP (£)</SelectItem>
                                <SelectItem value="JPY">JPY (¥)</SelectItem>
                                <SelectItem value="CAD">CAD (CA$)</SelectItem>
                            </SelectContent>
                        </Select>
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
                      <Textarea placeholder="Describe the role and responsibilities..." className="min-h-[150px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requirements</FormLabel>
                    <FormControl>
                      <Textarea placeholder="List the requirements, one per line..." className="min-h-[120px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                  control={form.control}
                  name="applicationEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Application Email (Optional)</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="hr@example.com" {...field} />
                      </FormControl>
                      <FormDescription>
                        Job seekers will be directed to this email address to apply.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="applicationWhatsApp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WhatsApp Number (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="+1234567890" {...field} />
                      </FormControl>
                      <FormDescription>
                        Provide a number for applicants to contact you via WhatsApp.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
               <FormField
                control={form.control}
                name="closingDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Application Closing Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-[240px] pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="submit" className="bg-accent hover:bg-accent/90" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loading ? 'Saving...' : (editJobId ? 'Save Changes' : 'Post Job')}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}


export default function PostJobPage() {
    return (
        <React.Suspense fallback={<div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
            <PostJobPageContent />
        </React.Suspense>
    )
}

    