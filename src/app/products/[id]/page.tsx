'use client';

import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { Product } from '@/lib/types';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle, UserCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCart } from '@/hooks/use-cart';

type ProductPageProps = {
  params: {
    id: string;
  };
};

export default function ProductPage({ params }: ProductPageProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      const docRef = doc(db, 'products', params.id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setProduct(docSnap.data() as Product);
      } else {
        // Handle product not found
        console.log('No such document!');
      }
      setLoading(false);
    };

    fetchProduct();
  }, [params.id]);

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
          
          <div className="flex items-center gap-2 mb-6 text-md text-muted-foreground">
            <UserCircle className="w-5 h-5"/>
            <span>Sold by {product.vendorName}</span>
          </div>
          
          <p className="text-4xl font-bold text-primary mb-6">
            ₦{new Intl.NumberFormat('en-NG').format(product.price)}
          </p>

          <p className="text-foreground/80 mb-8 flex-grow">
            {product.description}
          </p>

          <Button size="lg" onClick={() => addToCart(product)}>
            <PlusCircle className="mr-2" /> Add to Cart
          </Button>
        </div>
      </div>
    </div>
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
          <Skeleton className="h-12 w-full mt-auto" />
        </div>
      </div>
    </div>
  )
}
