import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  BedDouble,
  Laptop,
  Shirt,
  PlusCircle,
  MoveRight,
  Utensils,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Product } from '@/lib/types';

const categories = [
  { name: 'Study & Essentials', icon: BookOpen },
  { name: 'Hostel Needs', icon: BedDouble },
  { name: 'Electronics', icon: Laptop },
  { name: 'Fashion & LifeStyle', icon: Shirt },
  { name: 'Food & Groceries', icon: Utensils },
];

async function getFeaturedProducts(): Promise<Product[]> {
    const productsCollection = collection(db, 'products');
    const q = query(
        productsCollection,
        orderBy('createdAt', 'desc'),
        limit(10)
    );
    const productsSnapshot = await getDocs(q);
    
    if (productsSnapshot.empty) {
      return [];
    }
    
    // Filter for 'available' status on the client side to avoid needing a composite index
    const allProducts = productsSnapshot.docs.map(doc => doc.data() as Product);
    return allProducts.filter(product => product.status === 'available').slice(0, 6);
}


export default async function Home() {
  const products = await getFeaturedProducts();

  return (
    <div className="container mx-auto px-4 py-12">
      <section className="text-center mb-20">
        <h1 className="text-4xl md:text-6xl font-bold font-headline tracking-tight text-foreground">
          Your Campus Marketplace
        </h1>
        <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Discover, buy, and sell anything you need, right within your
          university community. The best deals, from students you trust.
        </p>
        <div className="mt-8 flex justify-center gap-4">
            <Button size="lg" asChild>
                <Link href="/products">
                    Browse Products
                    <MoveRight className="ml-2" />
                </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
                <Link href="/vendor/add-product">
                    Sell an Item
                </Link>
            </Button>
        </div>
      </section>

      <section className="mb-20">
        <h2 className="text-3xl font-bold font-headline mb-8 text-center">
          Shop by Category
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {categories.map((category) => (
            <Card
              key={category.name}
              className="group hover:shadow-lg transition-all duration-300 cursor-pointer text-center bg-card/50 hover:bg-accent/10"
            >
              <CardContent className="flex flex-col items-center justify-center p-6">
                <div className="bg-primary/10 p-4 rounded-full mb-4 group-hover:bg-accent/20 transition-colors">
                    <category.icon className="w-10 h-10 text-primary transition-transform duration-300 group-hover:scale-110 group-hover:text-accent-foreground" />
                </div>
                <h3 className="font-semibold text-lg">{category.name}</h3>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold font-headline">Featured Products</h2>
          <Button variant="ghost" asChild>
            <Link href="/products">
              View All <span className="ml-2">→</span>
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <Card
              key={product.id}
              className="overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col"
            >
              <CardHeader className="p-0">
                <div className="relative aspect-video overflow-hidden">
                  <Image
                    src={product.imageUrl}
                    alt={product.title}
                    width={400}
                    height={300}
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
                  ₦{new Intl.NumberFormat('en-NG').format(Number(product.price))}
                  </p>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/products/${product.id}`}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add to Cart
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
