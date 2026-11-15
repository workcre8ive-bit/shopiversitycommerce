import { EmailTemplateDefinition } from "./emailTypes.ts";

export const BUYER_EMAIL_TEMPLATES: EmailTemplateDefinition[] = [
  // ==================== ACCOUNT AND REGISTRATION (1-7) ====================
  {
    id: "buyer_welcome",
    code: "B-01",
    name: "Welcome Email After Successful Registration",
    recipientCategory: "buyer",
    section: "Account and Registration",
    classification: "transactional",
    subjectTemplate: "Welcome to Shopiversity, {{buyer_name}}",
    previewTextTemplate: "Your campus marketplace account is ready. Explore verified student vendors and escrow-backed deals.",
    badgeLabel: "WELCOME TO SHOPIVERSITY",
    badgeColor: "#ff6b00",
    heroTitleTemplate: "Welcome to Shopiversity",
    greetingTemplate: "Hello {{buyer_name}},",
    bodyParagraphs: [
      "Welcome to Shopiversity, the campus marketplace built to help students shop safely from verified campus sellers with 72-hour escrow protection.",
      "Your buyer account is now active on {{campus_name}}. Every online purchase you make stays protected in escrow until you inspect your item and confirm handover."
    ],
    detailRows: [
      { label: "Account Role", valueTemplate: "Student Buyer" },
      { label: "Campus Hub", valueTemplate: "{{campus_name}}", hideIfEmptyVar: "campus_name" },
      { label: "Escrow Protection", valueTemplate: "72-Hour Handover Guarantee" }
    ],
    ctaLabel: "Browse Campus Marketplace",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "buyer.registration_completed",
    requiredVariables: ["buyer_name", "campus_name", "dashboard_url", "support_email"],
    sendingConditions: "Send once immediately after user account creation and email verification succeed for a buyer role.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "buyer_email_verification",
    code: "B-02",
    name: "Buyer Email Verification",
    recipientCategory: "buyer",
    section: "Account and Registration",
    classification: "transactional",
    subjectTemplate: "{{verification_code}} is your Shopiversity Verification Code",
    previewTextTemplate: "Enter this 6-digit confirmation code to verify your Shopiversity email address.",
    badgeLabel: "ACCOUNT VERIFICATION",
    badgeColor: "#ea580c",
    heroTitleTemplate: "Verify Your Email Address",
    greetingTemplate: "Hello {{buyer_name}},",
    bodyParagraphs: [
      "Please enter the 6-digit verification code below on Shopiversity to confirm ownership of your email address and activate marketplace checkout.",
      "For your security, this verification code expires in 15 minutes."
    ],
    detailRows: [
      { label: "Account Email", valueTemplate: "{{recipient_email}}", hideIfEmptyVar: "recipient_email" },
      { label: "Code Validity", valueTemplate: "15 Minutes" }
    ],
    highlightPinVar: "verification_code",
    highlightPinLabel: "6-Digit Verification Code",
    ctaLabel: "Return to Verification",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "auth.email_verification_requested",
    requiredVariables: ["buyer_name", "verification_code", "recipient_email", "dashboard_url", "support_email"],
    sendingConditions: "Send on signup or explicit resend request; rate-limited to prevent OTP flooding.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "buyer_email_verified",
    code: "B-03",
    name: "Successful Email Verification",
    recipientCategory: "buyer",
    section: "Account and Registration",
    classification: "transactional",
    subjectTemplate: "Email Verified - Your Shopiversity Account is Active",
    previewTextTemplate: "Your email verification is complete. You can now place escrow-protected orders.",
    badgeLabel: "EMAIL VERIFIED",
    badgeColor: "#10b981",
    heroTitleTemplate: "Your Email Address is Verified",
    greetingTemplate: "Hello {{buyer_name}},",
    bodyParagraphs: [
      "Thank you for verifying your email address. Your Shopiversity account now has full access to campus shopping, wishlist alerts, chat messaging, and live order tracking.",
      "Whenever you shop on Shopiversity, never share your Delivery PIN until you have inspected the delivered item."
    ],
    detailRows: [
      { label: "Verification Status", valueTemplate: "Verified" },
      { label: "Account Access", valueTemplate: "Full Marketplace & Escrow Checkout" }
    ],
    ctaLabel: "Start Shopping",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "auth.email_verified",
    requiredVariables: ["buyer_name", "dashboard_url", "support_email"],
    sendingConditions: "Send once when `emailVerified` transitions from false to true.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "buyer_password_reset_request",
    code: "B-04",
    name: "Password Reset Request",
    recipientCategory: "buyer",
    section: "Account and Registration",
    classification: "transactional",
    subjectTemplate: "{{reset_code}} is your Shopiversity Password Reset Code",
    previewTextTemplate: "Use this 6-digit security code within 15 minutes to reset your Shopiversity password.",
    badgeLabel: "SECURITY CODE",
    badgeColor: "#ef4444",
    heroTitleTemplate: "Reset Your Account Password",
    greetingTemplate: "Hello {{buyer_name}},",
    bodyParagraphs: [
      "We received a request to reset the password for your Shopiversity account. Enter the 6-digit security code below on the password reset page.",
      "If you did not request a password reset, you can safely ignore this message—your current password has not been changed."
    ],
    detailRows: [
      { label: "Requested For", valueTemplate: "{{recipient_email}}", hideIfEmptyVar: "recipient_email" },
      { label: "Expires In", valueTemplate: "15 Minutes" }
    ],
    highlightPinVar: "reset_code",
    highlightPinLabel: "Password Reset Security Code",
    ctaLabel: "Open Password Reset",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "auth.password_reset_requested",
    requiredVariables: ["buyer_name", "reset_code", "recipient_email", "dashboard_url", "support_email"],
    sendingConditions: "Send only when the email matches an existing password-enabled account.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "buyer_password_changed",
    code: "B-05",
    name: "Password Successfully Changed",
    recipientCategory: "buyer",
    section: "Account and Registration",
    classification: "transactional",
    subjectTemplate: "Security Notice: Your Shopiversity Password Was Changed",
    previewTextTemplate: "Your password update is complete. Contact support immediately if you did not make this change.",
    badgeLabel: "SECURITY CONFIRMATION",
    badgeColor: "#0f172a",
    heroTitleTemplate: "Password Successfully Updated",
    greetingTemplate: "Hello {{buyer_name}},",
    bodyParagraphs: [
      "This confirms that the password for your Shopiversity account was recently updated.",
      "If you made this change, no further action is needed. If you did not authorize this update, please contact {{support_email}} right away so our security desk can lock your account."
    ],
    detailRows: [
      { label: "Event Time", valueTemplate: "{{event_timestamp}}", hideIfEmptyVar: "event_timestamp" },
      { label: "Security Status", valueTemplate: "Password Updated" }
    ],
    ctaLabel: "Review Account Security",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "auth.password_changed",
    requiredVariables: ["buyer_name", "event_timestamp", "dashboard_url", "support_email"],
    sendingConditions: "Send unconditionally whenever password change completes via Auth reset or profile security settings.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "buyer_new_device_login",
    code: "B-06",
    name: "Login From a New Device or Suspicious Login Alert",
    recipientCategory: "buyer",
    section: "Account and Registration",
    classification: "transactional",
    subjectTemplate: "Security Alert: New Sign-In Detected on Your Shopiversity Account",
    previewTextTemplate: "A sign-in occurred from a new browser or device. Verify it was you.",
    badgeLabel: "NEW DEVICE SIGN-IN",
    badgeColor: "#dc2626",
    heroTitleTemplate: "New Device Login Detected",
    greetingTemplate: "Hello {{buyer_name}},",
    bodyParagraphs: [
      "Your Shopiversity account was just signed into from a new browser or unrecognized device.",
      "If this was you, you can continue shopping safely. If you do not recognize this activity, reset your password immediately and alert {{support_email}}."
    ],
    detailRows: [
      { label: "Device / Browser", valueTemplate: "{{device_info}}", hideIfEmptyVar: "device_info" },
      { label: "Time", valueTemplate: "{{event_timestamp}}", hideIfEmptyVar: "event_timestamp" },
      { label: "Location / Campus", valueTemplate: "{{campus_name}}", hideIfEmptyVar: "campus_name" }
    ],
    ctaLabel: "Secure My Account",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "auth.new_device_login",
    requiredVariables: ["buyer_name", "device_info", "event_timestamp", "campus_name", "dashboard_url", "support_email"],
    sendingConditions: "Send when login succeeds and device fingerprint differs from previously trusted local/server device history.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "buyer_profile_updated",
    code: "B-07",
    name: "Profile Information Updated",
    recipientCategory: "buyer",
    section: "Account and Registration",
    classification: "transactional",
    subjectTemplate: "Shopiversity Profile Information Updated",
    previewTextTemplate: "Your buyer profile or delivery details were recently updated.",
    badgeLabel: "PROFILE UPDATED",
    badgeColor: "#3b82f6",
    heroTitleTemplate: "Account Details Saved",
    greetingTemplate: "Hello {{buyer_name}},",
    bodyParagraphs: [
      "Your Shopiversity profile details (such as your name, phone number, campus, or delivery address) have been saved successfully.",
      "Keeping an accurate delivery address and phone number helps campus couriers hand over your orders faster."
    ],
    detailRows: [
      { label: "Campus", valueTemplate: "{{campus_name}}", hideIfEmptyVar: "campus_name" },
      { label: "Delivery Address", valueTemplate: "{{delivery_address}}", hideIfEmptyVar: "delivery_address" },
      { label: "Updated At", valueTemplate: "{{event_timestamp}}", hideIfEmptyVar: "event_timestamp" }
    ],
    ctaLabel: "View Profile Settings",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "user.profile_updated",
    requiredVariables: ["buyer_name", "campus_name", "delivery_address", "event_timestamp", "dashboard_url", "support_email"],
    sendingConditions: "Send only when profile save succeeds in Firestore.",
    recommendedSchedule: "Immediate (Real-time)"
  },

  // ==================== SHOPPING AND ORDERS (8-22) ====================
  {
    id: "buyer_order_confirmation",
    code: "B-08",
    name: "Order Confirmation",
    recipientCategory: "buyer",
    section: "Shopping and Orders",
    classification: "transactional",
    subjectTemplate: "Shopiversity Order {{order_id}} Confirmed - {{product_name}}",
    previewTextTemplate: "Your order has been placed with {{seller_name}}. Keep your handover PIN safe until delivery.",
    badgeLabel: "ORDER CONFIRMED",
    badgeColor: "#3b82f6",
    heroTitleTemplate: "Order Placed Successfully",
    greetingTemplate: "Hello {{buyer_name}},",
    bodyParagraphs: [
      "Thank you for shopping on Shopiversity. Your order for {{product_name}} has been sent to {{seller_name}} for confirmation.",
      "Do not share your Delivery PIN with anyone until you have inspected the physical product at handover."
    ],
    detailRows: [
      { label: "Order ID", valueTemplate: "{{order_id}}" },
      { label: "Item", valueTemplate: "{{product_name}}" },
      { label: "Seller", valueTemplate: "{{seller_name}}" },
      { label: "Order Total", valueTemplate: "{{order_total}}" },
      { label: "Payment Status", valueTemplate: "{{payment_status}}" },
      { label: "Delivery Address", valueTemplate: "{{delivery_address}}", hideIfEmptyVar: "delivery_address" }
    ],
    highlightPinVar: "delivery_pin",
    highlightPinLabel: "Secure Handover Delivery PIN",
    ctaLabel: "Track My Order",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "order.created",
    requiredVariables: ["buyer_name", "order_id", "product_name", "seller_name", "order_total", "payment_status", "delivery_address", "delivery_pin", "dashboard_url", "support_email"],
    sendingConditions: "Send once per created order document; suppress duplicates using `order_placed_{{order_id}}_buyer`.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "buyer_order_payment_successful",
    code: "B-09",
    name: "Order Payment Successful",
    recipientCategory: "buyer",
    section: "Shopping and Orders",
    classification: "transactional",
    subjectTemplate: "Escrow Payment Receipt: Order {{order_id}} ({{order_total}})",
    previewTextTemplate: "Your payment of {{order_total}} is verified and safely held in Shopiversity Escrow.",
    badgeLabel: "ESCROW PAYMENT VERIFIED",
    badgeColor: "#10b981",
    heroTitleTemplate: "Payment Secured in Escrow",
    greetingTemplate: "Hello {{buyer_name}},",
    bodyParagraphs: [
      "We have verified your payment of {{order_total}} for order {{order_id}}.",
      "Your funds are held securely inside Shopiversity Escrow and will only be disbursed to {{seller_name}} after you confirm receipt of your order."
    ],
    detailRows: [
      { label: "Order ID", valueTemplate: "{{order_id}}" },
      { label: "Product", valueTemplate: "{{product_name}}" },
      { label: "Amount Paid", valueTemplate: "{{order_total}}" },
      { label: "Payment Status", valueTemplate: "Paid (Escrow Held)" },
      { label: "Merchant", valueTemplate: "{{seller_name}}" }
    ],
    ctaLabel: "View Escrow Receipt",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "order.payment_succeeded",
    requiredVariables: ["buyer_name", "order_id", "product_name", "order_total", "seller_name", "dashboard_url", "support_email"],
    sendingConditions: "Send strictly when `paymentStatus === 'paid'` and Paystack/payment verification succeeds.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "buyer_payment_failed",
    code: "B-10",
    name: "Payment Failed",
    recipientCategory: "buyer",
    section: "Shopping and Orders",
    classification: "transactional",
    subjectTemplate: "Action Needed: Payment Did Not Complete for Order {{order_id}}",
    previewTextTemplate: "Your payment attempt for {{product_name}} was unsuccessful. Retry safely in your dashboard.",
    badgeLabel: "PAYMENT FAILED",
    badgeColor: "#ef4444",
    heroTitleTemplate: "Order Payment Unsuccessful",
    greetingTemplate: "Hello {{buyer_name}},",
    bodyParagraphs: [
      "Your recent payment attempt of {{order_total}} for {{product_name}} could not be completed.",
      "No funds were captured into escrow for this attempt. You can retry checkout anytime from your Orders tab or cart."
    ],
    detailRows: [
      { label: "Order Reference", valueTemplate: "{{order_id}}" },
      { label: "Product", valueTemplate: "{{product_name}}" },
      { label: "Amount", valueTemplate: "{{order_total}}" },
      { label: "Reason", valueTemplate: "{{failure_reason}}", hideIfEmptyVar: "failure_reason" }
    ],
    ctaLabel: "Retry Payment",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "order.payment_failed",
    requiredVariables: ["buyer_name", "order_id", "product_name", "order_total", "failure_reason", "dashboard_url", "support_email"],
    sendingConditions: "Send only when payment gateway returns failure or verification error.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "buyer_order_awaiting_payment",
    code: "B-11",
    name: "Order Awaiting Payment",
    recipientCategory: "buyer",
    section: "Shopping and Orders",
    classification: "transactional",
    subjectTemplate: "Complete Payment for Order {{order_id}} - {{product_name}}",
    previewTextTemplate: "Your order is confirmed and awaiting escrow payment settlement.",
    badgeLabel: "AWAITING PAYMENT",
    badgeColor: "#f59e0b",
    heroTitleTemplate: "Payment Required to Complete Order",
    greetingTemplate: "Hello {{buyer_name}},",
    bodyParagraphs: [
      "Your order {{order_id}} for {{product_name}} from {{seller_name}} is ready for settlement.",
      "Please complete your payment inside your Orders dashboard so your transaction remains protected by Shopiversity Escrow."
    ],
    detailRows: [
      { label: "Order ID", valueTemplate: "{{order_id}}" },
      { label: "Product", valueTemplate: "{{product_name}}" },
      { label: "Amount Due", valueTemplate: "{{order_total}}" },
      { label: "Payment Status", valueTemplate: "Awaiting Payment" }
    ],
    ctaLabel: "Complete Payment Now",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "order.awaiting_payment",
    requiredVariables: ["buyer_name", "order_id", "product_name", "seller_name", "order_total", "dashboard_url", "support_email"],
    sendingConditions: "Send when service/POD order reaches `awaiting_payment` / `payment_required` status.",
    recommendedSchedule: "Immediate + reminder after 24 hours if unpaid"
  },
  {
    id: "buyer_order_processing",
    code: "B-12",
    name: "Order Processing",
    recipientCategory: "buyer",
    section: "Shopping and Orders",
    classification: "transactional",
    subjectTemplate: "Order {{order_id}} is Being Prepared by {{seller_name}}",
    previewTextTemplate: "Your vendor is packing {{product_name}} for campus handover.",
    badgeLabel: "ORDER PROCESSING",
    badgeColor: "#3b82f6",
    heroTitleTemplate: "Your Order is Being Prepared",
    greetingTemplate: "Hello {{buyer_name}},",
    bodyParagraphs: [
      "{{seller_name}} is currently preparing and packaging {{product_name}} for your order {{order_id}}.",
      "You will receive your next update as soon as a logistics courier or pickup point receives the package."
    ],
    detailRows: [
      { label: "Order ID", valueTemplate: "{{order_id}}" },
      { label: "Item", valueTemplate: "{{product_name}}" },
      { label: "Merchant", valueTemplate: "{{seller_name}}" },
      { label: "Delivery Status", valueTemplate: "{{delivery_status}}" }
    ],
    ctaLabel: "Check Order Progress",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "order.processing",
    requiredVariables: ["buyer_name", "order_id", "product_name", "seller_name", "delivery_status", "dashboard_url", "support_email"],
    sendingConditions: "Send when seller begins packing or preparing order.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "buyer_order_confirmed_by_seller",
    code: "B-13",
    name: "Order Confirmed by Seller",
    recipientCategory: "buyer",
    section: "Shopping and Orders",
    classification: "transactional",
    subjectTemplate: "Seller Confirmed Order {{order_id}} - {{product_name}}",
    previewTextTemplate: "{{seller_name}} accepted your order and is getting it ready.",
    badgeLabel: "SELLER ACCEPTED",
    badgeColor: "#3b82f6",
    heroTitleTemplate: "Seller Confirmed Your Order",
    greetingTemplate: "Hello {{buyer_name}},",
    bodyParagraphs: [
      "Good news! {{seller_name}} has accepted order {{order_id}} for {{product_name}} and started fulfillment.",
      "Track live courier assignment and pickup steps right inside your Shopiversity Orders screen."
    ],
    detailRows: [
      { label: "Order ID", valueTemplate: "{{order_id}}" },
      { label: "Product", valueTemplate: "{{product_name}}" },
      { label: "Store", valueTemplate: "{{store_name}}", hideIfEmptyVar: "store_name" },
      { label: "Estimated Delivery", valueTemplate: "{{estimated_delivery_date}}", hideIfEmptyVar: "estimated_delivery_date" }
    ],
    highlightPinVar: "delivery_pin",
    highlightPinLabel: "Your Buyer Handover PIN",
    ctaLabel: "Track Order Status",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "order.accepted_by_seller",
    requiredVariables: ["buyer_name", "order_id", "product_name", "seller_name", "store_name", "estimated_delivery_date", "delivery_pin", "dashboard_url", "support_email"],
    sendingConditions: "Send when seller transitions order status from pending to accepted.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "buyer_order_rejected_by_seller",
    code: "B-14",
    name: "Seller Rejected or Cancelled Order",
    recipientCategory: "buyer",
    section: "Shopping and Orders",
    classification: "transactional",
    subjectTemplate: "Order {{order_id}} Could Not Be Fulfilled by {{seller_name}}",
    previewTextTemplate: "{{seller_name}} declined or cancelled this order. Any paid escrow amount is protected.",
    badgeLabel: "ORDER DECLINED BY SELLER",
    badgeColor: "#ef4444",
    heroTitleTemplate: "Seller Cancelled Your Order",
    greetingTemplate: "Hello {{buyer_name}},",
    bodyParagraphs: [
      "Unfortunately, {{seller_name}} was unable to fulfill order {{order_id}} for {{product_name}} and has cancelled the request.",
      "If you already paid via online escrow, your full amount ({{order_total}}) is safeguarded and queued for automatic refund."
    ],
    detailRows: [
      { label: "Order ID", valueTemplate: "{{order_id}}" },
      { label: "Product", valueTemplate: "{{product_name}}" },
      { label: "Order Total", valueTemplate: "{{order_total}}" },
      { label: "Cancellation Note", valueTemplate: "{{cancellation_reason}}", hideIfEmptyVar: "cancellation_reason" }
    ],
    ctaLabel: "Browse Similar Products",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "order.cancelled_by_seller",
    requiredVariables: ["buyer_name", "order_id", "product_name", "seller_name", "order_total", "cancellation_reason", "dashboard_url", "support_email"],
    sendingConditions: "Send only when seller rejects or cancels an order.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "buyer_order_partially_fulfilled",
    code: "B-15",
    name: "Order Partially Fulfilled",
    recipientCategory: "buyer",
    section: "Shopping and Orders",
    classification: "transactional",
    subjectTemplate: "Partial Fulfillment Update for Order {{order_id}}",
    previewTextTemplate: "Part of your order is ready/on the way while remaining items are being finalized.",
    badgeLabel: "PARTIAL FULFILLMENT",
    badgeColor: "#8b5cf6",
    heroTitleTemplate: "Order Partially Fulfilled",
    greetingTemplate: "Hello {{buyer_name}},",
    bodyParagraphs: [
      "An initial portion of your order {{order_id}} from {{seller_name}} has been dispatched, while the remaining items are still being processed.",
      "You can inspect individual item statuses inside your Orders dashboard."
    ],
    detailRows: [
      { label: "Order ID", valueTemplate: "{{order_id}}" },
      { label: "Items Dispatched", valueTemplate: "{{product_name}}" },
      { label: "Delivery Status", valueTemplate: "{{delivery_status}}" }
    ],
    ctaLabel: "View Order Breakdown",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "order.partially_fulfilled",
    requiredVariables: ["buyer_name", "order_id", "product_name", "seller_name", "delivery_status", "dashboard_url", "support_email"],
    sendingConditions: "Send when multi-item cart/order split dispatches part of the quantity.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "buyer_order_shipped",
    code: "B-16",
    name: "Order Shipped / In Transit",
    recipientCategory: "buyer",
    section: "Shopping and Orders",
    classification: "transactional",
    subjectTemplate: "Order {{order_id}} Picked Up & In Transit via {{courier_name}}",
    previewTextTemplate: "{{courier_name}} collected {{product_name}} from {{seller_name}}.",
    badgeLabel: "IN TRANSIT",
    badgeColor: "#6366f1",
    heroTitleTemplate: "Your Order Is On the Way",
    greetingTemplate: "Hello {{buyer_name}},",
    bodyParagraphs: [
      "{{courier_name}} has picked up {{product_name}} from {{seller_name}} and your package is now in transit.",
      "Keep your Tracking Reference and Delivery PIN handy until you physically inspect the item."
    ],
    detailRows: [
      { label: "Order ID", valueTemplate: "{{order_id}}" },
      { label: "Tracking Number", valueTemplate: "{{tracking_number}}", hideIfEmptyVar: "tracking_number" },
      { label: "Courier Partner", valueTemplate: "{{courier_name}}" },
      { label: "Estimated Delivery", valueTemplate: "{{estimated_delivery_date}}", hideIfEmptyVar: "estimated_delivery_date" }
    ],
    highlightPinVar: "delivery_pin",
    highlightPinLabel: "Buyer Delivery PIN",
    ctaLabel: "Live Order Tracking",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "logistics.package_picked_up",
    requiredVariables: ["buyer_name", "order_id", "product_name", "seller_name", "courier_name", "tracking_number", "estimated_delivery_date", "delivery_pin", "dashboard_url", "support_email"],
    sendingConditions: "Send when logistics courier verifies Seller Handover PIN or updates delivery to `picked_up`.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "buyer_order_out_for_delivery",
    code: "B-17",
    name: "Order Out for Delivery",
    recipientCategory: "buyer",
    section: "Shopping and Orders",
    classification: "transactional",
    subjectTemplate: "Out for Delivery: Order {{order_id}} Arriving Shortly",
    previewTextTemplate: "{{courier_name}} is heading to {{delivery_address}} with {{product_name}}.",
    badgeLabel: "OUT FOR DELIVERY",
    badgeColor: "#7c3aed",
    heroTitleTemplate: "Your Courier Is Nearby",
    greetingTemplate: "Hello {{buyer_name}},",
    bodyParagraphs: [
      "Your Shopiversity courier ({{courier_name}}) is currently out for doorstep delivery with {{product_name}}.",
      "Please inspect the package carefully upon arrival before providing your 6-digit Delivery PIN to the rider."
    ],
    detailRows: [
      { label: "Order ID", valueTemplate: "{{order_id}}" },
      { label: "Courier Partner", valueTemplate: "{{courier_name}}" },
      { label: "Drop-Off Location", valueTemplate: "{{delivery_address}}", hideIfEmptyVar: "delivery_address" },
      { label: "Tracking Reference", valueTemplate: "{{tracking_number}}", hideIfEmptyVar: "tracking_number" }
    ],
    highlightPinVar: "delivery_pin",
    highlightPinLabel: "6-Digit Delivery PIN (Inspect First)",
    ctaLabel: "Open Order Tracking",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "logistics.out_for_delivery",
    requiredVariables: ["buyer_name", "order_id", "product_name", "courier_name", "delivery_address", "tracking_number", "delivery_pin", "dashboard_url", "support_email"],
    sendingConditions: "Send when delivery milestone switches to `in_transit` / `out_for_delivery`.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "buyer_order_delivered",
    code: "B-18",
    name: "Order Delivered Successfully",
    recipientCategory: "buyer",
    section: "Shopping and Orders",
    classification: "transactional",
    subjectTemplate: "Order {{order_id}} Reached You - Inspect & Confirm Receipt",
    previewTextTemplate: "{{product_name}} has been marked delivered. Inspect it and confirm completion in your Orders tab.",
    badgeLabel: "ORDER DELIVERED",
    badgeColor: "#10b981",
    heroTitleTemplate: "Your Order Has Been Delivered",
    greetingTemplate: "Hello {{buyer_name}},",
    bodyParagraphs: [
      "Your order {{order_id}} for {{product_name}} has reached you and been marked delivered by {{courier_name}}.",
      "Please inspect your item right away and tap Confirm Received inside your Orders tab. You remain protected under our 72-hour post-delivery escrow window."
    ],
    detailRows: [
      { label: "Order ID", valueTemplate: "{{order_id}}" },
      { label: "Product", valueTemplate: "{{product_name}}" },
      { label: "Delivered By", valueTemplate: "{{courier_name}}", hideIfEmptyVar: "courier_name" },
      { label: "Escrow Protection", valueTemplate: "72 Hours Remaining for Disputes" }
    ],
    ctaLabel: "Confirm Order Completion",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "order.delivered_to_buyer",
    requiredVariables: ["buyer_name", "order_id", "product_name", "courier_name", "dashboard_url", "support_email"],
    sendingConditions: "Send when courier verifies Buyer Delivery PIN or marks order delivered.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "buyer_order_delivery_failed",
    code: "B-19",
    name: "Order Delivery Failed",
    recipientCategory: "buyer",
    section: "Shopping and Orders",
    classification: "transactional",
    subjectTemplate: "Delivery Attempt Unsuccessful for Order {{order_id}}",
    previewTextTemplate: "{{courier_name}} could not complete delivery to {{delivery_address}}. Reschedule handover.",
    badgeLabel: "DELIVERY ATTEMPT FAILED",
    badgeColor: "#f59e0b",
    heroTitleTemplate: "We Missed You at Drop-Off",
    greetingTemplate: "Hello {{buyer_name}},",
    bodyParagraphs: [
      "{{courier_name}} attempted to deliver order {{order_id}} ({{product_name}}) today, but the handover could not be completed.",
      "Please review your phone availability and delivery address in Shopiversity to coordinate the next delivery attempt or campus pickup."
    ],
    detailRows: [
      { label: "Order ID", valueTemplate: "{{order_id}}" },
      { label: "Reason", valueTemplate: "{{failure_reason}}", hideIfEmptyVar: "failure_reason" },
      { label: "Delivery Address", valueTemplate: "{{delivery_address}}", hideIfEmptyVar: "delivery_address" }
    ],
    ctaLabel: "Update Delivery Details",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "logistics.delivery_failed",
    requiredVariables: ["buyer_name", "order_id", "product_name", "courier_name", "failure_reason", "delivery_address", "dashboard_url", "support_email"],
    sendingConditions: "Send when courier logs `delivery_failed` or `customer_unavailable`.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "buyer_order_cancelled",
    code: "B-20",
    name: "Order Cancelled",
    recipientCategory: "buyer",
    section: "Shopping and Orders",
    classification: "transactional",
    subjectTemplate: "Cancellation Confirmed: Order {{order_id}}",
    previewTextTemplate: "Your order for {{product_name}} has been cancelled.",
    badgeLabel: "ORDER CANCELLED",
    badgeColor: "#dc2626",
    heroTitleTemplate: "Order Has Been Cancelled",
    greetingTemplate: "Hello {{buyer_name}},",
    bodyParagraphs: [
      "This confirms that order {{order_id}} for {{product_name}} ({{order_total}}) has been cancelled.",
      "If any funds were held in Shopiversity Escrow, an automatic refund review has been triggered back to your original payment method or settlement bank."
    ],
    detailRows: [
      { label: "Order ID", valueTemplate: "{{order_id}}" },
      { label: "Product", valueTemplate: "{{product_name}}" },
      { label: "Total", valueTemplate: "{{order_total}}" },
      { label: "Status", valueTemplate: "Cancelled" }
    ],
    ctaLabel: "View Orders",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "order.cancelled",
    requiredVariables: ["buyer_name", "order_id", "product_name", "order_total", "dashboard_url", "support_email"],
    sendingConditions: "Send once when order moves to `cancelled` status.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "buyer_refund_initiated",
    code: "B-21",
    name: "Order Refund Initiated",
    recipientCategory: "buyer",
    section: "Shopping and Orders",
    classification: "transactional",
    subjectTemplate: "Refund Request Received for Order {{order_id}}",
    previewTextTemplate: "Your refund request ({{order_total}}) has been logged and escrow funds are frozen for review.",
    badgeLabel: "REFUND INITIATED",
    badgeColor: "#f97316",
    heroTitleTemplate: "Escrow Refund Request Lodged",
    greetingTemplate: "Hello {{buyer_name}},",
    bodyParagraphs: [
      "We have received your refund request for order {{order_id}} ({{product_name}}). Payout to the vendor has been frozen while our Escrow Dispute Team reviews your submission.",
      "Most refund reviews are completed within 24 hours."
    ],
    detailRows: [
      { label: "Order ID", valueTemplate: "{{order_id}}" },
      { label: "Requested Refund", valueTemplate: "{{order_total}}" },
      { label: "Reason", valueTemplate: "{{refund_reason}}", hideIfEmptyVar: "refund_reason" }
    ],
    ctaLabel: "Track Refund Status",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "refund.requested",
    requiredVariables: ["buyer_name", "order_id", "product_name", "order_total", "refund_reason", "dashboard_url", "support_email"],
    sendingConditions: "Send when buyer submits a refund claim in `refunds` collection.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "buyer_refund_processed",
    code: "B-22",
    name: "Refund Successfully Processed",
    recipientCategory: "buyer",
    section: "Shopping and Orders",
    classification: "transactional",
    subjectTemplate: "Refund Processed for Order {{order_id}} ({{order_total}})",
    previewTextTemplate: "Your Shopiversity Escrow refund has been approved and settled.",
    badgeLabel: "REFUND PROCESSED",
    badgeColor: "#10b981",
    heroTitleTemplate: "Refund Successfully Processed",
    greetingTemplate: "Hello {{buyer_name}},",
    bodyParagraphs: [
      "Your refund for order {{order_id}} ({{product_name}}) has been approved and processed back to your designated payment method or bank account.",
      "Bank settlements typically reflect within 1 to 3 business days depending on your bank."
    ],
    detailRows: [
      { label: "Order ID", valueTemplate: "{{order_id}}" },
      { label: "Net Refund Amount", valueTemplate: "{{order_total}}" },
      { label: "Status", valueTemplate: "Refund Completed" }
    ],
    ctaLabel: "View Order History",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "refund.completed",
    requiredVariables: ["buyer_name", "order_id", "product_name", "order_total", "dashboard_url", "support_email"],
    sendingConditions: "Send only when refund status transitions to `approved` or `completed`.",
    recommendedSchedule: "Immediate (Real-time)"
  },

  // ==================== CUSTOMER ENGAGEMENT (23-30) ====================
  {
    id: "buyer_abandoned_cart",
    code: "B-23",
    name: "Abandoned Shopping Cart Reminder",
    recipientCategory: "buyer",
    section: "Customer Engagement",
    classification: "marketing",
    subjectTemplate: "Still thinking about {{product_name}} on Shopiversity?",
    previewTextTemplate: "Items in your campus cart may sell out soon. Complete checkout safely with Escrow.",
    badgeLabel: "CART REMINDER",
    badgeColor: "#ff6b00",
    heroTitleTemplate: "You Left Items in Your Cart",
    greetingTemplate: "Hello {{buyer_name}},",
    bodyParagraphs: [
      "You still have {{product_name}} waiting in your Shopiversity shopping cart.",
      "Campus vendor inventory moves quickly. Complete your order whenever you are ready and enjoy full 72-hour Shopiversity Escrow protection."
    ],
    detailRows: [
      { label: "Item in Cart", valueTemplate: "{{product_name}}" },
      { label: "Cart Total", valueTemplate: "{{order_total}}", hideIfEmptyVar: "order_total" },
      { label: "Seller", valueTemplate: "{{seller_name}}", hideIfEmptyVar: "seller_name" }
    ],
    ctaLabel: "Return to My Cart",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "cart.abandoned",
    requiredVariables: ["buyer_name", "product_name", "order_total", "seller_name", "dashboard_url", "support_email"],
    sendingConditions: "Requires `marketingOptIn === true` and `abandonedCartReminders === true`; only trigger when cart has unselected checkout after >= 2 hours and item is in stock.",
    recommendedSchedule: "2 hours after cart inactivity (max 1 reminder per 72 hours)"
  },
  {
    id: "buyer_wishlist_price_drop",
    code: "B-24",
    name: "Wishlist Product Price Drop Notification",
    recipientCategory: "buyer",
    section: "Customer Engagement",
    classification: "marketing",
    subjectTemplate: "Price Drop Alert: {{product_name}} is now {{order_total}}",
    previewTextTemplate: "An item saved in your Shopiversity wishlist just dropped in price.",
    badgeLabel: "WISHLIST PRICE DROP",
    badgeColor: "#10b981",
    heroTitleTemplate: "Price Drop on Your Saved Item",
    greetingTemplate: "Hello {{buyer_name}},",
    bodyParagraphs: [
      "Great news! {{seller_name}} just reduced the price on {{product_name}}, an item saved to your Shopiversity wishlist.",
      "Grab it before campus stock runs out."
    ],
    detailRows: [
      { label: "Product", valueTemplate: "{{product_name}}" },
      { label: "New Price", valueTemplate: "{{order_total}}" },
      { label: "Previous Price", valueTemplate: "{{previous_price}}", hideIfEmptyVar: "previous_price" },
      { label: "Merchant", valueTemplate: "{{seller_name}}" }
    ],
    ctaLabel: "View Deal Now",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "wishlist.price_dropped",
    requiredVariables: ["buyer_name", "product_name", "order_total", "previous_price", "seller_name", "dashboard_url", "support_email"],
    sendingConditions: "Requires `marketingOptIn === true` and `wishlistAlerts === true`; price decreased by >= 5%.",
    recommendedSchedule: "Immediate or batched every 6 hours"
  },
  {
    id: "buyer_wishlist_back_in_stock",
    code: "B-25",
    name: "Wishlist Item Back in Stock",
    recipientCategory: "buyer",
    section: "Customer Engagement",
    classification: "marketing",
    subjectTemplate: "Back in Stock: {{product_name}} Is Available Again",
    previewTextTemplate: "{{seller_name}} just restocked {{product_name}} on Shopiversity.",
    badgeLabel: "BACK IN STOCK",
    badgeColor: "#4f46e5",
    heroTitleTemplate: "Your Wishlist Item Is Back",
    greetingTemplate: "Hello {{buyer_name}},",
    bodyParagraphs: [
      "{{product_name}} from {{seller_name}} has just been restocked and is ready to order again on Shopiversity.",
      "Act fast before this batch sells out."
    ],
    detailRows: [
      { label: "Product", valueTemplate: "{{product_name}}" },
      { label: "Current Price", valueTemplate: "{{order_total}}" },
      { label: "Store", valueTemplate: "{{store_name}}", hideIfEmptyVar: "store_name" }
    ],
    ctaLabel: "Order Now",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "wishlist.back_in_stock",
    requiredVariables: ["buyer_name", "product_name", "order_total", "seller_name", "store_name", "dashboard_url", "support_email"],
    sendingConditions: "Requires `marketingOptIn === true` and `wishlistAlerts === true`; item stock transitioned from 0 to > 0.",
    recommendedSchedule: "Immediate upon restock"
  },
  {
    id: "buyer_special_promotions",
    code: "B-26",
    name: "Special Promotions and Discounts",
    recipientCategory: "buyer",
    section: "Customer Engagement",
    classification: "marketing",
    subjectTemplate: "Campus Marketplace Deals: {{promo_title}}",
    previewTextTemplate: "Explore student-only discounts from verified vendors across {{campus_name}}.",
    badgeLabel: "CAMPUS DEALS",
    badgeColor: "#ff6b00",
    heroTitleTemplate: "{{promo_title}}",
    greetingTemplate: "Hello {{buyer_name}},",
    bodyParagraphs: [
      "New student deals and seasonal campus discounts are now live on Shopiversity for {{campus_name}}.",
      "Every participating seller remains covered by our 72-hour Escrow Purchase Guarantee."
    ],
    detailRows: [
      { label: "Featured Offer", valueTemplate: "{{promo_title}}" },
      { label: "Campus Hub", valueTemplate: "{{campus_name}}", hideIfEmptyVar: "campus_name" }
    ],
    ctaLabel: "Explore Active Deals",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "marketing.campaign_launched",
    requiredVariables: ["buyer_name", "promo_title", "campus_name", "dashboard_url", "support_email"],
    sendingConditions: "Strictly send ONLY to users with `marketingOptIn === true` and `promotions === true`. Include one-click unsubscribe.",
    recommendedSchedule: "Weekly / Campaign Window (Max 1-2 per week)"
  },
  {
    id: "buyer_new_products_favourite_seller",
    code: "B-27",
    name: "New Products From Favourite Sellers",
    recipientCategory: "buyer",
    section: "Customer Engagement",
    classification: "marketing",
    subjectTemplate: "New Arrival from {{store_name}}: {{product_name}}",
    previewTextTemplate: "A campus vendor you shopped with just listed new items on Shopiversity.",
    badgeLabel: "NEW STORE DROP",
    badgeColor: "#6366f1",
    heroTitleTemplate: "Fresh Listing from {{store_name}}",
    greetingTemplate: "Hello {{buyer_name}},",
    bodyParagraphs: [
      "{{store_name}} ({{seller_name}}), one of your favourite campus stores on Shopiversity, just published {{product_name}}.",
      "Check out the listing and specifications before the initial stock runs out."
    ],
    detailRows: [
      { label: "New Product", valueTemplate: "{{product_name}}" },
      { label: "Price", valueTemplate: "{{order_total}}" },
      { label: "Vendor Store", valueTemplate: "{{store_name}}" }
    ],
    ctaLabel: "View New Arrival",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "store.new_product_published_for_followers",
    requiredVariables: ["buyer_name", "product_name", "order_total", "seller_name", "store_name", "dashboard_url", "support_email"],
    sendingConditions: "Send only to subscribed buyers (`marketingOptIn === true`) who favourited the store or bought previously; max 1 digest per store per day.",
    recommendedSchedule: "Daily digest or up to 1 notification per store/24h"
  },
  {
    id: "buyer_review_request",
    code: "B-28",
    name: "Review and Rating Request After Delivery",
    recipientCategory: "buyer",
    section: "Customer Engagement",
    classification: "transactional",
    subjectTemplate: "How was {{product_name}} from {{seller_name}}? Share a Quick Review",
    previewTextTemplate: "Help fellow students choose trusted campus vendors by rating order {{order_id}}.",
    badgeLabel: "RATE YOUR EXPERIENCE",
    badgeColor: "#f59e0b",
    heroTitleTemplate: "Share Your Review for Order {{order_id}}",
    greetingTemplate: "Hello {{buyer_name}},",
    bodyParagraphs: [
      "Thank you for completing order {{order_id}} for {{product_name}} with {{seller_name}}.",
      "Your honest 1-to-5 star review helps keep Shopiversity trustworthy for students across your campus."
    ],
    detailRows: [
      { label: "Order ID", valueTemplate: "{{order_id}}" },
      { label: "Product", valueTemplate: "{{product_name}}" },
      { label: "Merchant", valueTemplate: "{{seller_name}}" }
    ],
    ctaLabel: "Leave a Star Rating",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "order.completed_review_invite",
    requiredVariables: ["buyer_name", "order_id", "product_name", "seller_name", "dashboard_url", "support_email"],
    sendingConditions: "Send only once after order reaches `completed` and `hasReviewed !== true`.",
    recommendedSchedule: "24 hours after order completion"
  },
  {
    id: "buyer_support_ticket_confirmation",
    code: "B-29",
    name: "Customer Support Ticket Confirmation",
    recipientCategory: "buyer",
    section: "Customer Engagement",
    classification: "transactional",
    subjectTemplate: "[Ticket {{ticket_id}}] We Received Your Shopiversity Support Request",
    previewTextTemplate: "Your inquiry ({{ticket_subject}}) has been logged with our Student Support Desk.",
    badgeLabel: "SUPPORT TICKET LOGGED",
    badgeColor: "#2563eb",
    heroTitleTemplate: "Support Request Received",
    greetingTemplate: "Hello {{buyer_name}},",
    bodyParagraphs: [
      "We have received your support ticket regarding \"{{ticket_subject}}\" and assigned it reference {{ticket_id}}.",
      "Our campus support team typically responds within 2 hours during active trading hours (8:00 AM - 10:00 PM)."
    ],
    detailRows: [
      { label: "Ticket Reference", valueTemplate: "{{ticket_id}}" },
      { label: "Category", valueTemplate: "{{ticket_category}}", hideIfEmptyVar: "ticket_category" },
      { label: "Subject", valueTemplate: "{{ticket_subject}}" }
    ],
    ctaLabel: "Visit Support Center",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "support.ticket_created",
    requiredVariables: ["buyer_name", "ticket_id", "ticket_category", "ticket_subject", "dashboard_url", "support_email"],
    sendingConditions: "Send immediately on support ticket creation.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "buyer_support_ticket_resolution",
    code: "B-30",
    name: "Customer Support Ticket Resolution",
    recipientCategory: "buyer",
    section: "Customer Engagement",
    classification: "transactional",
    subjectTemplate: "[Ticket {{ticket_id}}] Resolved: {{ticket_subject}}",
    previewTextTemplate: "Our support team has resolved your ticket. View the resolution summary inside.",
    badgeLabel: "TICKET RESOLVED",
    badgeColor: "#10b981",
    heroTitleTemplate: "Your Support Ticket Has Been Resolved",
    greetingTemplate: "Hello {{buyer_name}},",
    bodyParagraphs: [
      "Your Shopiversity support ticket {{ticket_id}} regarding \"{{ticket_subject}}\" has been marked resolved.",
      "Resolution summary: {{resolution_notes}}",
      "If you need any follow-up help, simply reply to this email or submit an update from your Support page."
    ],
    detailRows: [
      { label: "Ticket Reference", valueTemplate: "{{ticket_id}}" },
      { label: "Status", valueTemplate: "Resolved" },
      { label: "Resolution Notes", valueTemplate: "{{resolution_notes}}", hideIfEmptyVar: "resolution_notes" }
    ],
    ctaLabel: "Open Support History",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "support.ticket_resolved",
    requiredVariables: ["buyer_name", "ticket_id", "ticket_subject", "resolution_notes", "dashboard_url", "support_email"],
    sendingConditions: "Send only when support ticket status updates to `resolved` or `closed`.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "buyer_account_deleted",
    code: "B-31",
    name: "Buyer Account Permanently Deleted",
    recipientCategory: "buyer",
    section: "Account and Registration",
    classification: "transactional",
    subjectTemplate: "Account Deleted: Your Shopiversity Profile Has Been Permanently Removed",
    previewTextTemplate: "Your buyer account, saved history, and personal data have been removed from Shopiversity.",
    badgeLabel: "ACCOUNT DELETED",
    badgeColor: "#dc2626",
    heroTitleTemplate: "Your Account Has Been Deleted",
    greetingTemplate: "Hello {{buyer_name}},",
    bodyParagraphs: [
      "This confirms that your Shopiversity buyer account and associated profile, wishlists, browsing history, and personal data have been permanently deleted as requested.",
      "If you did not authorize this deletion or need assistance recovering an order inquiry, please contact {{support_email}} immediately."
    ],
    detailRows: [
      { label: "Account Email", valueTemplate: "{{recipient_email}}", hideIfEmptyVar: "recipient_email" },
      { label: "Account Role", valueTemplate: "Buyer" },
      { label: "Deleted At", valueTemplate: "{{event_timestamp}}", hideIfEmptyVar: "event_timestamp" }
    ],
    ctaLabel: "Visit Shopiversity",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "buyer.account_deleted",
    requiredVariables: ["buyer_name", "recipient_email", "event_timestamp", "dashboard_url", "support_email"],
    sendingConditions: "Send once immediately when buyer account purge succeeds.",
    recommendedSchedule: "Immediate (Real-time)"
  }
];
