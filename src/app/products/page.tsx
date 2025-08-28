'use client';

import type { Product } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCart } from '@/hooks/use-cart';

async function getProducts(): Promise<Product[]> {
  const productsCollection = collection(db, 'products');
  const q = query(productsCollection, where('status', '==', 'available'), orderBy('createdAt', 'desc'));
  const productsSnapshot = await getDocs(q);
  
  if (productsSnapshot.empty) {
    return [];
  }
  return productsSnapshot.docs.map(doc => doc.data() as Product);
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
        setLoading(true);
        const productList = await getProducts();
        setProducts(productList);
        setLoading(false);
    }
    fetchProducts();
  }, [])

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <section className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tight text-foreground">
          All Products
        </h1>
        <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Browse through all the amazing deals available from students across campus.
        </p>
      </section>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="overflow-hidden group transition-all duration-300 flex flex-col">
                    <CardHeader className='p-0'>
                        <Skeleton className="aspect-square w-full" />
                    </CardHeader>
                    <CardContent className="p-4 flex flex-col flex-grow">
                        <Skeleton className="h-6 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2 mb-4" />
                        <div className="flex-grow"></div>
                        <div className="flex justify-between items-center mt-auto">
                            <Skeleton className="h-8 w-1/3" />
                            <Skeleton className="h-9 w-24" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
            <p className="text-xl text-muted-foreground">No products available at the moment. Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {products.map((product) => (
            <Card
              key={product.id}
              className="overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col"
            >
              <Link href={`/products/${product.id}`} className='flex flex-col h-full'>
                <CardHeader className="p-0">
                  <div className="relative aspect-square overflow-hidden">
                    <Image
                      src={product.imageUrl}
                      alt={product.title}
                      fill
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-4 flex flex-col flex-grow">
                  <CardTitle className="text-lg mb-1 leading-tight">{product.title}</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground mb-4">
                    {product.university}
                  </CardDescription>
                  <div className="flex-grow"></div>
                  <div className="flex justify-between items-center mt-auto">
                    <p className="text-2xl font-bold text-primary">
                      ₦{new Intl.NumberFormat('en-NG').format(product.price)}
                    </p>
                    <Button size="sm" variant="outline" onClick={(e) => handleAddToCart(e, product)}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add to Cart
                    </Button>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
