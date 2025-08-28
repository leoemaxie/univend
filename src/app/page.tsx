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
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const categories = [
  { name: 'Books', icon: BookOpen },
  { name: 'Hostel Needs', icon: BedDouble },
  { name: 'Electronics', icon: Laptop },
  { name: 'Fashion', icon: Shirt },
];

const products = [
  {
    id: 1,
    name: 'Advanced Engineering Mathematics',
    price: '35.00',
    university: 'Stanford University',
    image: 'https://picsum.photos/400/300?random=1',
    hint: 'textbook math',
  },
  {
    id: 2,
    name: 'Comfy Bedside Lamp',
    price: '15.50',
    university: 'Harvard University',
    image: 'https://picsum.photos/400/300?random=2',
    hint: 'lamp decor',
  },
  {
    id: 3,
    name: 'Noise-Cancelling Headphones',
    price: '99.99',
    university: 'MIT',
    image: 'https://picsum.photos/400/300?random=3',
    hint: 'headphones electronics',
  },
  {
    id: 4,
    name: 'University Hoodie',
    price: '45.00',
    university: 'Stanford University',
    image: 'https://picsum.photos/400/300?random=4',
    hint: 'hoodie clothing',
  },
  {
    id: 5,
    name: 'Introduction to Psychology',
    price: '25.00',
    university: 'Yale University',
    image: 'https://picsum.photos/400/300?random=5',
    hint: 'textbook psychology',
  },
  {
    id: 6,
    name: 'Mini Fridge for Dorm Room',
    price: '75.00',
    university: 'Harvard University',
    image: 'https://picsum.photos/400/300?random=6',
    hint: 'fridge appliance',
  },
];

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <section className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tight text-gray-800">
          Your Campus Marketplace
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Discover, buy, and sell anything you need, right within your
          university community.
        </p>
      </section>

      <section className="mb-16">
        <h2 className="text-3xl font-bold font-headline mb-6">
          Shop by Category
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((category) => (
            <Card
              key={category.name}
              className="group hover:shadow-lg transition-shadow duration-300 cursor-pointer"
            >
              <CardContent className="flex flex-col items-center justify-center p-6">
                <category.icon className="w-12 h-12 text-primary mb-4 transition-transform duration-300 group-hover:scale-110" />
                <h3 className="font-semibold text-center">{category.name}</h3>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold font-headline">Featured Products</h2>
          <Button variant="ghost" asChild>
            <Link href="/products">
              View All <span className="ml-2">→</span>
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card
              key={product.id}
              className="overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              <CardHeader className="p-0">
                <div className="aspect-w-16 aspect-h-9 overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.name}
                    width={400}
                    height={300}
                    data-ai-hint={product.hint}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <CardTitle className="text-lg mb-1">{product.name}</CardTitle>
                <CardDescription className="text-sm text-gray-500 mb-2">
                  {product.university}
                </CardDescription>
                <div className="flex justify-between items-center">
                  <p className="text-xl font-bold text-primary">
                    ${product.price}
                  </p>
                  <Button size="sm" variant="outline">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add to Cart
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
