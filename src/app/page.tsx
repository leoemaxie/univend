
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

const staticProducts: Omit<Product, 'vendorId' | 'vendorName' | 'category' | 'description' | 'createdAt' | 'status'>[] = [
  {
    "id": "1",
    "title": "Advanced Engineering Mathematics",
    "price": 15000,
    "university": "University of Lagos",
    "imageUrl": "https://source.unsplash.com/400x300/?math,book",
    "data-ai-hint": "textbook math"
  },
  {
    "id": "2",
    "title": "Principles of Economics",
    "price": 12000,
    "university": "Obafemi Awolowo University",
    "imageUrl": "https://source.unsplash.com/400x300/?economics,book",
    "data-ai-hint": "economics textbook"
  },
  {
    "id": "3",
    "title": "Organic Chemistry Notes",
    "price": 8000,
    "university": "University of Ibadan",
    "imageUrl": "https://source.unsplash.com/400x300/?chemistry,book",
    "data-ai-hint": "chemistry textbook"
  },
  {
    "id": "4",
    "title": "Laptop Backpack",
    "price": 9000,
    "university": "Ahmadu Bello University",
    "imageUrl": "https://source.unsplash.com/400x300/?backpack,student",
    "data-ai-hint": "bag for students"
  },
  {
    "id": "5",
    "title": "Sneakers (White)",
    "price": 11000,
    "university": "University of Benin",
    "imageUrl": "https://source.unsplash.com/400x300/?sneakers,shoes",
    "data-ai-hint": "casual student shoes"
  },
  {
    "id": "6",
    "title": "Ankara Dress",
    "price": 15000,
    "university": "University of Port Harcourt",
    "imageUrl": "https://source.unsplash.com/400x300/?ankara,fashion",
    "data-ai-hint": "student fashion"
  },
  {
    "id": "7",
    "title": "Plain White T-Shirt",
    "price": 3500,
    "university": "Lagos State University",
    "imageUrl": "https://source.unsplash.com/400x300/?tshirt,white",
    "data-ai-hint": "basic student wear"
  },
  {
    "id": "8",
    "title": "Denim Jacket",
    "price": 10000,
    "university": "Covenant University",
    "imageUrl": "https://source.unsplash.com/400x300/?denim,jacket",
    "data-ai-hint": "fashion jacket"
  },
  {
    "id": "9",
    "title": "Jollof Rice & Chicken Pack",
    "price": 2500,
    "university": "University of Lagos",
    "imageUrl": "https://source.unsplash.com/400x300/?jollof,rice",
    "data-ai-hint": "food delivery"
  },
  {
    "id": "10",
    "title": "Shawarma (Large)",
    "price": 2000,
    "university": "Obafemi Awolowo University",
    "imageUrl": "https://source.unsplash.com/400x300/?shawarma,food",
    "data-ai-hint": "fast food"
  },
  {
    "id": "11",
    "title": "Meat Pie Pack (5 pcs)",
    "price": 1500,
    "university": "University of Ibadan",
    "imageUrl": "https://source.unsplash.com/400x300/?meatpie,food",
    "data-ai-hint": "snack"
  },
  {
    "id": "12",
    "title": "Fruit Smoothie",
    "price": 1200,
    "university": "Ahmadu Bello University",
    "imageUrl": "https://source.unsplash.com/400x300/?smoothie,fruit",
    "data-ai-hint": "healthy drink"
  },
  {
    "id": "13",
    "title": "Suya (Beef Skewers)",
    "price": 1800,
    "university": "University of Benin",
    "imageUrl": "https://source.unsplash.com/400x300/?suya,grill",
    "data-ai-hint": "popular student food"
  },
  {
    "id": "14",
    "title": "Pounded Yam with Egusi Soup",
    "price": 3000,
    "university": "University of Port Harcourt",
    "imageUrl": "https://source.unsplash.com/400x300/?egusi,food",
    "data_ai_hint": "traditional meal"
  },
  {
    "id": "15",
    "title": "Burger & Fries",
    "price": 2200,
    "university": "Covenant University",
    "imageUrl": "https://source.unsplash.com/400x300/?burger,fries",
    "data_ai_hint": "fast food combo"
  }
].map(p => ({
  ...p,
  // Fill in the missing properties to match the Product type
  vendorId: 'static-vendor',
  vendorName: 'Univend',
  category: 'Featured',
  description: `A high-quality ${p.title} available at ${p.university}.`,
  createdAt: new Date().toISOString(),
  status: 'available' as const,
}));


async function getFeaturedProducts(): Promise<Product[]> {
    const productsCollection = collection(db, 'products');
    const q = query(
        productsCollection,
        orderBy('createdAt', 'desc'),
        limit(15) // Fetch up to 15 products
    );
    const productsSnapshot = await getDocs(q);
    
    if (productsSnapshot.empty) {
      return [];
    }
    
    const allProducts = productsSnapshot.docs.map(doc => doc.data() as Product);
    return allProducts.filter(product => product.status === 'available');
}


export default async function Home() {
  const dynamicProducts = await getFeaturedProducts();
  const products = dynamicProducts.length >= 15 ? dynamicProducts : staticProducts.slice(0,6);

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
                    // @ts-ignore
                    data-ai-hint={product['data-ai-hint'] || ''}
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
