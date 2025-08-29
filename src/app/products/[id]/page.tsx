
'use client';

import { db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import type { Product, Review } from '@/lib/types';
import React, { useEffect, useState, useTransition } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle, UserCircle, Star, Send, MessageSquare, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCart } from '@/hooks/use-cart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/auth/provider';
import { Textarea } from '@/components/ui/textarea';
import { submitReview } from './actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { getOrCreateChat } from '@/app/chat/actions';
import Link from 'next/link';
import { generateRelatedProducts } from '@/ai/flows/generate-related-products';
import { Badge } from '@/components/ui/badge';


type ProductPageProps = {
  params: {
    id: string;
  };
};

export default function ProductPage({ params }: ProductPageProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [isCreatingChat, startCreatingChat] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    const fetchProductAndReviews = async () => {
      setLoading(true);
      const productRef = doc(db, 'products', params.id);
      const reviewsRef = collection(productRef, 'reviews');
      
      const productSnap = await getDoc(productRef);
      
      if (productSnap.exists()) {
        setProduct(productSnap.data() as Product);
        const q = query(reviewsRef, orderBy('createdAt', 'desc'));
        const reviewsSnap = await getDocs(q);
        setReviews(reviewsSnap.docs.map(doc => doc.data() as Review));
      } else {
        console.log('No such document!');
      }

      setLoading(false);
    };

    fetchProductAndReviews();
  }, [params.id]);


  const handleChatWithVendor = () => {
    if (!user) {
        router.push(`/signin?callbackUrl=/products/${params.id}`);
        return;
    }
    if (user.uid === product?.vendorId) {
        toast({ variant: 'destructive', title: "This is your product", description: "You cannot start a chat with yourself."});
        return;
    }

    startCreatingChat(async () => {
        const result = await getOrCreateChat(params.id, user.uid);
        if(result.success && result.data) {
            router.push(`/chat/${result.data.chatId}`);
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
    });
  }

  if (loading) {
    return <ProductSkeleton />;
  }

  if (!product) {
    return <div className="container py-12 text-center">Product not found.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid md:grid-cols-2 gap-12">
        <div className="aspect-square relative rounded-lg overflow-hidden shadow-lg">
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            className="object-cover"
          />
        </div>
        <div className="flex flex-col">
          <h1 className="text-4xl font-bold font-headline mb-2">{product.title}</h1>
          <p className="text-muted-foreground text-lg mb-4">{product.university}</p>
          
          <div className="flex items-center gap-2 mb-4 text-md text-muted-foreground">
            <UserCircle className="w-5 h-5"/>
            <span>Sold by {product.vendorName}</span>
          </div>

          <div className="flex items-center gap-2 mb-6">
            <StarRating rating={product.averageRating} />
            <span className="text-muted-foreground text-sm">({product.reviewCount} reviews)</span>
          </div>
          
          <p className="text-4xl font-bold mb-6">
            ₦{new Intl.NumberFormat('en-NG').format(product.price)}
          </p>

          <p className="text-foreground/80 mb-8 flex-grow">
            {product.description}
          </p>

          <div className='flex gap-2'>
            <Button size="lg" onClick={() => addToCart(product)} className='flex-1'>
                <PlusCircle className="mr-2" /> Add to Cart
            </Button>
            {user?.uid !== product.vendorId && (
              <Button size="lg" variant="outline" onClick={handleChatWithVendor} disabled={isCreatingChat}>
                  {isCreatingChat ? <Loader2 className="mr-2 animate-spin" /> : <MessageSquare className="mr-2" />}
                  Chat with Vendor
              </Button>
            )}
          </div>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-12 mt-12">
        <ReviewsSection productId={product.id} reviews={reviews} />
        <RelatedProductsSection product={product} />
      </div>
    </div>
  );
}

function StarRating({ rating, size = 'md' }: { rating: number, size?: 'sm' | 'md' }) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    const starSize = size === 'sm' ? "h-4 w-4" : "h-5 w-5";

    return (
        <div className="flex items-center gap-1 text-amber-400">
            {[...Array(fullStars)].map((_, i) => <Star key={`full-${i}`} className={`${starSize} fill-current`} />)}
            {/* Not implementing half star for now */}
            {[...Array(emptyStars)].map((_, i) => <Star key={`empty-${i}`} className={starSize} />)}
        </div>
    )
}

