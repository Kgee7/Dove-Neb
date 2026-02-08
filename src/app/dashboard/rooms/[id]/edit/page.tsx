
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useUser, useDoc } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Room } from '@/lib/data';
import { currencies, Currency } from '@/lib/currencies';

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
import { Loader2, Trash2, Upload, ArrowLeft } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import Link from 'next/link';

const amenitiesList = ["Wifi", "TV", "Kitchen", "Air Conditioning", "Heating", "Washer", "Dryer"];

const formSchema = z.object({
  listingType: z.enum(['rent', 'sale'], { required_error: 'Please select a listing type.' }),
  title: z.string().min(5, 'Title must be at least 5 characters long.'),
  description: z.string().min(20, 'Description must be at least 20 characters long.'),
  country: z.string().min(2, 'Country is required.'),
  location: z.string().min(2, 'City/State is required.'),
  currency: z.string().min(1, 'Currency is required.'),
  priceNight: z.coerce.number().min(0).optional(),
  priceMonth: z.coerce.number().min(0).optional(),
  salePrice: z.coerce.number().min(0).optional(),
  contactEmail: z.string().email().optional(),
  contactWhatsapp: z.string().optional(),
  amenities: z.array(z.string()).optional(),
}).refine(data => {
    if (data.listingType === 'rent') return data.priceNight || data.priceMonth;
    return true;
}, {
    message: 'For rentals, you must provide at least a nightly or monthly price.',
    path: ['priceNight'],
}).refine(data => {
    if (data.listingType === 'sale') return data.salePrice;
    return true;
}, {
    message: 'For sales, you must provide a price.',
    path: ['salePrice'],
});

type EditRoomFormValues = z.infer<typeof formSchema>;

export default function EditRoomPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const roomDocRef = useMemo(() => {
    if (!firestore || !id) return null;
    return doc(firestore, 'rooms', id);
  }, [firestore, id]);

  const { data: room, isLoading: isRoomLoading } = useDoc<Room>(roomDocRef);

  const form = useForm<EditRoomFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      listingType: 'rent',
      title: '',
      description: '',
      country: '',
      location: '',
      currency: 'USD',
      priceNight: undefined,
      priceMonth: undefined,
      salePrice: undefined,
      amenities: [],
    },
  });

  useEffect(() => {
    if (room) {
      if (user?.uid !== room.ownerId) {
        toast({ variant: 'destructive', title: 'Unauthorized', description: 'You cannot edit this room.' });
        router.push('/dashboard');
        return;
      }
      form.reset({
        ...room,
        country: (room as any).country || '',
        currency: room.currency || 'USD',
        priceNight: room.priceNight || undefined,
        priceMonth: room.priceMonth || undefined,
        salePrice: room.salePrice || undefined,
        contactEmail: room.contactEmail || '',
        contactWhatsapp: room.contactWhatsapp || '',
      });
    }
  }, [room, user, router, form, toast]);

  const onSubmit = async (data: EditRoomFormValues) => {
    if (!user || !roomDocRef) return;
    setIsLoading(true);

    try {
        const selectedCurrency = currencies.find(c => c.code === data.currency);
        const currency = selectedCurrency?.code || 'USD';
        const currencySymbol = selectedCurrency?.symbol || '$';

        await updateDoc(roomDocRef, {
          ...data,
          priceNight: data.priceNight || null,
          priceMonth: data.priceMonth || null,
          salePrice: data.salePrice || null,
          currency,
          currencySymbol,
        });

        toast({
            title: 'Room Updated!',
            description: 'Your listing has been successfully updated.',
        });
        router.push('/dashboard');
    } catch (error: any) {
        console.error("Error updating room: ", error);
        toast({
            variant: "destructive",
            title: "Update Failed",
            description: error.message || "An unexpected error occurred."
        })
    } finally {
        setIsLoading(false);
    }
  };

  if (isUserLoading || isRoomLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="container py-12 text-center">
        <h1 className="text-3xl font-bold">Room not found</h1>
        <Link href="/dashboard">
          <Button variant="link" className="mt-4">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }
  
  const listingType = form.watch('listingType');

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
          <CardTitle>Edit Your Space</CardTitle>
          <CardDescription>Update the details for your space listing.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
               <FormField
                  control={form.control}
                  name="listingType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>What are you listing?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="grid grid-cols-2 gap-4"
                        >
                          <FormItem>
                            <FormControl>
                              <RadioGroupItem value="rent" id="rent" className="peer sr-only" />
                            </FormControl>
                            <Label
                              htmlFor="rent"
                              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                            >
                              For Rent
                            </Label>
                          </FormItem>
                          <FormItem>
                            <FormControl>
                              <RadioGroupItem value="sale" id="sale" className="peer sr-only" />
                            </FormControl>
                            <Label
                              htmlFor="sale"
                              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                            >
                              For Sale
                            </Label>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Cozy Downtown Apartment" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell guests about your space..."
                        className="min-h-[120px]"
                        {...field}
                      />
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
                        <Input placeholder="e.g., France" {...field} />
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
                        <Input placeholder="e.g., Paris" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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

            {listingType === 'rent' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="priceNight"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price per Night (Optional)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="100" {...field} value={field.value ?? ''}/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="priceMonth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price per Month (Optional)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="2000" {...field} value={field.value ?? ''}/>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>
            )}

            {listingType === 'sale' && (
                 <FormField
                  control={form.control}
                  name="salePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sale Price</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="250000" {...field} value={field.value ?? ''}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            )}
              
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Contact Email (Optional)</FormLabel>
                        <FormControl>
                        <Input placeholder="contact@example.com" {...field} value={field.value ?? ''}/>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="contactWhatsapp"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>WhatsApp Number (Optional)</FormLabel>
                        <FormControl>
                        <Input placeholder="+1 123 456 7890" {...field} value={field.value ?? ''}/>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
            
             <FormField
                control={form.control}
                name="amenities"
                render={() => (
                    <FormItem>
                    <div className="mb-4">
                        <FormLabel className="text-base">Amenities</FormLabel>
                        <FormDescription>
                        Select the amenities available.
                        </FormDescription>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {amenitiesList.map((amenity) => (
                        <FormField
                        key={amenity}
                        control={form.control}
                        name="amenities"
                        render={({ field }) => {
                            return (
                            <FormItem
                                key={amenity}
                                className="flex flex-row items-start space-x-3 space-y-0"
                            >
                                <FormControl>
                                <Checkbox
                                    checked={field.value?.includes(amenity)}
                                    onCheckedChange={(checked) => {
                                    return checked
                                        ? field.onChange([...(field.value || []), amenity])
                                        : field.onChange(
                                            (field.value || [])?.filter(
                                            (value) => value !== amenity
                                            )
                                        )
                                    }}
                                />
                                </FormControl>
                                <FormLabel className="font-normal">
                                {amenity}
                                </FormLabel>
                            </FormItem>
                            )
                        }}
                        />
                    ))}
                    </div>
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
