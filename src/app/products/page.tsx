
'use client';

import type { Product, School } from '@/lib/types';
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
import { useEffect, useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCart } from '@/hooks/use-cart';
import { useSearchParams } from 'next/navigation';
import { getSchools } from '@/lib/schools';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select';

async function getProducts(): Promise<Product[]> {
  const productsCollection = collection(db, 'products');
  const q = query(productsCollection, where('status', '==', 'available'), orderBy('createdAt', 'desc'));
  const productsSnapshot = await getDocs(q);
  
  if (productsSnapshot.empty) {
    return [];
  }
  return productsSnapshot.docs.map(doc => doc.data() as Product);
}

const categories = [
    'Study & Essentials',
    'Hostel Needs',
    'Electronics',
    'Food & Groceries',
    'Fashion & LifeStyle',
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const searchParams = useSearchParams();

  // Filter and sort states
  const [searchTerm, setSearchTerm] = useState('');
  const [universityFilter, setUniversityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt-desc');

  useEffect(() => {
    const fetchInitialData = async () => {
        setLoading(true);
        const [productList, schoolList] = await Promise.all([getProducts(), getSchools()]);
        setProducts(productList);
        setSchools(schoolList);
        setSearchTerm(searchParams.get('q') || '');
        setLoading(false);
    }
    fetchInitialData();
  }, [searchParams])

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products;

    if (searchTerm) {
        filtered = filtered.filter(p => p.title.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (universityFilter !== 'all') {
        filtered = filtered.filter(p => p.university === universityFilter);
    }
    if (categoryFilter !== 'all') {
        filtered = filtered.filter(p => p.category === categoryFilter);
    }

    const [sortKey, sortDirection] = sortBy.split('-');

    filtered.sort((a, b) => {
        let valA, valB;
        if (sortKey === 'price') {
            valA = a.price;
            valB = b.price;
        } else { // createdAt
            valA = new Date(a.createdAt).getTime();
            valB = new Date(b.createdAt).getTime();
        }

        if (sortDirection === 'asc') {
            return valA - valB;
        } else {
            return valB - valA;
        }
    });

    return filtered;

  }, [products, searchTerm, universityFilter, categoryFilter, sortBy]);


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

      <Card className="mb-8 p-4 bg-muted/50">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <Input 
                placeholder='Search products...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='md:col-span-2'
            />
            <Select value={universityFilter} onValueChange={setUniversityFilter}>
                <SelectTrigger><SelectValue placeholder="Filter by University" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Universities</SelectItem>
                    {schools.map(s => <SelectItem key={s.domain} value={s.domain}>{s.name}</SelectItem>)}
                </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger><SelectValue placeholder="Filter by Category" /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
            </Select>
            <div className='md:col-start-4'>
                <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger><SelectValue placeholder="Sort by" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="createdAt-desc">Newest</SelectItem>
                        <SelectItem value="price-asc">Price: Low to High</SelectItem>
                        <SelectItem value="price-desc">Price: High to Low</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
      </Card>


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
      ) : filteredAndSortedProducts.length === 0 ? (
        <div className="text-center py-20">
            <p className="text-xl text-muted-foreground">No products match your criteria. Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {filteredAndSortedProducts.map((product) => (
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
                    <p className="text-2xl font-bold text-price">
                      ₦{new Intl.NumberFormat('en-NG').format(product.price)}
                    </p>
                    <Button size="sm" onClick={(e) => handleAddToCart(e, product)}>
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
