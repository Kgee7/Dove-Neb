
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useFirestore, useUser, useStorage } from '@/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { currencies } from '@/lib/currencies';
import { v4 as uuidv4 } from 'uuid';

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
import { Loader2, Trash2, Upload, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useDoc } from '@/firebase';

const amenitiesList = ["Wifi", "TV", "Kitchen", "Air Conditioning", "Heating", "Washer", "Dryer"];

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB per image
const MAX_IMAGES = 12;

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
  contactEmail: z.string().email().optional().or(z.literal('')),
  contactWhatsapp: z.string().optional(),
  images: z.array(z.any()).min(1, 'At least one image is required.').max(MAX_IMAGES, `You can upload a maximum of ${MAX_IMAGES} images.`),
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


type ListRoomFormValues = z.infer<typeof formSchema>;

type UserProfile = {
  firstName: string;
  lastName: string;
};

export default function ListRoomPage() {
  const firestore = useFirestore();
  const storage = useStorage();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [newAmenity, setNewAmenity] = useState('');

  const userDocRef = useMemo(() => {
      if (!firestore || !user?.uid) return null;
      return doc(firestore, 'users', user.uid);
  }, [firestore, user?.uid]);
  
  const { data: userProfile } = useDoc<UserProfile>(userDocRef);

  const form = useForm<ListRoomFormValues>({
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
      images: [],
      amenities: [],
      contactEmail: '',
      contactWhatsapp: '',
    },
  });

  const listingType = form.watch('listingType');
  const watchedImages = form.watch('images');

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [isUserLoading, user, router]);

  useEffect(() => {
    if (watchedImages) {
      const newPreviews = watchedImages.map(file => URL.createObjectURL(file));
      setImagePreviews(newPreviews);
      
      return () => {
        newPreviews.forEach(url => URL.revokeObjectURL(url));
      };
    }
  }, [watchedImages]);

  const handleAddAmenity = () => {
    const currentAmenities = form.getValues('amenities') || [];
    if (newAmenity.trim() && !currentAmenities.find(a => a.toLowerCase() === newAmenity.trim().toLowerCase())) {
        form.setValue('amenities', [...currentAmenities, newAmenity.trim()], { shouldValidate: true });
        setNewAmenity('');
    }
  };

  const handleRemoveAmenity = (amenityToRemove: string) => {
      const currentAmenities = form.getValues('amenities') || [];
      form.setValue('amenities', currentAmenities.filter(a => a !== amenityToRemove), { shouldValidate: true });
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const currentImages = form.getValues('images');
    if (currentImages.length + files.length > MAX_IMAGES) {
        toast({ variant: 'destructive', title: 'Too many images', description: `You can only upload up to ${MAX_IMAGES} images.` });
        return;
    }

    const oversizedFiles = files.filter(file => file.size > MAX_IMAGE_SIZE);
    if (oversizedFiles.length > 0) {
        toast({
            variant: 'destructive',
            title: 'Image too large',
            description: `Each image must be less than ${MAX_IMAGE_SIZE / (1024*1024)}MB.`
        });
        return;
    }

    form.setValue('images', [...currentImages, ...files], { shouldValidate: true });
  };
  
  const handleRemoveImage = (indexToRemove: number) => {
      const currentImages = form.getValues('images');
      const updatedImages = currentImages.filter((_, i) => i !== indexToRemove);
      form.setValue('images', updatedImages, { shouldValidate: true });
  };

  const onSubmit = async (data: ListRoomFormValues) => {
    if (!user || !firestore || !storage || !userProfile) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to list a room.',
      });
      return;
    }
    setIsLoading(true);

    try {
        const newRoomRef = doc(collection(firestore, "rooms"));
        const roomId = newRoomRef.id;

        const imageUrls = await Promise.all(
          data.images.map(async (file: File) => {
            const fileExtension = file.name.split('.').pop();
            const fileName = `${uuidv4()}.${fileExtension}`;
            const imageStorageRef = storageRef(storage, `rooms/${roomId}/${fileName}`);
            await uploadBytes(imageStorageRef, file);
            return getDownloadURL(imageStorageRef);
          })
        );
        
        const ownerName = `${userProfile.firstName} ${userProfile.lastName}`.trim();
        const selectedCurrency = currencies.find(c => c.code === data.currency);
        const currency = selectedCurrency?.code || 'USD';
        const currencySymbol = selectedCurrency?.symbol || '$';

        const roomData = {
          id: roomId,
          ownerId: user.uid,
          ownerName: ownerName,
          listingType: data.listingType,
          title: data.title,
          description: data.description,
          country: data.country,
          location: data.location,
          priceNight: data.priceNight || null,
          priceMonth: data.priceMonth || null,
          salePrice: data.salePrice || null,
          currency,
          currencySymbol,
          contactEmail: data.contactEmail || null,
          contactWhatsapp: data.contactWhatsapp || null,
          images: imageUrls,
          amenities: data.amenities || [],
          createdAt: new Date(),
        };
        
        await setDoc(newRoomRef, roomData);

        toast({
            title: 'Room Listed!',
            description: 'Your room is now available.',
        });
        router.push('/dashboard');
    } catch (error: any) {
        console.error("Error listing room: ", error);
        toast({
            variant: "destructive",
            title: "Listing Failed",
            description: error.message || "An unexpected error occurred."
        })
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
      <div className="container max-w-3xl py-12">
        <Card>
          <CardHeader>
            <CardTitle>List Your Space</CardTitle>
            <CardDescription>Fill out the details below to put your space on the market.</CardDescription>
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
                            defaultValue={field.value}
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

              {listingType === 'rent' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="priceNight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price per Night</FormLabel>
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
                            <FormLabel>Price per Month</FormLabel>
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
                          <FormLabel>Contact Email</FormLabel>
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
                          <FormLabel>WhatsApp Number</FormLabel>
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
                  name="images"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>Room Images</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                          id="image-upload"
                          disabled={isLoading}
                        />
                      </FormControl>
                      <label htmlFor="image-upload" className="flex items-center justify-center w-full p-6 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted">
                          <div className="text-center">
                              <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
                              <p className="mt-2 text-sm text-muted-foreground">Click or drag to upload images</p>
                          </div>
                      </label>
                      <FormDescription>
                          Up to {MAX_IMAGES} images. Each under {MAX_IMAGE_SIZE / (1024*1024)}MB.
                      </FormDescription>
                      {fieldState.error && <FormMessage />}
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                          {imagePreviews.map((previewUrl, index) => (
                            <div key={index} className="relative group">
                                  <img src={previewUrl} alt={`preview ${index}`} className="w-full h-24 object-cover rounded-md" />
                                  <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => handleRemoveImage(index)}>
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
                      render={({ field }) => (
                          <FormItem>
                          <div className="mb-4">
                              <FormLabel className="text-base">Amenities</FormLabel>
                              <FormDescription>
                              Select from the list or add your own.
                              </FormDescription>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {amenitiesList.map((amenity) => (
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
                                              (field.value || []).filter(
                                              (value) => value !== amenity
                                              )
                                          );
                                      }}
                                  />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                  {amenity}
                                  </FormLabel>
                              </FormItem>
                              ))}
                          </div>
                          
                          <div className="flex items-center gap-2 mt-4">
                              <Input
                                  placeholder="e.g., Free Parking"
                                  value={newAmenity}
                                  onChange={(e) => setNewAmenity(e.target.value)}
                                  onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                          e.preventDefault();
                                          handleAddAmenity();
                                      }
                                  }}
                              />
                              <Button type="button" onClick={handleAddAmenity}>Add</Button>
                          </div>

                          <FormMessage />
                          
                          {field.value && field.value.length > 0 && (
                              <div className="mt-4 border-t pt-4">
                                  <h4 className="text-sm font-medium mb-2">Selected amenities:</h4>
                                  <div className="flex flex-wrap gap-2">
                                      {field.value.map(amenity => (
                                          <Badge key={amenity} variant="secondary" className="flex items-center gap-1.5 py-1 px-2">
                                              {amenity}
                                              <button type="button" onClick={() => handleRemoveAmenity(amenity)} className="rounded-full hover:bg-muted-foreground/20 p-0.5 focus:outline-none focus:ring-1 focus:ring-ring">
                                                  <X className="h-3 w-3" />
                                              </button>
                                          </Badge>
                                      ))}
                                  </div>
                              </div>
                          )}

                          </FormItem>
                      )}
                  />

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'List My Space'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
