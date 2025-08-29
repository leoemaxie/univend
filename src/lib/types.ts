
export type School = {
    name: string;
    type: string;
    domain: string;
  };
  
  export type Product = {
      id: string;
      vendorId: string;
      vendorName: string;
      university: string;
      title: string;
      category: string;
      description:string;
      price: number;
      imageUrl: string;
      createdAt: string;
      status: 'available' | 'sold';
      reviewCount: number;
      averageRating: number;
  };
  
  export type OrderItem = {
    productId: string;
    title: string;
    price: number;
    quantity: number;
    imageUrl: string;
  };
  
  export type Order = {
    id: string;
    buyerId: string;
    buyerName: string;
    vendorId: string;
    items: OrderItem[];
    total: number;
    status: 'pending' | 'processing' | 'out-for-delivery' | 'delivered' | 'cancelled';
    riderId?: string;
    createdAt: string;
    university: string;
    deliveryAddress?: string;
  };
  
  export type Delivery = {
      id: string; // Same as orderId
      order: Order;
      riderId: string;
      status: 'assigned' | 'picked-up' | 'delivered';
      pickedUpAt?: string;
      deliveredAt?: string;
  }

  export type UserDetails = {
    uid: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    school: string;
    role: 'buyer' | 'vendor' | 'rider' | 'superadminx';
    createdAt: string;
    photoURL?: string;
    address?: string; // Personal delivery address
    fcmToken?: string;
    // Vendor-specific fields
    companyName?: string;
    companyDescription?: string;
    companyCategory?: string;
    companyAddress?: string;
}
  
export type Wallet = {
    userId: string;
    balance: number;
    updatedAt: string;
}

export type Review = {
    id: string;
    productId: string;
    userId: string;
    userName: string;
    userPhotoURL: string;
    rating: number;
    comment: string;
    createdAt: string;
};