function ReviewsSection({ productId, reviews }: { productId: string, reviews: Review[] }) {
    const { user, userDetails } = useAuth();

    return (
        <Card>
            <CardHeader>
                <CardTitle>Ratings & Reviews</CardTitle>
            </CardHeader>
            <CardContent>
                <ReviewForm productId={productId} />
                <Separator className="my-8" />
                {reviews.length > 0 ? (
                    <div className="space-y-6">
                        {reviews.map(review => (
                            <div key={review.id} className="flex gap-4">
                                <Avatar>
                                    <AvatarImage src={review.userPhotoURL} />
                                    <AvatarFallback>{review.userName.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center">
                                        <p className="font-semibold">{review.userName}</p>
                                        <span className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center my-1">
                                        <StarRating rating={review.rating} size="sm" />
                                    </div>
                                    <p className="text-sm text-foreground/90">{review.comment}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground py-4">Be the first to review this product!</p>
                )}
            </CardContent>
        </Card>
    );
}

function ReviewForm({ productId }: { productId: string }) {
    const { user, userDetails } = useAuth();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [hoverRating, setHoverRating] = useState(0);
    const [isSubmitting, startSubmitting] = useTransition();
    const { toast } = useToast();

    if (!user || !userDetails) {
        return <p className="text-sm text-muted-foreground">You must be <Link href="/signin" className="underline">signed in</Link> to leave a review.</p>;
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0 || comment.length < 10) {
            toast({ variant: 'destructive', title: 'Invalid Review', description: 'Please provide a rating and a comment of at least 10 characters.' });
            return;
        }

        startSubmitting(async () => {
            const formData = new FormData();
            formData.append('productId', productId);
            formData.append('userId', user.uid);
            formData.append('userName', user.displayName || 'Anonymous');
            formData.append('userPhotoURL', user.photoURL || '');
            formData.append('rating', String(rating));
            formData.append('comment', comment);

            const result = await submitReview(formData);
            if (result.success) {
                toast({ title: 'Review Submitted!', description: 'Thank you for your feedback.' });
                setRating(0);
                setComment('');
            } else {
                toast({ variant: 'destructive', title: 'Submission Failed', description: result.error });
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2">
                <p className="font-medium">Your Rating:</p>
                <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map(star => (
                        <Star
                            key={star}
                            className={`h-6 w-6 cursor-pointer transition-colors ${
                                (hoverRating || rating) >= star ? 'text-amber-400 fill-amber-400' : 'text-gray-300'
                            }`}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setRating(star)}
                        />
                    ))}
                </div>
            </div>
            <Textarea
                placeholder="Share your thoughts on the product..."
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={4}
                required
            />
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2" />}
                Submit Review
            </Button>
        </form>
    );
}

function RelatedProductsSection({ product }: { product: Product }) {
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        generateRelatedProducts({
            productTitle: product.title,
            productCategory: product.category,
        }).then(result => {
            setSuggestions(result.suggestions);
        }).catch(err => {
            console.error("Failed to generate related products", err);
        }).finally(() => {
            setLoading(false);
        })
    }, [product]);

    return (
        <Card>
            <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                    <Sparkles className="text-primary" />
                    You Might Also Like
                </CardTitle>
                <CardDescription>
                    AI-powered suggestions based on this product.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-8 w-2/3" />
                        <Skeleton className="h-8 w-1/2" />
                    </div>
                ) : (
                    <div className='flex flex-wrap gap-2'>
                        {suggestions.map((suggestion, index) => (
                           <Button key={index} variant="outline" asChild>
                             <Link href={`/products?q=${encodeURIComponent(suggestion)}`}>
                               {suggestion}
                             </Link>
                           </Button>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}


function ProductSkeleton() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="grid md:grid-cols-2 gap-12">
        <Skeleton className="aspect-square rounded-lg" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-12 w-1/4 mt-4" />
          <Skeleton className="h-24 w-full mt-4" />
          <div className='flex gap-2 mt-auto'>
            <Skeleton className="h-12 flex-1" />
            <Skeleton className="h-12 w-1/3" />
          </div>
        </div>
      </div>
       <div className="grid md:grid-cols-2 gap-12 mt-12">
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-40" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-px w-full" />
                    <div className="space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64 mt-2" />
                </CardHeader>
                <CardContent className="space-y-2">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-8 w-2/3" />
                    <Skeleton className="h-8 w-1/2" />
                </CardContent>
            </Card>
        </div>
    </div>
  )
}
