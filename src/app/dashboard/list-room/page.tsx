
'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useUser } from '@/firebase';
import { addDoc, collection } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { countries } from '@/lib/countries';
import { handleFirebaseError } from '@/firebase/error-handler';

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
import { Loader2, Trash2, Upload } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const amenitiesList = ["Wifi", "TV", "Kitchen", "Air Conditioning", "Heating", "Washer", "Dryer"];

const MAX_IMAGE_SIZE = 500 * 1024; // 500KB per image
const MAX_TOTAL_SIZE = 4 * 1024 * 1024; // 4MB total for all images
const MAX_IMAGES = 5;

const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});

const fileArraySchema = z.array(z.instanceof(File))
  .min(1, 'At least one image is required.')
  .max(MAX_IMAGES, `You can upload a maximum of ${MAX_IMAGES} images.`)
  .refine(files => files.every(file => file.size <= MAX_IMAGE_SIZE), {
    message: `Each image must be less than ${MAX_IMAGE_SIZE / 1024}KB.`,
  })
  .refine(files => files.reduce((acc, file) => acc + file.size, 0) <= MAX_TOTAL_SIZE, {
    message: `Total size of images must be less than ${MAX_TOTAL_SIZE / (1024 * 1024)}MB.`,
  });

const formSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters long.'),
  description: z.string().min(20, 'Description must be at least 20 characters long.'),
  location: z.string().min(2, 'Location is required.'),
  price: z.coerce.number().min(1, 'Price must be greater than 0.'),
  currencyInfo: z.string().min(1, 'Currency is required.'),
  images: fileArraySchema,
  amenities: z.array(z.string()).min(1, 'Select at least one amenity.'),
});

type ListRoomFormValues = z.infer<typeof formSchema>;

export default function ListRoomPage() {
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ListRoomFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      price: 0,
      currencyInfo: 'US',
      images: [],
      amenities: [],
    },
  });

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [isUserLoading, user, router]);

  const onSubmit = async (data: ListRoomFormValues) => {
    if (!user || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to list a room.',
      });
      return;
    }
    setIsLoading(true);

    try {
      const imageUrls = await Promise.all(data.images.map(image => toBase64(image)));
      
      const ownerName = user.displayName || `${user.firstName} ${user.lastName}`.trim() || 'Anonymous';
      const selectedCountry = countries.find(c => c.code === data.currencyInfo);
      const currency = selectedCountry?.currency || 'USD';
      const currencySymbol = selectedCountry?.currencySymbol || '$';

      await addDoc(collection(firestore, 'rooms'), {
        ownerId: user.uid,
        ownerName: ownerName,
        title: data.title,
        description: data.description,
        location: data.location,
        price: data.price,
        currency,
        currencySymbol,
        images: imageUrls,
        amenities: data.amenities,
        createdAt: new Date(),
      });

      toast({
        title: 'Room Listed!',
        description: 'Your room is now available for booking.',
      });
      router.push('/dashboard');
    } catch (error: any) {
      handleFirebaseError(error, toast);
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
    <div className="container max-w-3xl py-12">
      <Card>
        <CardHeader>
          <CardTitle>List a New Room</CardTitle>
          <CardDescription>Fill out the details below to put your space on the market.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room Title</FormLabel>
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
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Paris, France" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                    control={form.control}
                    name="currencyInfo"
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
                            {countries.map(country => (
                              <SelectItem key={country.code} value={country.code}>
                                {country.name} ({country.currency})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </div>
               <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price per night</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="100" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

               <FormField
                control={form.control}
                name="images"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>Room Images</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          const currentFiles = form.getValues('images');
                          if (currentFiles.length + files.length > MAX_IMAGES) {
                              toast({ variant: 'destructive', title: 'Too many images', description: `You can only upload up to ${MAX_IMAGES} images.` });
                              return;
                          }
                           form.setValue('images', [...currentFiles, ...files], { shouldValidate: true });
                        }}
                        className="hidden"
                        id="image-upload"
                      />
                    </FormControl>
                    <label htmlFor="image-upload" className="flex items-center justify-center w-full p-6 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted">
                        <div className="text-center">
                            <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                            <p className="mt-2 text-sm text-muted-foreground">Click or drag to upload images</p>
                        </div>
                    </label>
                    <FormDescription>
                        Up to {MAX_IMAGES} images. Each under 500KB. Total under 4MB.
                    </FormDescription>
                    {fieldState.error && <FormMessage />}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                        {form.watch('images').map((file, index) => (
                           <div key={index} className="relative group">
                                <img src={URL.createObjectURL(file)} alt={`preview ${index}`} className="w-full h-24 object-cover rounded-md" />
                                <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => {
                                    const currentImages = form.getValues('images');
                                    const updatedImages = currentImages.filter((_, i) => i !== index);
                                    form.setValue('images', updatedImages, { shouldValidate: true });
                                }}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                           </div>
                        ))}
                    </div>
                  </FormItem>
                )}
              />

                <FormField
                control={form.control}
                name="amenities"
                render={() => (
                    <FormItem>
                    <div className="mb-4">
                        <FormLabel className="text-base">Amenities</FormLabel>
                        <FormDescription>
                        Select the amenities available in your room.
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
                                        ? field.onChange([...field.value, amenity])
                                        : field.onChange(
                                            field.value?.filter(
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
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'List My Room'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
