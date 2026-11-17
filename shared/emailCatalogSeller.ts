import { EmailTemplateDefinition } from "./emailTypes.js";

export const SELLER_EMAIL_TEMPLATES: EmailTemplateDefinition[] = [
  // ==================== ACCOUNT AND ONBOARDING (1-10) ====================
  {
    id: "seller_welcome",
    code: "S-01",
    name: "Welcome Email After Vendor Registration",
    recipientCategory: "seller",
    section: "Account and Onboarding",
    classification: "transactional",
    subjectTemplate: "Welcome to Shopiversity Seller Hub, {{seller_name}}",
    previewTextTemplate: "Start selling across campus with escrow-backed payments and integrated local courier dispatch.",
    badgeLabel: "VENDOR WELCOME",
    badgeColor: "#ff6b00",
    heroTitleTemplate: "Welcome to Shopiversity for Vendors",
    greetingTemplate: "Hello {{seller_name}},",
    bodyParagraphs: [
      "Welcome to Shopiversity Seller Hub! You can now list physical goods, services, or campus events directly to verified students on {{campus_name}}.",
      "Complete your store details and bank settlement settings inside your Seller Dashboard so payouts clear smoothly after confirmed deliveries."
    ],
    detailRows: [
      { label: "Store Name", valueTemplate: "{{store_name}}" },
      { label: "Primary Campus", valueTemplate: "{{campus_name}}", hideIfEmptyVar: "campus_name" },
      { label: "Escrow Payout Flow", valueTemplate: "Released After Buyer Handover" }
    ],
    ctaLabel: "Open Seller Dashboard",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "seller.registered",
    requiredVariables: ["seller_name", "store_name", "campus_name", "dashboard_url", "support_email"],
    sendingConditions: "Send once after vendor registration succeeds.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "seller_email_verification",
    code: "S-02",
    name: "Vendor Email Verification",
    recipientCategory: "seller",
    section: "Account and Onboarding",
    classification: "transactional",
    subjectTemplate: "{{verification_code}} is your Shopiversity Vendor Verification Code",
    previewTextTemplate: "Confirm your vendor email address to unlock listing creation and payouts.",
    badgeLabel: "VENDOR VERIFICATION",
    badgeColor: "#ea580c",
    heroTitleTemplate: "Verify Your Vendor Email",
    greetingTemplate: "Hello {{seller_name}},",
    bodyParagraphs: [
      "Please enter the 6-digit verification code below to confirm your vendor email address for {{store_name}}.",
      "This verification code expires in 15 minutes."
    ],
    detailRows: [
      { label: "Vendor Email", valueTemplate: "{{recipient_email}}", hideIfEmptyVar: "recipient_email" },
      { label: "Store Name", valueTemplate: "{{store_name}}", hideIfEmptyVar: "store_name" }
    ],
    highlightPinVar: "verification_code",
    highlightPinLabel: "6-Digit Vendor Verification Code",
    ctaLabel: "Verify Email Now",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "seller.email_verification_requested",
    requiredVariables: ["seller_name", "store_name", "verification_code", "recipient_email", "dashboard_url", "support_email"],
    sendingConditions: "Send on seller signup or explicit resend.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "seller_application_submitted",
    code: "S-03",
    name: "Vendor Application Successfully Submitted",
    recipientCategory: "seller",
    section: "Account and Onboarding",
    classification: "transactional",
    subjectTemplate: "Vendor Verification Application Submitted for {{store_name}}",
    previewTextTemplate: "We received your vendor onboarding details and verification profile.",
    badgeLabel: "APPLICATION RECEIVED",
    badgeColor: "#3b82f6",
    heroTitleTemplate: "Vendor Application Received",
    greetingTemplate: "Hello {{seller_name}},",
    bodyParagraphs: [
      "Your vendor onboarding and verification submission for {{store_name}} has been received by Shopiversity.",
      "We will keep you updated by email as soon as our verification team reviews your profile."
    ],
    detailRows: [
      { label: "Store Name", valueTemplate: "{{store_name}}" },
      { label: "Campus", valueTemplate: "{{campus_name}}", hideIfEmptyVar: "campus_name" },
      { label: "Application Status", valueTemplate: "Submitted" }
    ],
    ctaLabel: "Check Application Status",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "seller.application_submitted",
    requiredVariables: ["seller_name", "store_name", "campus_name", "dashboard_url", "support_email"],
    sendingConditions: "Send once when seller submits verification profile details.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "seller_application_under_review",
    code: "S-04",
    name: "Vendor Application Under Review",
    recipientCategory: "seller",
    section: "Account and Onboarding",
    classification: "transactional",
    subjectTemplate: "Update: Your Store Verification ({{store_name}}) Is Under Review",
    previewTextTemplate: "A Shopiversity compliance specialist is currently reviewing your vendor credentials.",
    badgeLabel: "UNDER REVIEW",
    badgeColor: "#f59e0b",
    heroTitleTemplate: "Vendor Profile Under Review",
    greetingTemplate: "Hello {{seller_name}},",
    bodyParagraphs: [
      "Our campus compliance team is actively reviewing your vendor documentation for {{store_name}}.",
      "Typical verification turnaround is 12 to 24 hours. No action is required unless our team requests clarification."
    ],
    detailRows: [
      { label: "Store Name", valueTemplate: "{{store_name}}" },
      { label: "Review Stage", valueTemplate: "Compliance & Identity Check" }
    ],
    ctaLabel: "Open Seller Settings",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "seller.application_under_review",
    requiredVariables: ["seller_name", "store_name", "dashboard_url", "support_email"],
    sendingConditions: "Send when admin opens or flags application as `under_review`.",
    recommendedSchedule: "Immediate upon status transition"
  },
  {
    id: "seller_application_approved",
    code: "S-05",
    name: "Vendor Application Approved",
    recipientCategory: "seller",
    section: "Account and Onboarding",
    classification: "transactional",
    subjectTemplate: "Approved: {{store_name}} Is Now a Verified Shopiversity Vendor",
    previewTextTemplate: "Your verified merchant badge is active. Publish products and receive escrow payouts.",
    badgeLabel: "VENDOR APPROVED",
    badgeColor: "#10b981",
    heroTitleTemplate: "Your Vendor Application Was Approved",
    greetingTemplate: "Hello {{seller_name}},",
    bodyParagraphs: [
      "Congratulations! Your vendor application and verification for {{store_name}} have been approved.",
      "Your verified merchant badge is now visible to buyers, boosting trust and conversion across {{campus_name}}."
    ],
    detailRows: [
      { label: "Store Name", valueTemplate: "{{store_name}}" },
      { label: "Verification Badge", valueTemplate: "Verified Vendor" }
    ],
    ctaLabel: "Go to Seller Dashboard",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "seller.application_approved",
    requiredVariables: ["seller_name", "store_name", "campus_name", "dashboard_url", "support_email"],
    sendingConditions: "Send once when admin toggles seller `isVerified` or approval status to true.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "seller_application_rejected",
    code: "S-06",
    name: "Vendor Application Rejected (With Reason)",
    recipientCategory: "seller",
    section: "Account and Onboarding",
    classification: "transactional",
    subjectTemplate: "Action Required: Vendor Verification Update for {{store_name}}",
    previewTextTemplate: "Your vendor application could not be approved yet. Review the reason and resubmit.",
    badgeLabel: "VERIFICATION DECLINED",
    badgeColor: "#ef4444",
    heroTitleTemplate: "Vendor Application Needs Updates",
    greetingTemplate: "Hello {{seller_name}},",
    bodyParagraphs: [
      "Our review team was unable to approve the vendor verification application for {{store_name}} at this time.",
      "Reason provided: {{rejection_reason}}",
      "Please update the highlighted information inside your Seller Settings and resubmit for review."
    ],
    detailRows: [
      { label: "Store Name", valueTemplate: "{{store_name}}" },
      { label: "Rejection Reason", valueTemplate: "{{rejection_reason}}" }
    ],
    ctaLabel: "Update Verification Profile",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "seller.application_rejected",
    requiredVariables: ["seller_name", "store_name", "rejection_reason", "dashboard_url", "support_email"],
    sendingConditions: "Requires explicit non-empty `rejection_reason` from admin review.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "seller_store_activated",
    code: "S-07",
    name: "Vendor Store Successfully Activated",
    recipientCategory: "seller",
    section: "Account and Onboarding",
    classification: "transactional",
    subjectTemplate: "{{store_name}} Storefront Is Now Live on Shopiversity",
    previewTextTemplate: "Students can now browse your storefront, message you, and place escrow-protected orders.",
    badgeLabel: "STORE LIVE",
    badgeColor: "#10b981",
    heroTitleTemplate: "Your Store Is Now Active",
    greetingTemplate: "Hello {{seller_name}},",
    bodyParagraphs: [
      "{{store_name}} is officially live and searchable across Shopiversity.",
      "Share your storefront link with students, upload crisp product photos, and keep stock levels up to date."
    ],
    detailRows: [
      { label: "Storefront", valueTemplate: "{{store_name}}" },
      { label: "Status", valueTemplate: "Active & Accepting Orders" }
    ],
    ctaLabel: "Manage My Store",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "seller.store_activated",
    requiredVariables: ["seller_name", "store_name", "dashboard_url", "support_email"],
    sendingConditions: "Send when vendor completes store setup or comes out of hibernation.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "seller_profile_updated",
    code: "S-08",
    name: "Vendor Profile or Store Information Updated",
    recipientCategory: "seller",
    section: "Account and Onboarding",
    classification: "transactional",
    subjectTemplate: "Store Settings Saved for {{store_name}}",
    previewTextTemplate: "Changes to your vendor profile, pickup location, or payout bank were saved.",
    badgeLabel: "STORE UPDATED",
    badgeColor: "#3b82f6",
    heroTitleTemplate: "Vendor Store Information Updated",
    greetingTemplate: "Hello {{seller_name}},",
    bodyParagraphs: [
      "Your vendor profile, storefront settings, or bank settlement configuration for {{store_name}} was updated.",
      "If you did not authorize a change to your payout bank account, contact {{support_email}} immediately."
    ],
    detailRows: [
      { label: "Store Name", valueTemplate: "{{store_name}}" },
      { label: "Updated At", valueTemplate: "{{event_timestamp}}", hideIfEmptyVar: "event_timestamp" }
    ],
    ctaLabel: "Review Seller Settings",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "seller.profile_updated",
    requiredVariables: ["seller_name", "store_name", "event_timestamp", "dashboard_url", "support_email"],
    sendingConditions: "Send whenever vendor saves store profile or bank settlement info.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "seller_account_suspended",
    code: "S-09",
    name: "Vendor Account Suspended or Restricted",
    recipientCategory: "seller",
    section: "Account and Onboarding",
    classification: "transactional",
    subjectTemplate: "Important Notice: Vendor Account Restricted for {{store_name}}",
    previewTextTemplate: "Your Shopiversity seller privileges have been suspended. Review reason and appeal options.",
    badgeLabel: "ACCOUNT SUSPENDED",
    badgeColor: "#dc2626",
    heroTitleTemplate: "Vendor Account Temporarily Restricted",
    greetingTemplate: "Hello {{seller_name}},",
    bodyParagraphs: [
      "Your vendor account ({{store_name}}) has been suspended or restricted due to a marketplace compliance violation.",
      "Reason: {{suspension_reason}}",
      "During restriction, active listings are paused and new order acceptance is disabled. To submit an appeal, contact {{support_email}}."
    ],
    detailRows: [
      { label: "Store Name", valueTemplate: "{{store_name}}" },
      { label: "Restriction Type", valueTemplate: "{{ban_type}}", hideIfEmptyVar: "ban_type" },
      { label: "Duration / Until", valueTemplate: "{{suspension_until}}", hideIfEmptyVar: "suspension_until" },
      { label: "Reason", valueTemplate: "{{suspension_reason}}" }
    ],
    ctaLabel: "Contact Compliance Support",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "seller.account_suspended",
    requiredVariables: ["seller_name", "store_name", "ban_type", "suspension_until", "suspension_reason", "dashboard_url", "support_email"],
    sendingConditions: "Send immediately when admin applies temporary or permanent suspension.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "seller_account_reinstated",
    code: "S-10",
    name: "Vendor Account Reinstated",
    recipientCategory: "seller",
    section: "Account and Onboarding",
    classification: "transactional",
    subjectTemplate: "Reinstated: Your Vendor Account ({{store_name}}) Is Active Again",
    previewTextTemplate: "Your seller privileges have been restored on Shopiversity.",
    badgeLabel: "ACCOUNT REINSTATED",
    badgeColor: "#10b981",
    heroTitleTemplate: "Welcome Back - Account Reinstated",
    greetingTemplate: "Hello {{seller_name}},",
    bodyParagraphs: [
      "Your Shopiversity vendor account ({{store_name}}) has been reinstated and your marketplace access is restored.",
      "Please ensure all future trades stay inside Shopiversity Escrow to maintain your account standing."
    ],
    detailRows: [
      { label: "Store Name", valueTemplate: "{{store_name}}" },
      { label: "Account Status", valueTemplate: "Active & Cleared" }
    ],
    ctaLabel: "Return to Seller Dashboard",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "seller.account_reinstated",
    requiredVariables: ["seller_name", "store_name", "dashboard_url", "support_email"],
    sendingConditions: "Send when admin lifts suspension (`isSuspended: false`).",
    recommendedSchedule: "Immediate (Real-time)"
  },

  // ==================== ORDERS AND SALES (11-24) ====================
  {
    id: "seller_new_order_received",
    code: "S-11",
    name: "New Order Received",
    recipientCategory: "seller",
    section: "Orders and Sales",
    classification: "transactional",
    subjectTemplate: "New Order {{order_id}} Received for {{product_name}}",
    previewTextTemplate: "{{buyer_name}} placed an order ({{order_total}}). Accept inside your Seller Dashboard.",
    badgeLabel: "NEW ORDER ALERT",
    badgeColor: "#ff6b00",
    heroTitleTemplate: "You Have a New Customer Order",
    greetingTemplate: "Hello {{seller_name}},",
    bodyParagraphs: [
      "{{buyer_name}} has placed order {{order_id}} for {{product_name}} totaling {{order_total}}.",
      "Please review and accept this order promptly in your Seller Dashboard so fulfillment can begin on schedule."
    ],
    detailRows: [
      { label: "Order ID", valueTemplate: "{{order_id}}" },
      { label: "Product", valueTemplate: "{{product_name}}" },
      { label: "Buyer", valueTemplate: "{{buyer_name}}" },
      { label: "Order Total", valueTemplate: "{{order_total}}" },
      { label: "Payment Status", valueTemplate: "{{payment_status}}" },
      { label: "Delivery Address", valueTemplate: "{{delivery_address}}", hideIfEmptyVar: "delivery_address" }
    ],
    ctaLabel: "Accept Order in Dashboard",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "order.created_seller_alert",
    requiredVariables: ["seller_name", "buyer_name", "order_id", "product_name", "order_total", "payment_status", "delivery_address", "dashboard_url", "support_email"],
    sendingConditions: "Send once when order is written; deduplicate per order ID.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "seller_new_order_payment_confirmed",
    code: "S-12",
    name: "New Order Payment Confirmed",
    recipientCategory: "seller",
    section: "Orders and Sales",
    classification: "transactional",
    subjectTemplate: "Escrow Payment Secured for Order {{order_id}} ({{order_total}})",
    previewTextTemplate: "Buyer payment is vaulted in Shopiversity Escrow. Safe to pack and fulfill.",
    badgeLabel: "ESCROW SECURED",
    badgeColor: "#10b981",
    heroTitleTemplate: "Order Payment Verified in Escrow",
    greetingTemplate: "Hello {{seller_name}},",
    bodyParagraphs: [
      "Payment of {{order_total}} from {{buyer_name}} for order {{order_id}} ({{product_name}}) has been confirmed and locked inside Shopiversity Escrow.",
      "Your net earnings will unlock into your withdrawal pool once handover to the buyer is confirmed."
    ],
    detailRows: [
      { label: "Order ID", valueTemplate: "{{order_id}}" },
      { label: "Product", valueTemplate: "{{product_name}}" },
      { label: "Secured Total", valueTemplate: "{{order_total}}" },
      { label: "Payment Status", valueTemplate: "Paid (Held in Escrow)" }
    ],
    ctaLabel: "Prepare Order",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "order.payment_confirmed_seller",
    requiredVariables: ["seller_name", "buyer_name", "order_id", "product_name", "order_total", "dashboard_url", "support_email"],
    sendingConditions: "Send only when `paymentStatus === 'paid'`.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "seller_customer_order_cancelled",
    code: "S-13",
    name: "Customer Order Cancellation",
    recipientCategory: "seller",
    section: "Orders and Sales",
    classification: "transactional",
    subjectTemplate: "Order {{order_id}} Cancelled by Customer ({{buyer_name}})",
    previewTextTemplate: "Do not dispatch {{product_name}} for order {{order_id}}; inventory can be restored.",
    badgeLabel: "CUSTOMER CANCELLED",
    badgeColor: "#ef4444",
    heroTitleTemplate: "Buyer Cancelled Order {{order_id}}",
    greetingTemplate: "Hello {{seller_name}},",
    bodyParagraphs: [
      "{{buyer_name}} has cancelled order {{order_id}} for {{product_name}} prior to dispatch.",
      "Please halt preparation for this item. If you already booked a logistics courier, they will also be notified."
    ],
    detailRows: [
      { label: "Order ID", valueTemplate: "{{order_id}}" },
      { label: "Product", valueTemplate: "{{product_name}}" },
      { label: "Buyer", valueTemplate: "{{buyer_name}}" },
      { label: "Status", valueTemplate: "Cancelled by Buyer" }
    ],
    ctaLabel: "View Orders Tab",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "order.cancelled_by_buyer",
    requiredVariables: ["seller_name", "buyer_name", "order_id", "product_name", "dashboard_url", "support_email"],
    sendingConditions: "Send when buyer cancels an eligible pending order.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "seller_order_awaiting_confirmation",
    code: "S-14",
    name: "Order Awaiting Seller Confirmation",
    recipientCategory: "seller",
    section: "Orders and Sales",
    classification: "transactional",
    subjectTemplate: "Action Required: Confirm Order {{order_id}} for {{buyer_name}}",
    previewTextTemplate: "Order {{order_id}} is waiting for your acceptance in Seller Dashboard.",
    badgeLabel: "AWAITING ACCEPTANCE",
    badgeColor: "#f59e0b",
    heroTitleTemplate: "Order Waiting for Your Confirmation",
    greetingTemplate: "Hello {{seller_name}},",
    bodyParagraphs: [
      "Order {{order_id}} ({{product_name}}) from {{buyer_name}} is awaiting your vendor confirmation.",
      "Confirm quickly to book campus logistics or prepare the item for student pickup."
    ],
    detailRows: [
      { label: "Order ID", valueTemplate: "{{order_id}}" },
      { label: "Product", valueTemplate: "{{product_name}}" },
      { label: "Order Total", valueTemplate: "{{order_total}}" }
    ],
    ctaLabel: "Accept Order Now",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "order.awaiting_seller_confirmation",
    requiredVariables: ["seller_name", "buyer_name", "order_id", "product_name", "order_total", "dashboard_url", "support_email"],
    sendingConditions: "Send if order remains `Pending Seller Acceptance`.",
    recommendedSchedule: "30 minutes after order creation if still pending"
  },
  {
    id: "seller_order_confirmation_reminder",
    code: "S-15",
    name: "Order Confirmation Deadline Reminder",
    recipientCategory: "seller",
    section: "Orders and Sales",
    classification: "transactional",
    subjectTemplate: "Urgent Reminder: Confirm Order {{order_id}} Before Auto-Expiry",
    previewTextTemplate: "Accept or decline {{order_id}} soon to protect your merchant response score.",
    badgeLabel: "CONFIRMATION DEADLINE",
    badgeColor: "#dc2626",
    heroTitleTemplate: "Order Confirmation Deadline Approaching",
    greetingTemplate: "Hello {{seller_name}},",
    bodyParagraphs: [
      "Order {{order_id}} for {{product_name}} has been waiting for confirmation. Orders left unconfirmed past the deadline risk cancellation and refund.",
      "Please accept the order or update stock immediately in your Seller Dashboard."
    ],
    detailRows: [
      { label: "Order ID", valueTemplate: "{{order_id}}" },
      { label: "Product", valueTemplate: "{{product_name}}" },
      { label: "Deadline", valueTemplate: "{{estimated_delivery_date}}", hideIfEmptyVar: "estimated_delivery_date" }
    ],
    ctaLabel: "Confirm Order Now",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "order.confirmation_deadline_warning",
    requiredVariables: ["seller_name", "order_id", "product_name", "estimated_delivery_date", "dashboard_url", "support_email"],
    sendingConditions: "Send only if order status is still pending after 6 hours.",
    recommendedSchedule: "6 hours after order creation if unaccepted"
  },
  {
    id: "seller_order_ready_for_pickup",
    code: "S-16",
    name: "Order Ready for Pickup",
    recipientCategory: "seller",
    section: "Orders and Sales",
    classification: "transactional",
    subjectTemplate: "Order {{order_id}} Marked Ready for Pickup",
    previewTextTemplate: "Pickup notice sent to {{buyer_name}} or assigned courier.",
    badgeLabel: "READY FOR PICKUP",
    badgeColor: "#3b82f6",
    heroTitleTemplate: "Order Ready for Handover",
    greetingTemplate: "Hello {{seller_name}},",
    bodyParagraphs: [
      "Order {{order_id}} ({{product_name}}) is marked Ready for Pickup.",
      "Remember to verify the buyer or courier handover code cleanly before releasing the package."
    ],
    detailRows: [
      { label: "Order ID", valueTemplate: "{{order_id}}" },
      { label: "Pickup Address", valueTemplate: "{{pickup_address}}", hideIfEmptyVar: "pickup_address" },
      { label: "Product", valueTemplate: "{{product_name}}" }
    ],
    ctaLabel: "Manage Handover",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "order.ready_for_pickup",
    requiredVariables: ["seller_name", "buyer_name", "order_id", "product_name", "pickup_address", "dashboard_url", "support_email"],
    sendingConditions: "Send when seller marks pickup order ready.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "seller_courier_assigned",
    code: "S-17",
    name: "Courier Assigned to Collect an Order",
    recipientCategory: "seller",
    section: "Orders and Sales",
    classification: "transactional",
    subjectTemplate: "Courier {{courier_name}} Assigned to Order {{order_id}} (Handover PIN Inside)",
    previewTextTemplate: "{{courier_name}} accepted dispatch for {{product_name}}. Give the Seller Handover PIN at pickup.",
    badgeLabel: "COURIER ASSIGNED",
    badgeColor: "#4f46e5",
    heroTitleTemplate: "Logistics Courier Confirmed for Pickup",
    greetingTemplate: "Hello {{seller_name}},",
    bodyParagraphs: [
      "{{courier_name}} has accepted the delivery job for order {{order_id}} ({{product_name}}) and will collect it from {{pickup_address}}.",
      "Have the package sealed and ask the rider to confirm your 6-digit Seller Handover PIN below when collecting it."
    ],
    detailRows: [
      { label: "Order ID", valueTemplate: "{{order_id}}" },
      { label: "Logistics Partner", valueTemplate: "{{courier_name}}" },
      { label: "Estimated Timeline", valueTemplate: "{{estimated_delivery_date}}", hideIfEmptyVar: "estimated_delivery_date" }
    ],
    highlightPinVar: "seller_handover_pin",
    highlightPinLabel: "Seller Handover PIN (Give to Courier)",
    ctaLabel: "View Dispatch Status",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "logistics.assignment_accepted_seller",
    requiredVariables: ["seller_name", "courier_name", "order_id", "product_name", "pickup_address", "estimated_delivery_date", "seller_handover_pin", "dashboard_url", "support_email"],
    sendingConditions: "Send when courier clicks Accept Job in Logistics Hub.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "seller_courier_picked_up",
    code: "S-18",
    name: "Courier Has Picked Up the Order",
    recipientCategory: "seller",
    section: "Orders and Sales",
    classification: "transactional",
    subjectTemplate: "Package Collected by {{courier_name}} - Order {{order_id}}",
    previewTextTemplate: "Handover verified. {{product_name}} is now in transit to {{buyer_name}}.",
    badgeLabel: "PICKED UP BY COURIER",
    badgeColor: "#6366f1",
    heroTitleTemplate: "Courier Picked Up Your Order",
    greetingTemplate: "Hello {{seller_name}},",
    bodyParagraphs: [
      "{{courier_name}} has collected order {{order_id}} ({{product_name}}) and verified handover.",
      "Your package is currently in transit to {{buyer_name}} at {{delivery_address}}."
    ],
    detailRows: [
      { label: "Order ID", valueTemplate: "{{order_id}}" },
      { label: "Courier", valueTemplate: "{{courier_name}}" },
      { label: "Tracking Number", valueTemplate: "{{tracking_number}}", hideIfEmptyVar: "tracking_number" },
      { label: "Delivery Status", valueTemplate: "In Transit to Buyer" }
    ],
    ctaLabel: "Track Delivery",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "logistics.package_picked_up_seller",
    requiredVariables: ["seller_name", "buyer_name", "courier_name", "order_id", "product_name", "delivery_address", "tracking_number", "dashboard_url", "support_email"],
    sendingConditions: "Send when Seller Handover PIN is verified or status changes to `picked_up`.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "seller_order_delivered",
    code: "S-19",
    name: "Order Successfully Delivered",
    recipientCategory: "seller",
    section: "Orders and Sales",
    classification: "transactional",
    subjectTemplate: "Order {{order_id}} Delivered to {{buyer_name}}",
    previewTextTemplate: "{{product_name}} reached {{buyer_name}}. Earnings move to your payout balance upon confirmation.",
    badgeLabel: "DELIVERED TO BUYER",
    badgeColor: "#10b981",
    heroTitleTemplate: "Package Delivered Successfully",
    greetingTemplate: "Hello {{seller_name}},",
    bodyParagraphs: [
      "Order {{order_id}} ({{product_name}}) has been delivered to {{buyer_name}}.",
      "Once the buyer completes confirmation (or the escrow protection window finishes without disputes), your earnings will unlock for withdrawal."
    ],
    detailRows: [
      { label: "Order ID", valueTemplate: "{{order_id}}" },
      { label: "Product", valueTemplate: "{{product_name}}" },
      { label: "Buyer", valueTemplate: "{{buyer_name}}" },
      { label: "Delivered By", valueTemplate: "{{courier_name}}", hideIfEmptyVar: "courier_name" }
    ],
    ctaLabel: "View Earnings & Orders",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "order.delivered_seller_notice",
    requiredVariables: ["seller_name", "buyer_name", "courier_name", "order_id", "product_name", "dashboard_url", "support_email"],
    sendingConditions: "Send when delivery is verified to buyer.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "seller_order_delivery_failed",
    code: "S-20",
    name: "Order Delivery Failed",
    recipientCategory: "seller",
    section: "Orders and Sales",
    classification: "transactional",
    subjectTemplate: "Delivery Issue Notice for Order {{order_id}}",
    previewTextTemplate: "{{courier_name}} could not complete drop-off to {{buyer_name}}.",
    badgeLabel: "DELIVERY UNSUCCESSFUL",
    badgeColor: "#f59e0b",
    heroTitleTemplate: "Courier Could Not Deliver Order {{order_id}}",
    greetingTemplate: "Hello {{seller_name}},",
    bodyParagraphs: [
      "{{courier_name}} reported a failed delivery attempt for order {{order_id}} ({{product_name}}) for {{buyer_name}}.",
      "Reason: {{failure_reason}}. Our courier team will either reschedule handover or initiate a safe return to {{pickup_address}}."
    ],
    detailRows: [
      { label: "Order ID", valueTemplate: "{{order_id}}" },
      { label: "Courier", valueTemplate: "{{courier_name}}" },
      { label: "Failure Reason", valueTemplate: "{{failure_reason}}" }
    ],
    ctaLabel: "Monitor Order Status",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "logistics.delivery_failed_seller",
    requiredVariables: ["seller_name", "buyer_name", "courier_name", "order_id", "product_name", "pickup_address", "failure_reason", "dashboard_url", "support_email"],
    sendingConditions: "Send when delivery fails due to unavailable buyer or bad address.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "seller_return_requested",
    code: "S-21",
    name: "Customer Requested a Return",
    recipientCategory: "seller",
    section: "Orders and Sales",
    classification: "transactional",
    subjectTemplate: "Return Request Filed for Order {{order_id}}",
    previewTextTemplate: "{{buyer_name}} requested to return {{product_name}}. Review details in Seller Dashboard.",
    badgeLabel: "RETURN REQUEST",
    badgeColor: "#f97316",
    heroTitleTemplate: "Buyer Requested an Order Return",
    greetingTemplate: "Hello {{seller_name}},",
    bodyParagraphs: [
      "{{buyer_name}} has submitted a return request on order {{order_id}} for {{product_name}}.",
      "Reason: {{refund_reason}}. You can respond with inspection notes or dispatch proof inside your Seller Dashboard."
    ],
    detailRows: [
      { label: "Order ID", valueTemplate: "{{order_id}}" },
      { label: "Product", valueTemplate: "{{product_name}}" },
      { label: "Reason", valueTemplate: "{{refund_reason}}" }
    ],
    ctaLabel: "Respond to Return Request",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "order.return_requested",
    requiredVariables: ["seller_name", "buyer_name", "order_id", "product_name", "refund_reason", "dashboard_url", "support_email"],
    sendingConditions: "Send when buyer files return request inside 72h protection window.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "seller_refund_requested",
    code: "S-22",
    name: "Customer Requested a Refund",
    recipientCategory: "seller",
    section: "Orders and Sales",
    classification: "transactional",
    subjectTemplate: "Escrow Hold: Refund Claim Filed for Order {{order_id}}",
    previewTextTemplate: "Escrow disbursement is paused pending review of {{buyer_name}}'s refund claim.",
    badgeLabel: "REFUND CLAIM FILED",
    badgeColor: "#d97706",
    heroTitleTemplate: "Buyer Filed a Refund Request",
    greetingTemplate: "Hello {{seller_name}},",
    bodyParagraphs: [
      "{{buyer_name}} filed a refund claim for order {{order_id}} ({{order_total}}). Funds remain paused in Shopiversity Escrow pending dispute review.",
      "Reason: {{refund_reason}}. Upload dispatch evidence or respond in your Seller Dashboard within 24 hours."
    ],
    detailRows: [
      { label: "Order ID", valueTemplate: "{{order_id}}" },
      { label: "Claim Amount", valueTemplate: "{{order_total}}" },
      { label: "Reason", valueTemplate: "{{refund_reason}}" }
    ],
    ctaLabel: "Submit Seller Response",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "refund.requested_seller_alert",
    requiredVariables: ["seller_name", "buyer_name", "order_id", "order_total", "refund_reason", "dashboard_url", "support_email"],
    sendingConditions: "Send when `refund.requested` is recorded for an order belonging to seller.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "seller_return_refund_approved",
    code: "S-23",
    name: "Return or Refund Approved",
    recipientCategory: "seller",
    section: "Orders and Sales",
    classification: "transactional",
    subjectTemplate: "Dispute Outcome: Refund Approved for Order {{order_id}}",
    previewTextTemplate: "Refund review concluded for {{order_id}}; escrow balance adjusted accordingly.",
    badgeLabel: "REFUND APPROVED",
    badgeColor: "#4f46e5",
    heroTitleTemplate: "Return / Refund Claim Approved",
    greetingTemplate: "Hello {{seller_name}},",
    bodyParagraphs: [
      "The return or refund claim for order {{order_id}} ({{product_name}}) has been approved following escrow mediation.",
      "Resolution notes: {{resolution_notes}}"
    ],
    detailRows: [
      { label: "Order ID", valueTemplate: "{{order_id}}" },
      { label: "Approved Refund", valueTemplate: "{{order_total}}" },
      { label: "Outcome", valueTemplate: "Escrow Refunded to Buyer" }
    ],
    ctaLabel: "View Dispute History",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "refund.approved_seller_notice",
    requiredVariables: ["seller_name", "order_id", "product_name", "order_total", "resolution_notes", "dashboard_url", "support_email"],
    sendingConditions: "Send when refund status transitions to `approved` or `completed`.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "seller_return_refund_rejected",
    code: "S-24",
    name: "Return or Refund Rejected",
    recipientCategory: "seller",
    section: "Orders and Sales",
    classification: "transactional",
    subjectTemplate: "Dispute Closed in Your Favour: Order {{order_id}}",
    previewTextTemplate: "Refund claim rejected; escrow settlement for {{order_id}} will proceed normally.",
    badgeLabel: "REFUND REJECTED",
    badgeColor: "#10b981",
    heroTitleTemplate: "Return / Refund Claim Declined",
    greetingTemplate: "Hello {{seller_name}},",
    bodyParagraphs: [
      "Following review of order {{order_id}} ({{product_name}}), the buyer's refund request was declined and your escrow funds have been released from hold.",
      "Decision notes: {{resolution_notes}}"
    ],
    detailRows: [
      { label: "Order ID", valueTemplate: "{{order_id}}" },
      { label: "Product", valueTemplate: "{{product_name}}" },
      { label: "Outcome", valueTemplate: "Settled to Seller Pool" }
    ],
    ctaLabel: "View Seller Earnings",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "refund.rejected_seller_notice",
    requiredVariables: ["seller_name", "order_id", "product_name", "resolution_notes", "dashboard_url", "support_email"],
    sendingConditions: "Send when admin/moderator marks refund status `rejected`.",
    recommendedSchedule: "Immediate (Real-time)"
  },

  // ==================== EARNINGS AND PAYMENTS (25-33) ====================
  {
    id: "seller_new_sale",
    code: "S-25",
    name: "New Sale Notification",
    recipientCategory: "seller",
    section: "Earnings and Payments",
    classification: "transactional",
    subjectTemplate: "New Completed Sale: {{order_total}} on Order {{order_id}}",
    previewTextTemplate: "Order {{order_id}} for {{product_name}} completed. Net earnings credited.",
    badgeLabel: "SALE COMPLETED",
    badgeColor: "#10b981",
    heroTitleTemplate: "New Sale Credited to Your Store",
    greetingTemplate: "Hello {{seller_name}},",
    bodyParagraphs: [
      "Buyer {{buyer_name}} has confirmed completion of order {{order_id}} for {{product_name}}.",
      "Your net merchant earnings have been credited toward your withdrawable balance."
    ],
    detailRows: [
      { label: "Order ID", valueTemplate: "{{order_id}}" },
      { label: "Product", valueTemplate: "{{product_name}}" },
      { label: "Order Total", valueTemplate: "{{order_total}}" },
      { label: "Net Seller Earnings", valueTemplate: "{{net_earnings}}", hideIfEmptyVar: "net_earnings" }
    ],
    ctaLabel: "View Earnings Pool",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "seller.sale_completed",
    requiredVariables: ["seller_name", "buyer_name", "order_id", "product_name", "order_total", "net_earnings", "dashboard_url", "support_email"],
    sendingConditions: "Send once when order reaches `completed`.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "seller_sales_earnings_updated",
    code: "S-26",
    name: "Sales Earnings Updated",
    recipientCategory: "seller",
    section: "Earnings and Payments",
    classification: "transactional",
    subjectTemplate: "Your {{store_name}} Available Balance Has Been Updated",
    previewTextTemplate: "Your withdrawable payout balance on Shopiversity is now {{available_balance}}.",
    badgeLabel: "BALANCE UPDATED",
    badgeColor: "#10b981",
    heroTitleTemplate: "Available Earnings Updated",
    greetingTemplate: "Hello {{seller_name}},",
    bodyParagraphs: [
      "Your merchant earnings ledger for {{store_name}} has been updated following recent order settlement.",
      "Current withdrawable balance: {{available_balance}}."
    ],
    detailRows: [
      { label: "Store", valueTemplate: "{{store_name}}" },
      { label: "Latest Order", valueTemplate: "{{order_id}}", hideIfEmptyVar: "order_id" },
      { label: "Available Balance", valueTemplate: "{{available_balance}}" }
    ],
    ctaLabel: "Request Bank Payout",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "seller.earnings_updated",
    requiredVariables: ["seller_name", "store_name", "order_id", "available_balance", "dashboard_url", "support_email"],
    sendingConditions: "Send when escrow ledger credits merchant pool.",
    recommendedSchedule: "Immediate or batched daily"
  },
  {
    id: "seller_commission_deduction",
    code: "S-27",
    name: "Commission Deduction Notification",
    recipientCategory: "seller",
    section: "Earnings and Payments",
    classification: "transactional",
    subjectTemplate: "Commission Breakdown for Order {{order_id}}",
    previewTextTemplate: "Platform fee ({{commission_amount}}) and net settlement ({{net_earnings}}) summary.",
    badgeLabel: "FEE STATEMENT",
    badgeColor: "#475569",
    heroTitleTemplate: "Order Commission Statement",
    greetingTemplate: "Hello {{seller_name}},",
    bodyParagraphs: [
      "Here is the transparent platform commission breakdown for order {{order_id}} ({{product_name}}).",
      "Shopiversity marketplace fees cover escrow custody, Paystack gateway processing, and buyer dispute support."
    ],
    detailRows: [
      { label: "Order ID", valueTemplate: "{{order_id}}" },
      { label: "Gross Order Amount", valueTemplate: "{{order_total}}" },
      { label: "Platform Commission", valueTemplate: "{{commission_amount}}" },
      { label: "Net Merchant Payout", valueTemplate: "{{net_earnings}}" }
    ],
    ctaLabel: "View Ledger Details",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "seller.commission_deducted",
    requiredVariables: ["seller_name", "order_id", "product_name", "order_total", "commission_amount", "net_earnings", "dashboard_url", "support_email"],
    sendingConditions: "Send when settlement calculates commission on paid/completed orders.",
    recommendedSchedule: "Upon order settlement"
  },
  {
    id: "seller_payout_requested",
    code: "S-28",
    name: "Payout Request Submitted",
    recipientCategory: "seller",
    section: "Earnings and Payments",
    classification: "transactional",
    subjectTemplate: "Payout Request Submitted: {{payout_amount}}",
    previewTextTemplate: "We received your withdrawal request to {{bank_account_summary}}.",
    badgeLabel: "PAYOUT SUBMITTED",
    badgeColor: "#3b82f6",
    heroTitleTemplate: "Withdrawal Request Received",
    greetingTemplate: "Hello {{seller_name}},",
    bodyParagraphs: [
      "Your payout withdrawal request of {{payout_amount}} from {{store_name}} has been submitted and queued for verification.",
      "Target settlement bank: {{bank_account_summary}}."
    ],
    detailRows: [
      { label: "Payout Reference", valueTemplate: "{{payout_id}}" },
      { label: "Amount Requested", valueTemplate: "{{payout_amount}}" },
      { label: "Bank Account", valueTemplate: "{{bank_account_summary}}" }
    ],
    ctaLabel: "Track Payout Status",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "payout.requested",
    requiredVariables: ["seller_name", "store_name", "payout_id", "payout_amount", "bank_account_summary", "dashboard_url", "support_email"],
    sendingConditions: "Send once when `payoutRequests` document is created.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "seller_payout_processing",
    code: "S-29",
    name: "Payout Processing",
    recipientCategory: "seller",
    section: "Earnings and Payments",
    classification: "transactional",
    subjectTemplate: "Your Payout ({{payout_amount}}) Is Now Processing",
    previewTextTemplate: "Admin approved payout {{payout_id}}; transfer to {{bank_account_summary}} is underway.",
    badgeLabel: "PAYOUT PROCESSING",
    badgeColor: "#6366f1",
    heroTitleTemplate: "Payout Approved & Processing",
    greetingTemplate: "Hello {{seller_name}},",
    bodyParagraphs: [
      "Your payout request {{payout_id}} for {{payout_amount}} has been approved and is currently being transferred to {{bank_account_summary}}."
    ],
    detailRows: [
      { label: "Payout Reference", valueTemplate: "{{payout_id}}" },
      { label: "Amount", valueTemplate: "{{payout_amount}}" },
      { label: "Destination", valueTemplate: "{{bank_account_summary}}" }
    ],
    ctaLabel: "Open Seller Payouts",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "payout.approved_processing",
    requiredVariables: ["seller_name", "payout_id", "payout_amount", "bank_account_summary", "dashboard_url", "support_email"],
    sendingConditions: "Send when admin approves payout (`status === 'approved'`).",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "seller_payout_successful",
    code: "S-30",
    name: "Payout Successful",
    recipientCategory: "seller",
    section: "Earnings and Payments",
    classification: "transactional",
    subjectTemplate: "Payout Completed: {{payout_amount}} Sent to Your Bank Account",
    previewTextTemplate: "Settlement transfer {{payout_id}} has been disbursed to {{bank_account_summary}}.",
    badgeLabel: "PAYOUT PAID",
    badgeColor: "#10b981",
    heroTitleTemplate: "Payout Successfully Disbursed",
    greetingTemplate: "Hello {{seller_name}},",
    bodyParagraphs: [
      "Your Shopiversity payout of {{payout_amount}} has been successfully transferred to {{bank_account_summary}}.",
      "Thank you for selling on Shopiversity."
    ],
    detailRows: [
      { label: "Payout Reference", valueTemplate: "{{payout_id}}" },
      { label: "Disbursed Amount", valueTemplate: "{{payout_amount}}" },
      { label: "Bank Account", valueTemplate: "{{bank_account_summary}}" },
      { label: "Status", valueTemplate: "Paid" }
    ],
    ctaLabel: "Download Earnings Summary",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "payout.paid",
    requiredVariables: ["seller_name", "payout_id", "payout_amount", "bank_account_summary", "dashboard_url", "support_email"],
    sendingConditions: "Send only when payout status changes to `paid` / transfer confirms.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "seller_payout_failed",
    code: "S-31",
    name: "Payout Failed",
    recipientCategory: "seller",
    section: "Earnings and Payments",
    classification: "transactional",
    subjectTemplate: "Action Required: Payout {{payout_id}} Could Not Be Completed",
    previewTextTemplate: "Payout {{payout_amount}} was declined or failed. Verify your bank details.",
    badgeLabel: "PAYOUT FAILED",
    badgeColor: "#ef4444",
    heroTitleTemplate: "Payout Transfer Unsuccessful",
    greetingTemplate: "Hello {{seller_name}},",
    bodyParagraphs: [
      "Your payout request {{payout_id}} ({{payout_amount}}) could not be completed.",
      "Reason: {{failure_reason}}. Please verify your 10-digit NUBAN bank account in Settings and resubmit."
    ],
    detailRows: [
      { label: "Payout Reference", valueTemplate: "{{payout_id}}" },
      { label: "Amount", valueTemplate: "{{payout_amount}}" },
      { label: "Reason", valueTemplate: "{{failure_reason}}" }
    ],
    ctaLabel: "Fix Bank Settings",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "payout.failed",
    requiredVariables: ["seller_name", "payout_id", "payout_amount", "failure_reason", "dashboard_url", "support_email"],
    sendingConditions: "Send when admin rejects payout or bank transfer returns an error.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "seller_weekly_sales_report",
    code: "S-32",
    name: "Weekly Sales Report",
    recipientCategory: "seller",
    section: "Earnings and Payments",
    classification: "marketing",
    subjectTemplate: "Weekly Store Snapshot for {{store_name}}: {{weekly_revenue}}",
    previewTextTemplate: "Review orders fulfilled, revenue earned, and top products from the past 7 days.",
    badgeLabel: "WEEKLY REPORT",
    badgeColor: "#4f46e5",
    heroTitleTemplate: "Your Weekly Sales Performance",
    greetingTemplate: "Hello {{seller_name}},",
    bodyParagraphs: [
      "Here is your weekly Shopiversity storefront summary for {{store_name}}.",
      "Regularly restocking top-selling items and keeping response times under 1 hour increases repeat student purchases."
    ],
    detailRows: [
      { label: "Period", valueTemplate: "{{report_period}}" },
      { label: "Orders Completed", valueTemplate: "{{orders_count}}" },
      { label: "Gross Weekly Revenue", valueTemplate: "{{weekly_revenue}}" },
      { label: "Top Product", valueTemplate: "{{product_name}}", hideIfEmptyVar: "product_name" }
    ],
    ctaLabel: "Open Analytics Tab",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "digest.seller_weekly",
    requiredVariables: ["seller_name", "store_name", "report_period", "orders_count", "weekly_revenue", "product_name", "dashboard_url", "support_email"],
    sendingConditions: "Send only when `weeklyReports !== false` and seller has >= 1 active listing or order.",
    recommendedSchedule: "Every Monday at 8:00 AM local time"
  },
  {
    id: "seller_monthly_performance_report",
    code: "S-33",
    name: "Monthly Sales Performance Report",
    recipientCategory: "seller",
    section: "Earnings and Payments",
    classification: "marketing",
    subjectTemplate: "Monthly Performance Report - {{store_name}} ({{report_period}})",
    previewTextTemplate: "Your full monthly revenue, fulfillment rate, and customer rating recap.",
    badgeLabel: "MONTHLY REPORT",
    badgeColor: "#0f172a",
    heroTitleTemplate: "Monthly Store Growth Recap",
    greetingTemplate: "Hello {{seller_name}},",
    bodyParagraphs: [
      "Your monthly performance summary for {{store_name}} during {{report_period}} is ready.",
      "Review your net payouts, average buyer rating, and top campus products inside Analytics."
    ],
    detailRows: [
      { label: "Billing Month", valueTemplate: "{{report_period}}" },
      { label: "Total Orders", valueTemplate: "{{orders_count}}" },
      { label: "Monthly Revenue", valueTemplate: "{{monthly_revenue}}" },
      { label: "Average Rating", valueTemplate: "{{average_rating}}", hideIfEmptyVar: "average_rating" }
    ],
    ctaLabel: "View Full Monthly Report",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "digest.seller_monthly",
    requiredVariables: ["seller_name", "store_name", "report_period", "orders_count", "monthly_revenue", "average_rating", "dashboard_url", "support_email"],
    sendingConditions: "Send only when `monthlyReports !== false`.",
    recommendedSchedule: "1st day of every month at 8:00 AM local time"
  },

  // ==================== STORE MANAGEMENT (34-40) ====================
  {
    id: "seller_product_published",
    code: "S-34",
    name: "Product Successfully Published",
    recipientCategory: "seller",
    section: "Store Management",
    classification: "transactional",
    subjectTemplate: "Listing Published: {{product_name}} Is Now Live",
    previewTextTemplate: "Buyers on {{campus_name}} can now discover and purchase {{product_name}}.",
    badgeLabel: "LISTING LIVE",
    badgeColor: "#10b981",
    heroTitleTemplate: "Product Published to Marketplace",
    greetingTemplate: "Hello {{seller_name}},",
    bodyParagraphs: [
      "Your listing \"{{product_name}}\" under {{store_name}} is now live and visible to students on Shopiversity.",
      "Ensure stock counts remain accurate so shoppers do not run into out-of-stock cancellations."
    ],
    detailRows: [
      { label: "Product Name", valueTemplate: "{{product_name}}" },
      { label: "Listing Price", valueTemplate: "{{order_total}}" },
      { label: "Available Stock", valueTemplate: "{{stock_count}}", hideIfEmptyVar: "stock_count" }
    ],
    ctaLabel: "View My Listings",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "product.published",
    requiredVariables: ["seller_name", "store_name", "campus_name", "product_name", "order_total", "stock_count", "dashboard_url", "support_email"],
    sendingConditions: "Send once when product document is created with active status.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "seller_product_rejected",
    code: "S-35",
    name: "Product Rejected During Review",
    recipientCategory: "seller",
    section: "Store Management",
    classification: "transactional",
    subjectTemplate: "Listing Removed/Rejected: {{product_name}}",
    previewTextTemplate: "Your product did not pass marketplace moderation guidelines.",
    badgeLabel: "LISTING REJECTED",
    badgeColor: "#ef4444",
    heroTitleTemplate: "Product Listing Did Not Pass Review",
    greetingTemplate: "Hello {{seller_name}},",
    bodyParagraphs: [
      "Your listing \"{{product_name}}\" could not be kept live because it violated Shopiversity product guidelines.",
      "Reason: {{rejection_reason}}"
    ],
    detailRows: [
      { label: "Product Name", valueTemplate: "{{product_name}}" },
      { label: "Reason", valueTemplate: "{{rejection_reason}}" }
    ],
    ctaLabel: "Review Seller Policies",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "product.moderation_rejected",
    requiredVariables: ["seller_name", "product_name", "rejection_reason", "dashboard_url", "support_email"],
    sendingConditions: "Send when moderator or admin removes/rejects a product.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "seller_product_low_stock",
    code: "S-36",
    name: "Product Running Low on Stock",
    recipientCategory: "seller",
    section: "Store Management",
    classification: "transactional",
    subjectTemplate: "Low Stock Alert: Only {{stock_count}} Left for {{product_name}}",
    previewTextTemplate: "Restock {{product_name}} soon to avoid automatic listing deactivation.",
    badgeLabel: "LOW STOCK ALERT",
    badgeColor: "#f59e0b",
    heroTitleTemplate: "Inventory Running Low",
    greetingTemplate: "Hello {{seller_name}},",
    bodyParagraphs: [
      "Your product \"{{product_name}}\" in {{store_name}} has only {{stock_count}} unit(s) remaining.",
      "Update your stock quantity in Seller Dashboard to keep accepting campus orders uninterrupted."
    ],
    detailRows: [
      { label: "Product", valueTemplate: "{{product_name}}" },
      { label: "Remaining Stock", valueTemplate: "{{stock_count}}" }
    ],
    ctaLabel: "Restock Inventory",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "product.low_stock",
    requiredVariables: ["seller_name", "store_name", "product_name", "stock_count", "dashboard_url", "support_email"],
    sendingConditions: "Send once when stock drops to `1 <= newStock <= 3` after an order decrement.",
    recommendedSchedule: "Immediate upon threshold crossing (cooldown 24h per product)"
  },
  {
    id: "seller_product_out_of_stock",
    code: "S-37",
    name: "Product Out of Stock",
    recipientCategory: "seller",
    section: "Store Management",
    classification: "transactional",
    subjectTemplate: "Out of Stock: {{product_name}} Automatically Paused",
    previewTextTemplate: "Refill stock within 72 hours so {{product_name}} returns to the marketplace.",
    badgeLabel: "OUT OF STOCK",
    badgeColor: "#dc2626",
    heroTitleTemplate: "Product Sold Out & Temporarily Paused",
    greetingTemplate: "Hello {{seller_name}},",
    bodyParagraphs: [
      "All available stock of \"{{product_name}}\" has sold out, so Shopiversity automatically set the listing to inactive.",
      "Refill your inventory inside Seller Dashboard whenever you have new units available."
    ],
    detailRows: [
      { label: "Product", valueTemplate: "{{product_name}}" },
      { label: "Current Stock", valueTemplate: "0" },
      { label: "Listing Status", valueTemplate: "Inactive (Sold Out)" }
    ],
    ctaLabel: "Refill Stock Now",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "product.out_of_stock",
    requiredVariables: ["seller_name", "product_name", "dashboard_url", "support_email"],
    sendingConditions: "Send once when stock reaches 0 after checkout.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "seller_product_deactivated",
    code: "S-38",
    name: "Product Temporarily Deactivated",
    recipientCategory: "seller",
    section: "Store Management",
    classification: "transactional",
    subjectTemplate: "Listing Paused: {{product_name}} Temporarily Deactivated",
    previewTextTemplate: "{{product_name}} is hidden from buyers until reactivated.",
    badgeLabel: "LISTING PAUSED",
    badgeColor: "#64748b",
    heroTitleTemplate: "Product Temporarily Deactivated",
    greetingTemplate: "Hello {{seller_name}},",
    bodyParagraphs: [
      "Your product \"{{product_name}}\" in {{store_name}} has been temporarily deactivated and is currently hidden from marketplace search.",
      "Reason: {{deactivation_reason}}"
    ],
    detailRows: [
      { label: "Product", valueTemplate: "{{product_name}}" },
      { label: "Status", valueTemplate: "Temporarily Deactivated" },
      { label: "Reason", valueTemplate: "{{deactivation_reason}}", hideIfEmptyVar: "deactivation_reason" }
    ],
    ctaLabel: "Manage Listings",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "product.deactivated",
    requiredVariables: ["seller_name", "store_name", "product_name", "deactivation_reason", "dashboard_url", "support_email"],
    sendingConditions: "Send when product status is manually or automatically set to paused/inactive (excluding sold-out duplicate).",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "seller_product_reported",
    code: "S-39",
    name: "Product Reported by a Customer",
    recipientCategory: "seller",
    section: "Store Management",
    classification: "transactional",
    subjectTemplate: "Compliance Alert: Listing Report Received on {{product_name}}",
    previewTextTemplate: "A customer flagged {{product_name}} for review. Check details in your dashboard.",
    badgeLabel: "PRODUCT REPORT",
    badgeColor: "#f59e0b",
    heroTitleTemplate: "Customer Report Submitted on Listing",
    greetingTemplate: "Hello {{seller_name}},",
    bodyParagraphs: [
      "A student submitted a marketplace report on \"{{product_name}}\". Our moderation team reviews all reports fairly against product authenticity and pricing rules.",
      "Report reason: {{report_reason}}. Please verify your listing description and images are accurate."
    ],
    detailRows: [
      { label: "Reported Listing", valueTemplate: "{{product_name}}" },
      { label: "Report Reason", valueTemplate: "{{report_reason}}" }
    ],
    ctaLabel: "Inspect Listing",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "product.reported",
    requiredVariables: ["seller_name", "product_name", "report_reason", "dashboard_url", "support_email"],
    sendingConditions: "Send when a valid customer report document is saved for a seller's product.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "seller_platform_policy_update",
    code: "S-40",
    name: "Important Platform Announcements and Policy Updates",
    recipientCategory: "seller",
    section: "Store Management",
    classification: "transactional",
    subjectTemplate: "Shopiversity Policy Notice: {{announcement_title}}",
    previewTextTemplate: "Important operational and escrow policy announcement for Shopiversity vendors.",
    badgeLabel: "PLATFORM ANNOUNCEMENT",
    badgeColor: "#0f172a",
    heroTitleTemplate: "{{announcement_title}}",
    greetingTemplate: "Hello {{seller_name}},",
    bodyParagraphs: [
      "We are writing to share an important update regarding Shopiversity Seller & Escrow guidelines: {{announcement_summary}}",
      "Effective Date: {{effective_date}}. Please review the updated terms inside your dashboard."
    ],
    detailRows: [
      { label: "Announcement", valueTemplate: "{{announcement_title}}" },
      { label: "Effective Date", valueTemplate: "{{effective_date}}" }
    ],
    ctaLabel: "Read Full Policy Notice",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "platform.seller_announcement",
    requiredVariables: ["seller_name", "announcement_title", "announcement_summary", "effective_date", "dashboard_url", "support_email"],
    sendingConditions: "Triggered intentionally by Shopiversity Admin broadcast for mandatory operational/legal updates.",
    recommendedSchedule: "Scheduled upon policy release (at least 7 days before changes)"
  },
  {
    id: "seller_account_deleted",
    code: "S-41",
    name: "Vendor Account & All Products Permanently Deleted",
    recipientCategory: "seller",
    section: "Account and Onboarding",
    classification: "transactional",
    subjectTemplate: "Store & Account Deleted: {{store_name}} Has Been Permanently Removed",
    previewTextTemplate: "Your vendor account and {{deleted_products_count}} product listing(s) have been permanently purged.",
    badgeLabel: "VENDOR ACCOUNT DELETED",
    badgeColor: "#dc2626",
    heroTitleTemplate: "Vendor Account & Products Deleted",
    greetingTemplate: "Hello {{seller_name}},",
    bodyParagraphs: [
      "This confirms that your Shopiversity vendor account for {{store_name}} and all {{deleted_products_count}} associated product listing(s) have been permanently deleted after verifying that no accepted or in-process orders remain.",
      "If you did not initiate this permanent account deletion, please contact {{support_email}} right away."
    ],
    detailRows: [
      { label: "Store Name", valueTemplate: "{{store_name}}" },
      { label: "Products Purged", valueTemplate: "{{deleted_products_count}}" },
      { label: "Account Email", valueTemplate: "{{recipient_email}}", hideIfEmptyVar: "recipient_email" },
      { label: "Deleted At", valueTemplate: "{{event_timestamp}}", hideIfEmptyVar: "event_timestamp" }
    ],
    ctaLabel: "Visit Shopiversity",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "seller.account_deleted",
    requiredVariables: ["seller_name", "store_name", "deleted_products_count", "recipient_email", "event_timestamp", "dashboard_url", "support_email"],
    sendingConditions: "Send only when seller has zero accepted or in-process orders (including logistics-accepted deliveries) and account purge succeeds.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "seller_product_deleted",
    code: "S-42",
    name: "Product(s) Deleted from Storefront",
    recipientCategory: "seller",
    section: "Store Management",
    classification: "transactional",
    subjectTemplate: "Listing Deleted: {{product_name}} Removed from {{store_name}}",
    previewTextTemplate: "{{product_name}} has been removed from your Shopiversity vendor catalog.",
    badgeLabel: "PRODUCT DELETED",
    badgeColor: "#ef4444",
    heroTitleTemplate: "Product Listing Deleted",
    greetingTemplate: "Hello {{seller_name}},",
    bodyParagraphs: [
      "This confirms that {{product_name}} in {{store_name}} has been deleted after verifying there are no accepted orders or active courier deliveries tied to it.",
      "Deleted listings are immediately removed from buyer search and marketplace checkout."
    ],
    detailRows: [
      { label: "Deleted Item(s)", valueTemplate: "{{product_name}}" },
      { label: "Store Name", valueTemplate: "{{store_name}}" },
      { label: "Items Removed", valueTemplate: "{{deleted_products_count}}", hideIfEmptyVar: "deleted_products_count" },
      { label: "Deleted At", valueTemplate: "{{event_timestamp}}", hideIfEmptyVar: "event_timestamp" }
    ],
    ctaLabel: "Manage Seller Dashboard",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "product.deleted",
    requiredVariables: ["seller_name", "store_name", "product_name", "deleted_products_count", "event_timestamp", "dashboard_url", "support_email"],
    sendingConditions: "Send when single product or bulk products are permanently deleted and zero accepted/in-process orders exist.",
    recommendedSchedule: "Immediate (Real-time)"
  }
];
