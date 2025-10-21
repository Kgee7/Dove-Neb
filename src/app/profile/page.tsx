
'use client';

import React, { useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useUser, useDoc, useFirestore, useFirebaseApp, updateProfile, setDoc, getStorage, ref, uploadBytes, getDownloadURL } from '@/firebase';
import { doc } from 'firebase/firestore';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2, Edit, FileText, Upload } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';

type UserProfile = {
    userType: 'seeker' | 'employer';
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    companyName?: string;
    photoURL?: string;
    resumeURL?: string;
    skills?: string[];
    experience?: string;
};

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  skills: z.string().optional(),
  experience: z.string().optional(),
});

export default function ProfilePage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const firebaseApp = useFirebaseApp();
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [uploadingResume, setUploadingResume] = React.useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  const userDocRef = useMemo(() => user ? doc(firestore, 'users', user.uid) : null, [user, firestore]);

  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      phone: '',
      companyName: '',
      skills: '',
      experience: '',
    },
  });

  useEffect(() => {
    if (userProfile) {
      form.reset({
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
        phone: userProfile.phone || '',
        companyName: userProfile.companyName || '',
        skills: userProfile.skills?.join(', ') || '',
        experience: userProfile.experience || '',
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
      const storageRef = ref(storage, `profile-pictures/${user.uid}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      await updateProfile(user, { photoURL: downloadURL });
      await user.reload(); 
      await setDoc(userDocRef, { photoURL: downloadURL }, { merge: true });

      toast({
        title: 'Profile Picture Updated',
        description: 'Your new avatar has been saved.',
      });
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error.message || 'Could not upload your profile picture.',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleResumeFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user || !userDocRef) return;

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
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      await setDoc(userDocRef, { resumeURL: downloadURL }, { merge: true });

      toast({
        title: 'Resume Uploaded',
        description: 'Your resume has been saved successfully.',
      });
    } catch (error: any) {
      console.error('Error uploading resume:', error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error.message || 'Could not upload your resume.',
      });
    } finally {
      setUploadingResume(false);
    }
  };

  async function onSubmit(values: z.infer<typeof profileSchema>) {
    if (!userDocRef) return;
    setLoading(true);

    const dataToUpdate: Partial<UserProfile> = {
      firstName: values.firstName,
      lastName: values.lastName,
      phone: values.phone,
    };

    if (userProfile?.userType === 'employer') {
        dataToUpdate.companyName = values.companyName;
    }

    if (userProfile?.userType === 'seeker') {
        dataToUpdate.skills = values.skills?.split(',').map(s => s.trim()).filter(Boolean) || [];
        dataToUpdate.experience = values.experience;
    }


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
            Manage your personal and company information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4 mb-8">
            <div className="relative group">
                <Avatar className="h-24 w-24">
                    <AvatarImage src={user?.photoURL || ''} alt="Profile picture" />
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
                <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Phone Number (Optional)</FormLabel>
                        <FormControl>
                            <Input placeholder="+1 234 567 890" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                {userProfile?.userType === 'employer' && (
                     <FormField
                        control={form.control}
                        name="companyName"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Company Name</FormLabel>
                            <FormControl>
                                <Input placeholder="Acme Inc." {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                )}

                {userProfile?.userType === 'seeker' && (
                    <>
                        <FormField
                            control={form.control}
                            name="skills"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Skills</FormLabel>
                                <FormControl>
                                    <Input placeholder="e.g., React, TypeScript, Node.js" {...field} />
                                </FormControl>
                                <FormDescription>
                                    Separate skills with a comma.
                                </FormDescription>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="experience"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Work Experience</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Describe your professional experience..." className="min-h-[150px]" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormItem>
                            <FormLabel>Resume/CV</FormLabel>
                            <div className="flex items-center gap-4">
                                <Button type="button" variant="outline" onClick={() => resumeInputRef.current?.click()} disabled={uploadingResume}>
                                    {uploadingResume ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                    {userProfile?.resumeURL ? 'Upload New Resume' : 'Upload Resume'}
                                </Button>
                                {userProfile?.resumeURL && (
                                    <Link href={userProfile.resumeURL} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                                        <FileText className="h-4 w-4" />
                                        View Current Resume
                                    </Link>
                                )}
                            </div>
                            <FormControl>
                                <input
                                    type="file"
                                    ref={resumeInputRef}
                                    onChange={handleResumeFileChange}
                                    className="hidden"
                                    accept=".pdf,.doc,.docx"
                                />
                            </FormControl>
                             <FormDescription>
                                PDF, DOC, or DOCX file (Max 5MB).
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    </>
                )}
              
              <div className="flex justify-end">
                <Button type="submit" className="bg-accent hover:bg-accent/90" disabled={loading || uploading || uploadingResume}>
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
