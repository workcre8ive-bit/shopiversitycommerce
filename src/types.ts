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
  id?: string;
  displayName: string;
  username: string;
  email: string;
  phoneNumber: string;
  phone?: string;
  photoURL?: string;
  role: "buyer" | "seller" | "admin" | "both";
  activeRole?: "buyer" | "seller";
  referralCode?: string;
  referredBy?: string;
  referralEarnings?: number;
  referralCount?: number;
  referralWalletBalance?: number;
  campus?: string;
  school?: string;
  schoolType?: string;
  schoolName?: string;
  verificationIdUrl?: string;
  idType?: string;
  idNumber?: string;
  verificationMethod?: "id" | "face" | "both";
  faceVerificationUrl?: string;
  isVerified: boolean;
  isSuspended: boolean;
  suspendedUntil?: string;
  suspensionReason?: string;
  bannedAt?: string;
  banType?: "temporary" | "permanent";
  bannedBy?: string;
  uniqueCode?: string;
  userCode?: string;
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
  recipientCode?: string;
  subaccountCode?: string;
  hibernatedUntil?: string;
  profileCompleted?: boolean;
  hasMadePurchase?: boolean;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    bankCode?: string;
    recipientCode?: string;
    subaccountCode?: string;
    verifiedAt?: string;
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
  status: "pending" | "accepted" | "out_for_delivery" | "delivered" | "cancelled" | "acquired" | "completed" | "Pending Seller Acceptance" | "Out To Pickup Station" | "Ready For Pickup" | "Out For Delivery" | "Order Picked Up" | "Order Delivered" | "Ready For Delivery" | "awaiting_payment" | "payment_required" | "Payment Required" | "transit" | "ready_for_pickup" | "In Transit" | "picked_up";
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
  deliveryFee?: number;
  deliveryPrice?: number;
  logisticsId?: string;
  logisticsName?: string;
  logisticsPhone?: string;
  logisticsDeliveryPrice?: number;
  logisticsEstimatedDeliveryTimeline?: string;
  logisticsAssignedAt?: string;
  logisticsAcceptedAt?: string;
  logisticsTimeline?: string;
  logisticsOfferStatus?: "pending" | "accepted" | "declined" | "completed";
  kwikRiderId?: string | null;
  kwikTrackingUrl?: string | null;
  confirmOrderPressed?: boolean;
  // Refund and dispute fields
  refundStatus?: "none" | "requested" | "under_review" | "approved" | "rejected" | "processing" | "completed";
  refundId?: string;
  refundAmount?: number;
  refundFee?: number;
  buyerRefundAmount?: number;
  refundReason?: string;
  refundReasonCategory?: string;
  refundEvidenceDetails?: string;
  refundEvidenceUrl?: string;
  refundCreatedAt?: string;
  refundApprovedAt?: string;
  refundCompletedAt?: string;
  refundDecisionNotes?: string;
  settlementOnHold?: boolean;
  // Pay on Delivery & verification completion
  buyerDeliveryConfirmed?: boolean;
  buyerDeliveryConfirmedAt?: string;
  paymentVerifiedAt?: string;
  handoverCode?: string;
  deliveryOtp?: string;
  pickupOtp?: string;
  handoverVerified?: boolean;
  handoverVerifiedAt?: string;
  paymentReceipt?: OrderPaymentReceipt;
}

export interface RefundRequest {
  id: string;
  orderId: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName?: string;
  logisticsId?: string;
  logisticsName?: string;
  originalOrderTotal: number;
  requestedAmount: number;
  approvedAmount?: number;
  feeRate: number; // 0.015 (1.5%)
  refundFee: number; // 1.5% of requested/approved amount
  buyerRefundAmount: number; // amount to be received by buyer
  reasonCategory: "item_not_received" | "wrong_item" | "damaged_item" | "significantly_different" | "tampered_package" | "quality_issue" | "seller_unresponsive" | "other";
  reason: string;
  evidenceDetails?: string;
  evidenceFileUrl?: string;
  status: "requested" | "under_review" | "approved" | "rejected" | "processing" | "completed";
  decisionNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface OrderAuditEvent {
  id: string;
  orderId: string;
  eventType: 
    | "ORDER_CREATED" 
    | "SELLER_ACCEPTED" 
    | "LOGISTICS_ASSIGNED" 
    | "LOGISTICS_ACCEPTED" 
    | "LOGISTICS_DECLINED" 
    | "HANDOVER_VERIFIED" 
    | "OUT_FOR_DELIVERY" 
    | "READY_FOR_PICKUP"
    | "DELIVERY_ARRIVED" 
    | "BUYER_DELIVERY_CONFIRMED" 
    | "PAYMENT_REQUIRED" 
    | "PAYMENT_VERIFIED" 
    | "ORDER_COMPLETED" 
    | "ORDER_CANCELLED" 
    | "REFUND_REQUESTED" 
    | "REFUND_UNDER_REVIEW" 
    | "REFUND_APPROVED" 
    | "REFUND_REJECTED" 
    | "REFUND_COMPLETED"
    | "ESCROW_FROZEN"
    | "ESCROW_RELEASED";
  previousStatus?: string;
  newStatus?: string;
  performedBy: string; // userId or system
  role: "buyer" | "seller" | "logistics" | "admin" | "system";
  actorName?: string;
  notes?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface OrderPaymentReceipt {
  receiptNumber: string;
  orderId: string;
  transactionId: string;
  paymentReference: string;
  paymentMethod: "online" | "pod";
  amountPaid: number;
  platformFee: number;
  buyerName: string;
  buyerPhone?: string;
  sellerName?: string;
  productName: string;
  quantity: number;
  deliveryType: "delivery" | "pickup";
  logisticsPartner?: string;
  verificationTimestamp: string;
  escrowStatus: "held" | "released" | "refunded";
  status: "verified" | "cleared";
}

export interface LogisticsCompany {
  id: string;
  companyName: string;
  rcNumber: string;
  email: string;
  phoneNumber: string;
  officeAddress: string;
  vehicleTypes: string[];
  coveredCampuses: string[];
  baseDeliveryPrice: number;
  estimatedTurnaround?: string;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  availableBalance?: number;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface DeliveryJob {
  id: string;
  orderId: string;
  productName: string;
  productImageUrl?: string;
  quantity: number;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  buyerAddress: string;
  sellerId: string;
  sellerName: string;
  sellerPhone?: string;
  sellerAddress: string;
  campus: string;
  status: "pending" | "accepted" | "picked_up" | "in_transit" | "delivered" | "cancelled" | "declined";
  logisticsId?: string;
  logisticsName?: string;
  logisticsPhone?: string;
  deliveryPrice: number;
  estimatedDeliveryTimeline?: string;
  payoutStatus?: "pending" | "released" | "paid";
  createdAt: string;
  updatedAt: string;
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
