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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Loader2, Upload } from 'lucide-react';
import { handleGenerateDescription, addProduct } from './actions';
import Image from 'next/image';
import { useAuth } from '@/auth/provider';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  productTitle: z.string().min(5, {
    message: 'Product title must be at least 5 characters.',
  }),
  productCategory: z.string({
    required_error: 'Please select a product category.',
  }),
  productDescription: z.string().min(20, {
    message: 'Product description must be at least 20 characters.',
  }),
  price: z.coerce.number().positive({ message: 'Price must be a positive number.' }),
  image: z.instanceof(File).refine(file => file.size > 0, "Please upload an image."),
});

export default function AddProductPage() {
  const { toast } = useToast();
  const [isGenerating, startGenerating] = useTransition();
  const [isSubmitting, startSubmitting] = useTransition();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const { user, userDetails, loading } = useAuth();
  const router = useRouter();


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productTitle: '',
      productDescription: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user || !userDetails) {
        toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to add a product.'});
        return;
    }

    startSubmitting(async () => {
        const formData = new FormData();
        Object.entries(values).forEach(([key, value]) => {
            formData.append(key, value);
        });

        // Append user details to formData
        formData.append('userId', user.uid);
        formData.append('userName', user.displayName || 'Anonymous');
        formData.append('userSchool', userDetails.school);

        const result = await addProduct(formData);

        if (result.success) {
            toast({
                title: 'Product Submitted!',
                description: 'Your new product has been added to the catalog.',
            });
            form.reset();
            setImagePreview(null);
            router.push('/dashboard');
        } else {
            toast({
                variant: 'destructive',
                title: 'Submission Failed',
                description: result.error || 'An unknown error occurred.',
            });
        }
    });
  }

  const onGenerateDescription = () => {
    const { productTitle, productCategory } = form.getValues();

    if (!productTitle || !productCategory) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please provide a Product Title and Category first.',
      });
      return;
    }

    startGenerating(async () => {
      const result = await handleGenerateDescription({
        productTitle,
        productCategory,
      });

      if (result.success && result.description) {
        form.setValue('productDescription', result.description, { shouldValidate: true });
        toast({
          title: 'Description Generated!',
          description: 'The AI has created a description for your product.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Generation Failed',
          description: result.error || 'An unknown error occurred.',
        });
      }
    });
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue('image', file, { shouldValidate: true });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }


  if (loading) {
    return <div className="container text-center py-12"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>
  }
  
  if (!user) {
    router.push('/signin?callbackUrl=/vendor/add-product');
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">Add a New Product</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Image</FormLabel>
                      <FormControl>
                        <Input type="file" accept="image/*" onChange={handleImageChange} />
                      </FormControl>
                      {imagePreview && (
                        <div className="mt-4">
                            <Image src={imagePreview} alt="Image preview" width={200} height={200} className="rounded-md object-cover"/>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              <FormField
                control={form.control}
                name="productTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Noise-Cancelling Headphones" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="productCategory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Study & Essentials">Study & Essentials</SelectItem>
                        <SelectItem value="Hostel Needs">Hostel Needs</SelectItem>
                        <SelectItem value="Electronics">Electronics</SelectItem>
                        <SelectItem value="Food & Groceries">Food & Groceries</SelectItem>
                        <SelectItem value="Fashion & LifeStyle">Fashion & LifeStyle</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="productDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Description</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Textarea
                          placeholder="Describe your product here..."
                          className="min-h-[120px] pr-28"
                          {...field}
                        />
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onGenerateDescription}
                        disabled={isGenerating}
                        className="absolute bottom-2 right-2"
                      >
                        {isGenerating ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="mr-2 h-4 w-4 text-primary" />
                        )}
                        Generate
                      </Button>
                    </div>
                    <FormDescription>
                      You can write your own or let our AI generate one for you.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (₦)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 15000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Upload className="mr-2 h-4 w-4" />
                )}
                Add Product to Catalog
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
