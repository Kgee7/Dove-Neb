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

type UserProfile = {
    companyName?: string;
};


const formSchema = z.object({
  title: z.string().min(5, { message: 'Title must be at least 5 characters.' }),
  category: z.enum(['Engineering', 'Design', 'Marketing', 'Sales', 'Product']),
  jobType: z.enum(['Full-time', 'Part-time', 'Contract']),
  workArrangement: z.enum(['On-site', 'Remote', 'Hybrid']),
  location: z.string().min(2, { message: 'Location is required.' }),
  salary: z.string().min(1, { message: 'Salary is required.' }),
  currency: z.enum(['AED', 'AFN', 'ALL', 'AMD', 'ANG', 'AOA', 'ARS', 'AUD', 'AWG', 'AZN', 'BAM', 'BBD', 'BDT', 'BGN', 'BHD', 'BIF', 'BMD', 'BND', 'BOB', 'BRL', 'BSD', 'BTN', 'BWP', 'BYN', 'BZD', 'CAD', 'CDF', 'CHF', 'CLP', 'CNY', 'COP', 'CRC', 'CUP', 'CVE', 'CZK', 'DJF', 'DKK', 'DOP', 'DZD', 'EGP', 'ERN', 'ETB', 'EUR', 'FJD', 'GBP', 'GEL', 'GHS', 'GIP', 'GMD', 'GNF', 'GQE', 'GTQ', 'GYD', 'HKD', 'HNL', 'HRK', 'HTG', 'HUF', 'IDR', 'ILS', 'INR', 'IQD', 'IRR', 'ISK', 'JMD', 'JOD', 'JPY', 'KES', 'KGS', 'KHR', 'KMF', 'KWD', 'KZT', 'LAK', 'LBP', 'LKR', 'LRD', 'LSL', 'LYD', 'MAD', 'MDL', 'MGA', 'MKD', 'MMK', 'MNT', 'MOP', 'MRU', 'MUR', 'MVR', 'MWK', 'MXN', 'MYR', 'MZN', 'NAD', 'NGN', 'NIO', 'NOK', 'NPR', 'NZD', 'OMR', 'PAB', 'PEN', 'PGK', 'PHP', 'PKR', 'PLN', 'PYG', 'QAR', 'RON', 'RSD', 'RUB', 'RWF', 'SAR', 'SBD', 'SCR', 'SDG', 'SEK', 'SGD', 'SHP', 'SLL', 'SOS', 'SRD', 'SSP', 'STN', 'SYP', 'SZL', 'THB', 'TJS', 'TMT', 'TND', 'TOP', 'TRY', 'TTD', 'TWD', 'TZS', 'UAH', 'UGX', 'USD', 'UYU', 'UZS', 'VES', 'VND', 'VUV', 'WST', 'XAF', 'XOF', 'YER', 'ZAR', 'ZMW', 'ZWL']),
  description: z.string().min(50, { message: 'Description must be at least 50 characters.' }),
  requirements: z.string().min(20, { message: 'Requirements must be at least 20 characters.' }),
  closingDate: z.date({
    required_error: "A closing date is required.",
  }),
  applicationEmail: z.string().email({ message: "Please enter a valid email." }).optional().or(z.literal('')),
  applicationWhatsApp: z.string().optional(),
});

