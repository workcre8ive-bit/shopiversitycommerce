export interface LogisticsCompany {
  id: string;
  companyName: string;
  rcNumber: string;
  email: string;
  phoneNumber: string;
  whatsappNumber?: string;
  officeAddress: string;
  vehicleTypes: string[];
  coveredCampuses: string[];
  baseDeliveryPrice: number;
  estimatedTurnaround?: string;
  description?: string;
  operatingHours?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
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
  status: "pending" | "accepted" | "picked_up" | "in_transit" | "delivered" | "cancelled";
  logisticsId?: string;
  logisticsName?: string;
  deliveryPrice: number;
  estimatedDeliveryTimeline?: string;
  createdAt: string;
  updatedAt: string;
}
