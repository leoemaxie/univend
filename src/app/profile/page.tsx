
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import React, { useState, useTransition } from 'react';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Save, Building } from 'lucide-react';
import { updateProfile, updateUserRole } from './actions';
import Image from 'next/image';
import { useAuth } from '@/auth/provider';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import type { UserDetails } from '@/lib/types';


const formSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters."),
  lastName: z.string().min(2, "Last name must be at least 2 characters."),
  address: z.string().optional(),
  photo: z.instanceof(File).optional(),
  // Vendor fields
  companyName: z.string().optional(),
  companyDescription: z.string().optional(),
  companyCategory: z.string().optional(),
  companyAddress: z.string().optional(),
});

export default function ProfilePage() {
  const { toast } = useToast();
  const [isSubmitting, startSubmitting] = useTransition();
  const [isUpdatingRole, startUpdatingRole] = useTransition();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { user, userDetails, loading, refreshUserDetails } = useAuth();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserDetails['role'] | ''>('');


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: {
        firstName: userDetails?.firstName || '',
        lastName: userDetails?.lastName || '',
        address: userDetails?.address || '',
        companyName: userDetails?.companyName || '',
        companyDescription: userDetails?.companyDescription || '',
        companyCategory: userDetails?.companyCategory || '',
        companyAddress: userDetails?.companyAddress || '',
    }
  });
  
  React.useEffect(() => {
    if(userDetails){
        setSelectedRole(userDetails.role);
        form.reset({
            firstName: userDetails.firstName || '',
            lastName: userDetails.lastName || '',
            address: userDetails.address || '',
            companyName: userDetails.companyName || '',
            companyDescription: userDetails.companyDescription || '',
            companyCategory: userDetails.companyCategory || '',
            companyAddress: userDetails.companyAddress || '',
        })
    }
  }, [userDetails, form]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue('photo', file, { shouldValidate: true });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({ variant: 'destructive', title: "Not authenticated" });
      return;
    }
  
    startSubmitting(async () => {
      const formData = new FormData();
      formData.append('userId', user.uid);

      // Append all form values
      (Object.keys(values) as Array<keyof typeof values>).forEach(key => {
        const value = values[key];
        if (value) {
            formData.append(key, value);
        }
      });
  
      const result = await updateProfile(formData);
  
      if (result.success) {
        toast({ title: "Profile Updated!", description: "Your changes have been saved." });
        await refreshUserDetails();
        router.refresh();
      } else {
        toast({ variant: 'destructive', title: "Update Failed", description: result.error });
      }
    });
  }

  const handleRoleSave = () => {
    if(!user || !selectedRole) {
        toast({ variant: 'destructive', title: "Error", description: "Could not update role." });
        return;
    }
    startUpdatingRole(async () => {
        const result = await updateUserRole(user.uid, selectedRole);
        if (result.success) {
            toast({ title: "Role Updated!", description: "Your role has been successfully updated." });
            await refreshUserDetails();
            router.refresh();
        } else {
            toast({ variant: 'destructive', title: "Update Failed", description: result.error });
        }
    })
  }

  if (loading) {
    return <div className="container text-center py-12"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>
  }
  
  if (!user || !userDetails) {
    router.push('/signin?callbackUrl=/profile');
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-2xl mx-auto space-y-8">
                <Card>
                    <CardHeader>
                    <CardTitle className="font-headline text-3xl">Your Profile</CardTitle>
                    <CardDescription>Manage your personal information and role.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                    <div className='flex items-center gap-4'>
                        <Avatar className="h-20 w-20">
                        <AvatarImage src={imagePreview || userDetails?.photoURL || `https://avatar.vercel.sh/${user.email}.png`} alt={user.displayName || 'User'}/>
                        <AvatarFallback>{userDetails.firstName.charAt(0)}{userDetails.lastName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <FormField
                        control={form.control}
                        name="photo"
                        render={() => (
                            <FormItem>
                            <FormLabel>Profile Picture</FormLabel>
                            <FormControl>
                                <Input type="file" accept="image/*" onChange={handleImageChange} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
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
                        name="address"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Delivery Address</FormLabel>
                            <FormControl>
                                <Textarea
                                placeholder="e.g. Queen Amina Hall, Block B, Room 101"
                                {...field}
                                />
                            </FormControl>
                            <FormDescription>
                                Your on-campus address for deliveries.
                            </FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                        />

                    <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <Input value={user.email!} disabled />
                        <FormDescription>You cannot change your email address.</FormDescription>
                    </FormItem>
                    
                    <Separator />
                    
                    <div>
                        <h3 className="text-lg font-medium">Role Management</h3>
                        <p className="text-sm text-muted-foreground mb-4">Select your primary role in the application.</p>
                        <div className="flex items-center gap-4">
                            <div className='flex-grow'>
                                <Select value={selectedRole} onValueChange={(val) => setSelectedRole(val as UserDetails['role'])}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select your role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="buyer">Buyer</SelectItem>
                                        <SelectItem value="vendor">Vendor</SelectItem>
                                        <SelectItem value="rider">Rider</SelectItem>
                                        {userDetails.role === 'superadminx' && (
                                            <SelectItem value="superadminx">Super Admin</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button type="button" onClick={handleRoleSave} disabled={isUpdatingRole || selectedRole === userDetails.role}>
                                {isUpdatingRole ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Role
                            </Button>
                        </div>
                    </div>
                    </CardContent>
                </Card>
                
                {userDetails.role === 'vendor' && (
                    <Card>
                        <CardHeader>
                            <div className='flex items-center gap-2'>
                                <Building className='h-8 w-8 text-muted-foreground' />
                                <div>
                                    <CardTitle className="font-headline text-2xl">Vendor Information</CardTitle>
                                    <CardDescription>Provide details about your business or store.</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className='space-y-6'>
                            <FormField
                                control={form.control}
                                name="companyName"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Business Name</FormLabel>
                                    <FormControl>
                                    <Input placeholder="e.g. Johnny's Snacks" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="companyCategory"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Business Category</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                        <SelectValue placeholder="Select a category" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="food">Food & Groceries</SelectItem>
                                        <SelectItem value="fashion">Fashion & Apparel</SelectItem>
                                        <SelectItem value="electronics">Electronics</SelectItem>
                                        <SelectItem value="essentials">Study & Essentials</SelectItem>
                                        <SelectItem value="services">Services</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="companyDescription"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Business Description</FormLabel>
                                    <FormControl>
                                    <Textarea placeholder="Tell us about your business..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="companyAddress"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Business Address / Pickup Location</FormLabel>
                                    <FormControl>
                                    <Textarea placeholder="e.g. Moremi Hall, Common Room" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>
                )}

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="mr-2 h-4 w-4" />
                    )}
                    Save All Changes
                </Button>
            </form>
        </Form>
    </div>
  );
}
