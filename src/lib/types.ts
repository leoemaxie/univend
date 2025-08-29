

export const DELIVERY_FEE = 500;

export type School = {
    name: string;
    type: string;
    domain: string;
  };

  export type DeliveryMethod = 'delivery' | 'pickup';
  
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
      deliveryMethods: DeliveryMethod[];
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
    subtotal: number;
    deliveryFee: number;
    total: number;
    status: 'pending-confirmation' | 'pending' | 'ready-for-pickup' | 'processing' | 'out-for-delivery' | 'delivered' | 'cancelled' | 'rejected';
    paymentStatus: 'pending' | 'paid' | 'refunded';
    riderId?: string;
    createdAt: string;
    university: string;
    deliveryAddress?: string;
    deliveryMethod: DeliveryMethod;
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

export type WalletTransaction = {
    id: string;
    userId: string;
    type: 'credit' | 'debit';
    amount: number;
    description: string;
    relatedEntityType?: 'order' | 'funding';
    relatedEntityId?: string;
    createdAt: string;
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

// Chat and Message Types
export type Message = {
    senderId: string;
    text: string;
    createdAt: string;
};

export type ChatParticipant = {
    name: string;
    avatar: string;
};

export type Chat = {
    id: string;
    productId: string;
    productTitle: string;
    productImageUrl: string;
    participantIds: string[];
    participants: {
        [key: string]: ChatParticipant;
    };
    createdAt: string;
    lastMessage: {
        text: string;
        senderId: string;
        createdAt: string;
    } | null;
};
