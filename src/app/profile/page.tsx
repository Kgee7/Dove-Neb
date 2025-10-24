
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUser, useDoc, useFirestore, useFirebaseApp, updateProfile } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'next/navigation';
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
import { Loader2, Edit, Upload, ArrowLeft } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type UserProfile = {
    userType: 'seeker' | 'employer' | 'renter' | 'owner';
    firstName: string;
    lastName:string;
    preferredName?: string;
    email: string;
    photoURL?: string | null;
    resumeURL?: string;
};

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  preferredName: z.string().optional(),
});

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const firebaseApp = useFirebaseApp();
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  const userDocRef = useMemo(() => user?.uid && firestore ? doc(firestore, 'users', user.uid) : null, [user?.uid, firestore]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      preferredName: '',
    },
  });

  useEffect(() => {
    if (userProfile) {
      form.reset({
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        preferredName: userProfile.preferredName || '',
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
        if (!file || !user || !userDocRef) return;

        setUploading(true);

        try {
          const storage = getStorage(firebaseApp);
          const storageRef = ref(storage, `profilePictures/${user.uid}/${file.name}`);
          const snapshot = await uploadBytes(storageRef, file, { customMetadata: { owner: user.uid } });
          const downloadURL = await getDownloadURL(snapshot.ref);
          
          if (user) {
            await updateProfile(user, { photoURL: downloadURL });
          }

          await updateDoc(userDocRef, { photoURL: downloadURL });

          toast({
            title: 'Profile Picture Updated',
            description: 'Your new avatar has been saved.',
          });
        } catch (error: any) {
          console.error('Error uploading file:', error);
          let errorMessage = 'Could not upload your profile picture.';
          if (error.code) { // Check for Firebase Storage specific error codes
            errorMessage = `Upload Failed: ${error.code}. ${error.message}`;
            if (error.code === 'storage/unauthorized') {
              errorMessage = 'Permission denied. Check Firebase Storage Security Rules.'; // Specific message for permissions [9, 11, 32]
            } else if (error.code === 'storage/quota-exceeded') {
              errorMessage = 'Storage quota exceeded. Please upgrade your plan or delete some files.'; // For quota issues [9, 34]
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
      
      const handleResumeFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user || !userDocRef) return;

        const allowedResumeTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedResumeTypes.includes(file.type)) {
            toast({
                variant: 'destructive',
                title: 'Invalid File Type',
                description: 'Resume must be a PDF or Word document (DOC, DOCX).',
            });
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast({
                variant: 'destructive',
                title: 'File Too Large',
                description: 'Resume file must be less than 5MB.',
            });
            return;
        }

        setUploadingResume(true);

        try {
          const storage = getStorage(firebaseApp);
          const storageRef = ref(storage, `resumes/${user.uid}/${file.name}`);
          const snapshot = await uploadBytes(storageRef, file, { customMetadata: { owner: user.uid } });
          const downloadURL = await getDownloadURL(snapshot.ref);

          await updateDoc(userDocRef, { resumeURL: downloadURL });

          toast({
            title: 'Resume Uploaded',
            description: 'Your resume has been saved successfully.',
          });
        } catch (error: any) { // Consider more specific error types or cast to Error
          console.error('Error uploading resume:', error);
          let errorMessage = 'Could not upload your resume.';
          if (error.code) { // Check for Firebase Storage specific error codes
            errorMessage = `Upload Failed: ${error.code}. ${error.message}`;
             if (error.code === 'storage/unauthorized') {
              errorMessage = 'Permission denied. Check Firebase Storage Security Rules.'; // Specific message for permissions [9, 11, 32]
            } else if (error.code === 'storage/quota-exceeded') {
              errorMessage = 'Storage quota exceeded. Please upgrade your plan or delete some files.'; // For quota issues [9, 34]
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
          setUploadingResume(false);
        }
      };


  async function onSubmit(values: z.infer<typeof profileSchema>) {
    if (!userDocRef) return;
    setLoading(true);

    const dataToUpdate = {
      firstName: values.firstName,
      lastName: values.lastName,
      preferredName: values.preferredName,
    };
    
    try {
        await updateDoc(userDocRef, dataToUpdate);
        toast({
            title: 'Profile Updated',
            description: 'Your profile information has been saved successfully.',
        });
    } catch(error: any) {
        console.error('Error updating profile:', error);
        toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: error.message || 'Could not save your profile.',
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

  const photoURL = user?.photoURL || userProfile?.photoURL;

  return (
    <div className="container max-w-2xl py-12">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle>My Profile</CardTitle>
              <CardDescription>
                Manage your personal information and settings.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="relative group">
                <Avatar className="h-24 w-24">
                   {photoURL && <AvatarImage src={photoURL} alt="Profile picture" />}
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
                <FormField
                    control={form.control}
                    name="preferredName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Preferred Name</FormLabel>
                        <FormControl>
                            <Input placeholder="Johnny" {...field} value={field.value ?? ''} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                        <Input value={userProfile?.email || ''} disabled />
                    </FormControl>
                </FormItem>
                
                {userProfile?.userType === 'seeker' && (
                    <Card>
                        <CardHeader>
                            <CardTitle className='text-lg'>Resume</CardTitle>
                            <CardDescription>Your resume is used for job applications.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-4">
                                {userProfile.resumeURL ? (
                                    <a href={userProfile.resumeURL} target="_blank" rel="noopener noreferrer" className="text-primary underline">
                                        View Current Resume
                                    </a>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No resume uploaded.</p>
                                )}
                                <Button type="button" onClick={() => resumeInputRef.current?.click()} disabled={uploadingResume}>
                                    {uploadingResume ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                    {userProfile.resumeURL ? 'Replace Resume' : 'Upload Resume'}
                                </Button>
                            </div>
                             <input
                                type="file"
                                ref={resumeInputRef}
                                onChange={handleResumeFileChange}
                                className="hidden"
                                accept=".pdf,.doc,.docx"
                            />
                        </CardContent>
                    </Card>
                )}
              
              <div className="flex justify-end">
                <Button type="submit" disabled={loading || uploading}>
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

    