function getCurrencySymbol(currency: string) {
    const symbols: { [key: string]: string } = {
        'USD': '$', 'EUR': '€', 'GBP': '£', 'JPY': '¥', 'CAD': 'CA$', 'DZD': 'DA', 'AOA': 'Kz', 'XOF': 'CFA',
        'BWP': 'P', 'BIF': 'FBu', 'CVE': 'Esc', 'XAF': 'CFA', 'KMF': 'CF', 'CDF': 'FC', 'DJF': 'Fdj',
        'EGP': 'E£', 'GQE': 'CFA', 'ERN': 'Nfk', 'SZL': 'L', 'ETB': 'Br', 'GMD': 'D', 'GHS': 'GH₵',
        'GNF': 'FG', 'GWP': 'CFA', 'KES': 'KSh', 'LSL': 'L', 'LRD': 'L$', 'LYD': 'LD', 'MGA': 'Ar',
        'MWK': 'MK', 'MRU': 'UM', 'MUR': '₨', 'MAD': 'DH', 'MZN': 'MT', 'NAD': 'N$', 'NGN': '₦',
        'RWF': 'FRw', 'STN': 'Db', 'SCR': '₨', 'SLL': 'Le', 'SOS': 'S', 'ZAR': 'R', 'SSP': '£',
        'SDG': '£', 'TZS': 'TSh', 'TND': 'DT', 'UGX': 'USh', 'ZMW': 'ZK', 'ZWL': '$', 'AED': 'د.إ',
        'AFN': '؋', 'ALL': 'L', 'AMD': '֏', 'ANG': 'ƒ', 'ARS': '$', 'AUD': 'A$', 'AWG': 'ƒ', 'AZN': '₼',
        'BAM': 'KM', 'BBD': 'Bds$', 'BDT': '৳', 'BGN': 'лв', 'BHD': '.د.ب', 'BMD': '$', 'BND': 'B$',
        'BOB': 'Bs.', 'BRL': 'R$', 'BSD': 'B$', 'BTN': 'Nu.', 'BYN': 'Br', 'BZD': 'BZ$', 'CHF': 'CHF',
        'CLP': '$', 'CNY': '¥', 'COP': '$', 'CRC': '₡', 'CUP': '$MN', 'CZK': 'Kč', 'DKK': 'kr',
        'DOP': 'RD$', 'FJD': 'FJ$', 'GEL': '₾', 'GIP': '£', 'GTQ': 'Q', 'GYD': 'G$', 'HKD': 'HK$',
        'HNL': 'L', 'HRK': 'kn', 'HTG': 'G', 'HUF': 'Ft', 'IDR': 'Rp', 'ILS': '₪', 'INR': '₹',
        'IQD': 'ع.د', 'IRR': '﷼', 'ISK': 'kr', 'JMD': 'J$', 'JOD': 'JD', 'KGS': 'сом', 'KHR': '៛',
        'KWD': 'K.D.', 'KZT': '₸', 'LAK': '₭', 'LBP': 'L£', 'LKR': 'Rs', 'MDL': 'L', 'MKD': 'ден',
        'MMK': 'K', 'MNT': '₮', 'MOP': 'P', 'MVR': 'Rf', 'MXN': 'Mex$', 'MYR': 'RM', 'NIO': 'C$',
        'NOK': 'kr', 'NPR': '₨', 'NZD': 'NZ$', 'OMR': '﷼', 'PAB': 'B/.', 'PEN': 'S/', 'PGK': 'K',
        'PHP': '₱', 'PKR': '₨', 'PLN': 'zł', 'PYG': '₲', 'QAR': '﷼', 'RON': 'lei', 'RSD': 'дин',
        'RUB': '₽', 'SAR': '﷼', 'SBD': 'Si$', 'SEK': 'kr', 'SGD': 'S$', 'SHP': '£', 'SRD': '$',
        'SYP': '£S', 'THB': '฿', 'TJS': 'SM', 'TMT': 'T', 'TOP': 'T$', 'TRY': '₺', 'TTD': 'TT$',
        'TWD': 'NT$', 'UAH': '₴', 'UYU': '$U', 'UZS': 'soʻm', 'VES': 'Bs.', 'VND': '₫', 'VUV': 'Vt',
        'WST': 'T', 'YER': '﷼'
    };
    return symbols[currency] || '$';
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

  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

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
        jobType: jobToEdit.type,
        workArrangement: jobToEdit.workArrangement || 'On-site',
        location: jobToEdit.location,
        salary: jobToEdit.salary,
        currency: jobToEdit.currency as any || 'USD',
        description: jobToEdit.description,
        requirements: Array.isArray(jobToEdit.requirements) ? jobToEdit.requirements.join('\n') : jobToEdit.requirements,
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
    
    try {
        const jobsCollection = collection(firestore, 'jobListings');
        const jobDocRef = editJobId ? doc(jobsCollection, editJobId) : doc(jobsCollection);
        const jobId = jobDocRef.id;

        const companyName = userProfile?.companyName || 'A Great Company';

        const jobData: any = {
            ...values,
            // id: jobId, // This is the important part
            location: values.workArrangement === 'Remote' ? 'Remote' : values.location,
            employerId: user.uid,
            postedDate: editJobId && jobToEdit ? jobToEdit.postedDate : new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'}),
            closingDate: values.closingDate.toISOString().split('T')[0],
            requirements: values.requirements.split('\n').filter(req => req.trim() !== ''),
            company: companyName,
            currencySymbol: getCurrencySymbol(values.currency),
        };
                
        if(!editJobId) {
            const companyLogos = PlaceHolderImages.filter(img => img.id.startsWith('company-logo'));
            const randomLogo = companyLogos[Math.floor(Math.random() * companyLogos.length)];
            
            jobData.logoUrl = randomLogo.imageUrl;
            jobData.logoBg = `bg-indigo-100`;
        }
        
        await setDocument(jobDocRef, { ...jobData, id: jobId }, { merge: true });
        
        toast({
            title: `Job ${editJobId ? 'Updated' : 'Posted'}!`,
            description: `Your job listing for ${jobData.title} has been successfully ${editJobId ? 'updated' : 'created'}.`,
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
                name="jobType"
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
                                <SelectItem value="AED">AED (د.إ)</SelectItem>
                                <SelectItem value="AFN">AFN (؋)</SelectItem>
                                <SelectItem value="ALL">ALL (L)</SelectItem>
                                <SelectItem value="AMD">AMD (֏)</SelectItem>
                                <SelectItem value="ANG">ANG (ƒ)</SelectItem>
                                <SelectItem value="AOA">AOA (Kz)</SelectItem>
                                <SelectItem value="ARS">ARS ($)</SelectItem>
                                <SelectItem value="AUD">AUD (A$)</SelectItem>
                                <SelectItem value="AWG">AWG (ƒ)</SelectItem>
                                <SelectItem value="AZN">AZN (₼)</SelectItem>
                                <SelectItem value="BAM">BAM (KM)</SelectItem>
                                <SelectItem value="BBD">BBD (Bds$)</SelectItem>
                                <SelectItem value="BDT">BDT (৳)</SelectItem>
                                <SelectItem value="BGN">BGN (лв)</SelectItem>
                                <SelectItem value="BHD">BHD (.د.ب)</SelectItem>
                                <SelectItem value="BIF">BIF (FBu)</SelectItem>
                                <SelectItem value="BMD">BMD ($)</SelectItem>
                                <SelectItem value="BND">BND (B$)</SelectItem>
                                <SelectItem value="BOB">BOB (Bs.)</SelectItem>
                                <SelectItem value="BRL">BRL (R$)</SelectItem>
                                <SelectItem value="BSD">BSD (B$)</SelectItem>
                                <SelectItem value="BTN">BTN (Nu.)</SelectItem>
                                <SelectItem value="BWP">BWP (P)</SelectItem>
                                <SelectItem value="BYN">BYN (Br)</SelectItem>
                                <SelectItem value="BZD">BZD (BZ$)</SelectItem>
                                <SelectItem value="CAD">CAD (CA$)</SelectItem>
                                <SelectItem value="CDF">CDF (FC)</SelectItem>
                                <SelectItem value="CHF">CHF (CHF)</SelectItem>
                                <SelectItem value="CLP">CLP ($)</SelectItem>
                                <SelectItem value="CNY">CNY (¥)</SelectItem>
                                <SelectItem value="COP">COP ($)</SelectItem>
                                <SelectItem value="CRC">CRC (₡)</SelectItem>
                                <SelectItem value="CUP">CUP ($MN)</SelectItem>
                                <SelectItem value="CVE">CVE (Esc)</SelectItem>
                                <SelectItem value="CZK">CZK (Kč)</SelectItem>
                                <SelectItem value="DJF">DJF (Fdj)</SelectItem>
                                <SelectItem value="DKK">DKK (kr)</SelectItem>
                                <SelectItem value="DOP">DOP (RD$)</SelectItem>
                                <SelectItem value="DZD">DZD (DA)</SelectItem>
                                <SelectItem value="EGP">EGP (E£)</SelectItem>
                                <SelectItem value="ERN">ERN (Nfk)</SelectItem>
                                <SelectItem value="ETB">ETB (Br)</SelectItem>
                                <SelectItem value="EUR">EUR (€)</SelectItem>
                                <SelectItem value="FJD">FJD (FJ$)</SelectItem>
                                <SelectItem value="GBP">GBP (£)</SelectItem>
                                <SelectItem value="GEL">GEL (₾)</SelectItem>
                                <SelectItem value="GHS">GHS (GH₵)</SelectItem>
                                <SelectItem value="GIP">GIP (£)</SelectItem>
                                <SelectItem value="GMD">GMD (D)</SelectItem>
                                <SelectItem value="GNF">GNF (FG)</SelectItem>
                                <SelectItem value="GQE">GQE (CFA)</SelectItem>
                                <SelectItem value="GTQ">GTQ (Q)</SelectItem>
                                <SelectItem value="GYD">GYD (G$)</SelectItem>
                                <SelectItem value="HKD">HKD (HK$)</SelectItem>
                                <SelectItem value="HNL">HNL (L)</SelectItem>
                                <SelectItem value="HRK">HRK (kn)</SelectItem>
                                <SelectItem value="HTG">HTG (G)</SelectItem>
                                <SelectItem value="HUF">HUF (Ft)</SelectItem>
                                <SelectItem value="IDR">IDR (Rp)</SelectItem>
                                <SelectItem value="ILS">ILS (₪)</SelectItem>
                                <SelectItem value="INR">INR (₹)</SelectItem>
                                <SelectItem value="IQD">IQD (ع.د)</SelectItem>
                                <SelectItem value="IRR">IRR (﷼)</SelectItem>
                                <SelectItem value="ISK">ISK (kr)</SelectItem>
                                <SelectItem value="JMD">JMD (J$)</SelectItem>
                                <SelectItem value="JOD">JOD (JD)</SelectItem>
                                <SelectItem value="JPY">JPY (¥)</SelectItem>
                                <SelectItem value="KES">KES (KSh)</SelectItem>
                                <SelectItem value="KGS">KGS (сом)</SelectItem>
                                <SelectItem value="KHR">KHR (៛)</SelectItem>
                                <SelectItem value="KMF">KMF (CF)</SelectItem>
                                <SelectItem value="KWD">KWD (K.D.)</SelectItem>
                                <SelectItem value="KZT">KZT (₸)</SelectItem>
                                <SelectItem value="LAK">LAK (₭)</SelectItem>
                                <SelectItem value="LBP">LBP (L£)</SelectItem>
                                <SelectItem value="LKR">LKR (Rs)</SelectItem>
                                <SelectItem value="LRD">LRD (L$)</SelectItem>
                                <SelectItem value="LSL">LSL (L)</SelectItem>
                                <SelectItem value="LYD">LYD (LD)</SelectItem>
                                <SelectItem value="MAD">MAD (DH)</SelectItem>
                                <SelectItem value="MDL">MDL (L)</SelectItem>
                                <SelectItem value="MGA">MGA (Ar)</SelectItem>
                                <SelectItem value="MKD">MKD (ден)</SelectItem>
                                <SelectItem value="MMK">MMK (K)</SelectItem>
                                <SelectItem value="MNT">MNT (₮)</SelectItem>
                                <SelectItem value="MOP">MOP (P)</SelectItem>
                                <SelectItem value="MRU">MRU (UM)</SelectItem>
                                <SelectItem value="MUR">MUR (₨)</SelectItem>
                                <SelectItem value="MVR">MVR (Rf)</SelectItem>
                                <SelectItem value="MWK">MWK (MK)</SelectItem>
                                <SelectItem value="MXN">MXN (Mex$)</SelectItem>
                                <SelectItem value="MYR">MYR (RM)</SelectItem>
                                <SelectItem value="MZN">MZN (MT)</SelectItem>
                                <SelectItem value="NAD">NAD (N$)</SelectItem>
                                <SelectItem value="NGN">NGN (₦)</SelectItem>
                                <SelectItem value="NIO">NIO (C$)</SelectItem>
                                <SelectItem value="NOK">NOK (kr)</SelectItem>
                                <SelectItem value="NPR">NPR (₨)</SelectItem>
                                <SelectItem value="NZD">NZD (NZ$)</SelectItem>
                                <SelectItem value="OMR">OMR (﷼)</SelectItem>
                                <SelectItem value="PAB">PAB (B/.)</SelectItem>
                                <SelectItem value="PEN">PEN (S/)</SelectItem>
                                <SelectItem value="PGK">PGK (K)</SelectItem>
                                <SelectItem value="PHP">PHP (₱)</SelectItem>
                                <SelectItem value="PKR">PKR (₨)</SelectItem>
                                <SelectItem value="PLN">PLN (zł)</SelectItem>
                                <SelectItem value="PYG">PYG (₲)</SelectItem>
                                <SelectItem value="QAR">QAR (﷼)</SelectItem>
                                <SelectItem value="RON">RON (lei)</SelectItem>
                                <SelectItem value="RSD">RSD (дин)</SelectItem>
                                <SelectItem value="RUB">RUB (₽)</SelectItem>
                                <SelectItem value="RWF">RWF (FRw)</SelectItem>
                                <SelectItem value="SAR">SAR (﷼)</SelectItem>
                                <SelectItem value="SBD">SBD (Si$)</SelectItem>
                                <SelectItem value="SCR">SCR (₨)</SelectItem>
                                <SelectItem value="SDG">SDG (£)</SelectItem>
                                <SelectItem value="SEK">SEK (kr)</SelectItem>
                                <SelectItem value="SGD">SGD (S$)</SelectItem>
                                <SelectItem value="SHP">SHP (£)</SelectItem>
                                <SelectItem value="SLL">SLL (Le)</SelectItem>
                                <SelectItem value="SOS">SOS (S)</SelectItem>
                                <SelectItem value="SRD">SRD ($)</SelectItem>
                                <SelectItem value="SSP">SSP (£)</SelectItem>
                                <SelectItem value="STN">STN (Db)</SelectItem>
                                <SelectItem value="SYP">SYP (£S)</SelectItem>
                                <SelectItem value="SZL">SZL (L)</SelectItem>
                                <SelectItem value="THB">THB (฿)</SelectItem>
                                <SelectItem value="TJS">TJS (SM)</SelectItem>
                                <SelectItem value="TMT">TMT (T)</SelectItem>
                                <SelectItem value="TND">TND (DT)</SelectItem>
                                <SelectItem value="TOP">TOP (T$)</SelectItem>
                                <SelectItem value="TRY">TRY (₺)</SelectItem>
                                <SelectItem value="TTD">TTD (TT$)</SelectItem>
                                <SelectItem value="TWD">TWD (NT$)</SelectItem>
                                <SelectItem value="TZS">TZS (TSh)</SelectItem>
                                <SelectItem value="UAH">UAH (₴)</SelectItem>
                                <SelectItem value="UGX">UGX (USh)</SelectItem>
                                <SelectItem value="USD">USD ($)</SelectItem>
                                <SelectItem value="UYU">UYU ($U)</SelectItem>
                                <SelectItem value="UZS">UZS (soʻm)</SelectItem>
                                <SelectItem value="VES">VES (Bs.)</SelectItem>
                                <SelectItem value="VND">VND (₫)</SelectItem>
                                <SelectItem value="VUV">VUV (Vt)</SelectItem>
                                <SelectItem value="WST">WST (T)</SelectItem>
                                <SelectItem value="XAF">XAF (CFA)</SelectItem>
                                <SelectItem value="XOF">XOF (CFA)</SelectItem>
                                <SelectItem value="YER">YER (﷼)</SelectItem>
                                <SelectItem value="ZAR">ZAR (R)</SelectItem>
                                <SelectItem value="ZMW">ZMW (ZK)</SelectItem>
                                <SelectItem value="ZWL">ZWL ($)</SelectItem>
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
