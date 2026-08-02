export interface StorefrontSettings {
  theme: "minimal" | "bold" | "technical" | "playful";
  primaryColor: string;
  businessName?: string;
  bannerUrl?: string;
  businessBio?: string;
  featuredProductIds?: string[];
  bannerHeight?: "small" | "medium" | "large";
  customFont?: string;
  layoutBlocks?: any[];
}

export interface UserProfile {
  uid: string;
  displayName: string;
  username: string;
  email: string;
  phoneNumber: string;
  photoURL?: string;
  role: "buyer" | "seller" | "admin" | "both";
  activeRole?: "buyer" | "seller";
  referralCode?: string;
  referredBy?: string;
  referralEarnings?: number;
  referralCount?: number;
  referralWalletBalance?: number;
  campus?: string;
  schoolType?: string;
  schoolName?: string;
  verificationIdUrl?: string;
  isVerified: boolean;
  isSuspended: boolean;
  strikeCount?: number;
  reportCount: number;
  createdAt: string;
  location?: string;
  state?: string;
  city?: string;
  deliveryAddress?: string;
  deliveryLocations?: string;
  country?: string;
  businessPhoneNumber?: string;
  businessName?: string;
  sellerType?: "goods" | "services" | "both";
  gender?: "male" | "female" | "other";
  paystackConnected?: boolean;
  hibernatedUntil?: string;
  profileCompleted?: boolean;
  hasMadePurchase?: boolean;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  theme?: "light" | "dark";
  storefrontSettings?: StorefrontSettings;
}

export interface Product {
  id: string;
  name: string;
  businessName?: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  imageUrls?: string[];
  sellerId: string;
  sellerName: string;
  sellerVerified: boolean;
  createdAt: string;
  stock: number;
  type: "good" | "service";
  pricingType?: "fixed" | "hourly" | "project" | "daily";
  condition: "new" | "refurbished" | "used";
  deliveryOptions: {
    delivery: boolean;
    pickup: boolean;
    deliveryPrice?: number;
  };
  deliveryTime?: number;
  deliveryTimeUnit?: "hours" | "days" | "weeks";
  isHibernated?: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
  location?: string;
  serialNumber?: string;
  pickupCoordinates?: { lat: number; lng: number } | null;
  certificateUrl?: string | null;
  menuItems?: {
    id: string;
    name: string;
    price: number;
    measureType?: string; // e.g. spoon, piece, plate, cup, kg
    measureAmount?: number; // e.g. 1
    measureAmountDetail?: string; // e.g. 10GB Data, Unlimited access
    imageUrl?: string;
    cheapDataHubPlanId?: string;       // e.g. "120"
    cheapDataHubNetworkCode?: string;  // e.g. "1" (MTN), "2" (GLO) etc.
  }[];
  eventDetails?: {
    eventType: string;
    isPaid: boolean;
    ticketTiers: {
      id: string;
      name: string;
      price: number;
      stock: number;
      imageUrl?: string;
    }[];
    formFields: {
      id: string;
      label: string;
      type: "text" | "number" | "email" | "select";
      options?: string[];
      required: boolean;
    }[];
    location?: string;
    googleFormUrl?: string;
  };
  discountPercent?: number;
  promoCode?: string;
  priceBefore?: number;
  collectionType?: string;
  businessAddress?: string;
  pickupSchool?: string | null;
}

export interface Order {
  id: string;
  uniqueOrderId?: string;
  uniqueProductId?: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  sellerId: string;
  productId: string;
  productName: string;
  productImageUrl?: string;
  quantity: number;
  totalPrice: number;
  commissionAmount?: number;
  referralCommissionAmount?: number;
  referralCommissionAwarded?: boolean;
  sellerEarnings?: number;
  deliveryType: "delivery" | "pickup";
  paymentMethod: "online" | "pod";
  paymentStatus?: "pending" | "paid" | "failed";
  paymentReference?: string;
  status: "pending" | "accepted" | "out_for_delivery" | "delivered" | "cancelled" | "acquired" | "completed" | "Pending Seller Acceptance" | "Out To Pickup Station" | "Ready For Pickup" | "Out For Delivery" | "Order Picked Up" | "Order Delivered" | "Ready For Delivery" | "awaiting_payment";
  type?: "good" | "service";
  createdAt: string;
  acceptedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  deliveryTime?: number;
  deliveryTimeUnit?: "hours" | "days" | "weeks";
  countdownDuration?: number;
  serialNumber?: string;
  hiddenFromHistory?: boolean;
  hiddenFromSeller?: boolean;
  buyerEmail?: string;
  sellerName?: string;
  deliveryAddress?: string;
  ticketTierId?: string;
  ticketTierName?: string;
  menuItemId?: string;
  menuItemName?: string;
  measureType?: string;
  measureAmount?: number;
  formResponses?: Record<string, string>;
  updatedAt?: string;
  disputeStatus?: "none" | "active" | "seller_responded" | "resolved";
  disputedAt?: string;
  escrowStatus?: "held" | "released" | "refunded";
  completedAt?: string;
  payoutStatus?: "escrow" | "processing" | "released" | "failed";
  payoutBypass48h?: boolean;
  deliveredWorkNotes?: string;
  deliveredWorkFileUrl?: string;
  revisionFeedback?: string;
  revisionCount?: number;
}

export interface ReferralTransaction {
  id: string;
  referrerId: string;
  referredUserId: string;
  orderId: string;
  amount: number; // 1.3% of platform commission
  platformCommission: number;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "order" | "account" | "system" | "payout" | "cart" | "welcome" | "profile";
  isRead: boolean;
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  vendorId: string;
  reason: string;
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  buyerId: string;
  buyerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface ProductHistory {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  productPrice: number;
  productImageUrl?: string;
  viewedAt: string;
}

export interface PayoutRequest {
  id: string;
  sellerId: string;
  amount: number;
  status: "pending" | "approved" | "rejected" | "paid";
  bankDetails: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  createdAt: string;
  processedAt?: string;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  sellerId: string;
  imageUrl?: string;
  deliveryOptions: {
    delivery: boolean;
    pickup: boolean;
    deliveryPrice?: number;
  };
  menuItemId?: string;
  menuItemName?: string;
  measureType?: string;
  measureAmount?: number;
  ticketTierId?: string;
  ticketTierName?: string;
  cheapDataHubPlanId?: string;
  cheapDataHubNetworkCode?: string;
  formResponses?: Record<string, string>;
  type?: "good" | "service";
  addedAt?: number;
}

export interface EventPlan {
  id: string;
  userId: string;
  title: string;
  description?: string;
  date: string;
  budget: number;
  checklist: EventTask[];
  guests: EventGuest[];
  createdAt: string;
  eventType?: string;
  isPaid?: boolean;
  ticketTiers?: {
    id: string;
    name: string;
    price: number;
    stock: number;
    imageUrl?: string;
  }[];
  formFields?: {
    id: string;
    label: string;
    type: "text" | "number" | "email" | "select";
    options?: string[];
    required: boolean;
  }[];
  isPublicListing?: boolean;
  listingId?: string; // Reference to the product ID inmarketplace
  location?: string;
  googleFormUrl?: string;
}

export interface EventTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface EventGuest {
  id: string;
  name: string;
  status: "invited" | "attending" | "declined";
}
