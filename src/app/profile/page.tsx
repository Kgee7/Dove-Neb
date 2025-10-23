
'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUser, useDoc, useFirestore, useFirebaseApp, updateProfile } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';

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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, Edit } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type UserProfile = {
    userType: 'renter' | 'owner';
    firstName: string;
    lastName: string;
    email: string;
    photoURL?: string;
};

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
});

export default function ProfilePage() {
  const { user, isLoading: isUserLoading } = useUser();
  const firestore = useFirestore();
  const firebaseApp = useFirebaseApp();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const userDocRef = useMemo(() => user && firestore ? doc(firestore, 'users', user.uid) : null, [user, firestore]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
    },
  });

  useEffect(() => {
    if (userProfile) {
      form.reset({
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
      });
    }
  }, [userProfile, form]);

  const getInitials = (firstName?: string, lastName?: string) => {
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`;
    }
    if (firstName) {
      return firstName.substring(0, 2);
    }
    if (user?.email) {
        return user.email.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !userDocRef || !firebaseApp) return;

    setUploading(true);

    try {
      const storage = getStorage(firebaseApp);
      const storageRef = ref(storage, `profilePictures/${user.uid}/${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      if (user) {
        await updateProfile(user, { photoURL: downloadURL });
      }
      await user?.reload(); 
      await setDoc(userDocRef, { photoURL: downloadURL }, { merge: true });

      toast({
        title: 'Profile Picture Updated',
        description: 'Your new avatar has been saved.',
      });
    } catch (error: any) {
      console.error('Error uploading file:', error);
      let errorMessage = 'Could not upload your profile picture.';
      if (error.code) {
        errorMessage = `Upload Failed: ${error.code}. ${error.message}`;
        if (error.code === 'storage/unauthorized') {
          errorMessage = 'Permission denied. Check Firebase Storage Security Rules.';
        } else if (error.code === 'storage/quota-exceeded') {
          errorMessage = 'Storage quota exceeded. Please upgrade your plan or delete some files.';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: errorMessage,
      });
    } finally {
      setUploading(false);
    }
  };


  async function onSubmit(values: z.infer<typeof profileSchema>) {
    if (!userDocRef) return;
    setLoading(true);

    const dataToUpdate: Partial<UserProfile> = {
      firstName: values.firstName,
      lastName: values.lastName,
    };

    try {
      await setDoc(userDocRef, dataToUpdate, { merge: true });
      toast({
        title: 'Profile Updated',
        description: 'Your profile information has been saved successfully.',
      });
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'Could not update your profile.',
      });
    } finally {
      setLoading(false);
    }
  }

  if (isProfileLoading || isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-12">
      <Card>
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
          <CardDescription>
            Manage your personal information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="relative group">
                <Avatar className="h-24 w-24">
                    <AvatarImage src={user?.photoURL || userProfile?.photoURL || ''} alt="Profile picture" />
                    <AvatarFallback className="text-3xl">
                        {getInitials(userProfile?.firstName, userProfile?.lastName)}
                    </AvatarFallback>
                </Avatar>
                {uploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                        <Loader2 className="h-8 w-8 animate-spin text-white" />
                    </div>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute bottom-0 right-0 rounded-full h-8 w-8 bg-muted group-hover:bg-accent group-hover:text-accent-foreground"
                    onClick={handleAvatarClick}
                    disabled={uploading}
                >
                    <Edit className="h-4 w-4" />
                </Button>
            </div>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/png, image/jpeg, image/gif"
            />
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                                <Input placeholder="John" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                        <Input value={userProfile?.email || ''} disabled />
                    </FormControl>
                    <FormMessage />
                </FormItem>
              
              <div className="flex justify-end">
                <Button type="submit" className="bg-accent hover:bg-accent/90" disabled={loading || uploading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
