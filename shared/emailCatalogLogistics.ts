import { EmailTemplateDefinition } from "./emailTypes.ts";

export const LOGISTICS_EMAIL_TEMPLATES: EmailTemplateDefinition[] = [
  // ==================== ACCOUNT AND REGISTRATION (1-8) ====================
  {
    id: "logistics_welcome",
    code: "L-01",
    name: "Welcome Email After Courier Registration",
    recipientCategory: "logistics",
    section: "Account and Registration",
    classification: "transactional",
    subjectTemplate: "Welcome to Shopiversity Logistics Hub, {{courier_name}}",
    previewTextTemplate: "Your campus courier partner profile is registered. Configure routes and rates to accept jobs.",
    badgeLabel: "LOGISTICS PARTNER WELCOME",
    badgeColor: "#ff6b00",
    heroTitleTemplate: "Welcome to Shopiversity Logistics Hub",
    greetingTemplate: "Hello {{courier_name}},",
    bodyParagraphs: [
      "Welcome to the Shopiversity Campus Logistics Network! Merchants across your covered campuses can now book your fleet for fast, PIN-verified student deliveries.",
      "Finish configuring your base delivery fee, covered campuses, and bank settlement account in your Logistics Hub."
    ],
    detailRows: [
      { label: "Logistics Company", valueTemplate: "{{courier_name}}" },
      { label: "Covered Campuses", valueTemplate: "{{campus_name}}", hideIfEmptyVar: "campus_name" }
    ],
    ctaLabel: "Open Logistics Hub",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "logistics.registered",
    requiredVariables: ["courier_name", "campus_name", "dashboard_url", "support_email"],
    sendingConditions: "Send once when a logistics company completes registration.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "logistics_email_verification",
    code: "L-02",
    name: "Courier Email Verification",
    recipientCategory: "logistics",
    section: "Account and Registration",
    classification: "transactional",
    subjectTemplate: "{{verification_code}} is your Shopiversity Logistics Verification Code",
    previewTextTemplate: "Confirm your logistics dispatch email address to receive live campus delivery jobs.",
    badgeLabel: "COURIER EMAIL VERIFICATION",
    badgeColor: "#ea580c",
    heroTitleTemplate: "Verify Your Logistics Email",
    greetingTemplate: "Hello {{courier_name}},",
    bodyParagraphs: [
      "Enter the 6-digit verification code below to confirm your logistics email address for {{courier_name}}.",
      "This code expires in 15 minutes."
    ],
    detailRows: [
      { label: "Company Email", valueTemplate: "{{recipient_email}}", hideIfEmptyVar: "recipient_email" },
      { label: "Expires In", valueTemplate: "15 Minutes" }
    ],
    highlightPinVar: "verification_code",
    highlightPinLabel: "Logistics Verification Code",
    ctaLabel: "Complete Verification",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "logistics.email_verification_requested",
    requiredVariables: ["courier_name", "verification_code", "recipient_email", "dashboard_url", "support_email"],
    sendingConditions: "Send during logistics company verification or resend request.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "logistics_application_submitted",
    code: "L-03",
    name: "Courier Application Successfully Submitted",
    recipientCategory: "logistics",
    section: "Account and Registration",
    classification: "transactional",
    subjectTemplate: "Logistics Application Submitted for {{courier_name}}",
    previewTextTemplate: "Your CAC/registration and fleet credentials have been received by Shopiversity.",
    badgeLabel: "APPLICATION SUBMITTED",
    badgeColor: "#3b82f6",
    heroTitleTemplate: "Courier Onboarding Submitted",
    greetingTemplate: "Hello {{courier_name}},",
    bodyParagraphs: [
      "We have received your logistics onboarding profile, fleet details, and verification documents for {{courier_name}}.",
      "Our campus operations team will review your submission shortly."
    ],
    detailRows: [
      { label: "Company Name", valueTemplate: "{{courier_name}}" },
      { label: "Status", valueTemplate: "Submitted for Review" }
    ],
    ctaLabel: "View Partner Profile",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "logistics.application_submitted",
    requiredVariables: ["courier_name", "dashboard_url", "support_email"],
    sendingConditions: "Send once when logistics partner submits CAC/fleet onboarding form.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "logistics_application_under_review",
    code: "L-04",
    name: "Courier Application Under Review",
    recipientCategory: "logistics",
    section: "Account and Registration",
    classification: "transactional",
    subjectTemplate: "Courier Application Under Review - {{courier_name}}",
    previewTextTemplate: "Your fleet credentials are being reviewed by Shopiversity Operations.",
    badgeLabel: "UNDER REVIEW",
    badgeColor: "#f59e0b",
    heroTitleTemplate: "Application Under Operations Review",
    greetingTemplate: "Hello {{courier_name}},",
    bodyParagraphs: [
      "Our operations team is verifying your fleet information, covered campuses, and CAC details for {{courier_name}}.",
      "You will receive an instant email once your dispatch hub is approved."
    ],
    detailRows: [
      { label: "Courier Partner", valueTemplate: "{{courier_name}}" },
      { label: "Stage", valueTemplate: "Operations & Safety Review" }
    ],
    ctaLabel: "Check Onboarding Status",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "logistics.application_under_review",
    requiredVariables: ["courier_name", "dashboard_url", "support_email"],
    sendingConditions: "Send when admin starts reviewing logistics registration.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "logistics_account_approved",
    code: "L-05",
    name: "Courier Account Approved",
    recipientCategory: "logistics",
    section: "Account and Registration",
    classification: "transactional",
    subjectTemplate: "Approved: {{courier_name}} Is Now a Verified Shopiversity Courier",
    previewTextTemplate: "Your logistics company can now accept campus delivery gigs across Shopiversity.",
    badgeLabel: "COURIER APPROVED",
    badgeColor: "#10b981",
    heroTitleTemplate: "Courier Account Approved",
    greetingTemplate: "Hello {{courier_name}},",
    bodyParagraphs: [
      "Congratulations! {{courier_name}} has passed verification and is approved to operate as an official Shopiversity Logistics Partner.",
      "Check Available Delivery Requests inside your Logistics Hub to accept your first gig."
    ],
    detailRows: [
      { label: "Logistics Partner", valueTemplate: "{{courier_name}}" },
      { label: "Status", valueTemplate: "Verified Partner" }
    ],
    ctaLabel: "View Delivery Requests",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "logistics.account_approved",
    requiredVariables: ["courier_name", "dashboard_url", "support_email"],
    sendingConditions: "Send when admin approves logistics account.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "logistics_account_rejected",
    code: "L-06",
    name: "Courier Account Rejected",
    recipientCategory: "logistics",
    section: "Account and Registration",
    classification: "transactional",
    subjectTemplate: "Courier Verification Update Needed for {{courier_name}}",
    previewTextTemplate: "Your logistics partner application was declined. Review reason and re-apply.",
    badgeLabel: "APPLICATION DECLINED",
    badgeColor: "#ef4444",
    heroTitleTemplate: "Courier Application Not Approved",
    greetingTemplate: "Hello {{courier_name}},",
    bodyParagraphs: [
      "Your logistics application for {{courier_name}} could not be approved at this stage.",
      "Reason: {{rejection_reason}}. Please update your credentials inside your Logistics Profile and contact {{support_email}} if needed."
    ],
    detailRows: [
      { label: "Company Name", valueTemplate: "{{courier_name}}" },
      { label: "Rejection Reason", valueTemplate: "{{rejection_reason}}" }
    ],
    ctaLabel: "Update Fleet Credentials",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "logistics.account_rejected",
    requiredVariables: ["courier_name", "rejection_reason", "dashboard_url", "support_email"],
    sendingConditions: "Send with required `rejection_reason` when admin rejects logistics application.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "logistics_account_activated",
    code: "L-07",
    name: "Courier Account Activated",
    recipientCategory: "logistics",
    section: "Account and Registration",
    classification: "transactional",
    subjectTemplate: "Dispatch Activated: {{courier_name}} Now Appears to Campus Merchants",
    previewTextTemplate: "Merchants can now select {{courier_name}} when booking product deliveries.",
    badgeLabel: "DISPATCH ACTIVE",
    badgeColor: "#10b981",
    heroTitleTemplate: "Your Dispatch Hub Is Live",
    greetingTemplate: "Hello {{courier_name}},",
    bodyParagraphs: [
      "{{courier_name}} is now visible to Shopiversity merchants for automated checkout and manual dispatch bookings.",
      "Always verify both the Seller Handover PIN at pickup and the Buyer Delivery PIN at drop-off."
    ],
    detailRows: [
      { label: "Company", valueTemplate: "{{courier_name}}" },
      { label: "Visibility", valueTemplate: "Active Across Covered Campuses" }
    ],
    ctaLabel: "Go to Logistics Hub",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "logistics.account_activated",
    requiredVariables: ["courier_name", "dashboard_url", "support_email"],
    sendingConditions: "Send once profile completeness threshold is met and company goes active.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "logistics_account_status_changed",
    code: "L-08",
    name: "Courier Account Suspended or Reinstated",
    recipientCategory: "logistics",
    section: "Account and Registration",
    classification: "transactional",
    subjectTemplate: "Courier Account Status Notice: {{account_status}} ({{courier_name}})",
    previewTextTemplate: "Important status update regarding your Shopiversity logistics dispatch privileges.",
    badgeLabel: "ACCOUNT STATUS NOTICE",
    badgeColor: "#dc2626",
    heroTitleTemplate: "Courier Account {{account_status}}",
    greetingTemplate: "Hello {{courier_name}},",
    bodyParagraphs: [
      "Your Shopiversity Logistics Hub status has been updated to: {{account_status}}.",
      "Details: {{status_reason}}"
    ],
    detailRows: [
      { label: "Logistics Company", valueTemplate: "{{courier_name}}" },
      { label: "New Status", valueTemplate: "{{account_status}}" },
      { label: "Details", valueTemplate: "{{status_reason}}" }
    ],
    ctaLabel: "Contact Operations Desk",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "logistics.account_moderation_updated",
    requiredVariables: ["courier_name", "account_status", "status_reason", "dashboard_url", "support_email"],
    sendingConditions: "Send immediately when admin suspends or reinstates courier account.",
    recommendedSchedule: "Immediate (Real-time)"
  },

  // ==================== DELIVERY ASSIGNMENTS (9-24) ====================
  {
    id: "logistics_assignment_new",
    code: "L-09",
    name: "New Delivery Assignment",
    recipientCategory: "logistics",
    section: "Delivery Assignments",
    classification: "transactional",
    subjectTemplate: "New Delivery Job ({{order_id}}): {{product_name}} - Accept in Logistics Hub",
    previewTextTemplate: "{{seller_name}} booked {{courier_name}} to deliver to {{buyer_name}}.",
    badgeLabel: "NEW DELIVERY JOB",
    badgeColor: "#ff6b00",
    heroTitleTemplate: "New Delivery Assignment Available",
    greetingTemplate: "Hello {{courier_name}},",
    bodyParagraphs: [
      "Merchant {{seller_name}} has assigned order {{order_id}} ({{product_name}}) to {{courier_name}} for delivery to {{buyer_name}}.",
      "Open your Logistics Hub to accept or decline this delivery job."
    ],
    detailRows: [
      { label: "Order ID", valueTemplate: "{{order_id}}" },
      { label: "Package", valueTemplate: "{{product_name}}" },
      { label: "Pickup From", valueTemplate: "{{pickup_address}}", hideIfEmptyVar: "pickup_address" },
      { label: "Deliver To", valueTemplate: "{{delivery_address}}", hideIfEmptyVar: "delivery_address" },
      { label: "Delivery Fee", valueTemplate: "{{delivery_fee}}", hideIfEmptyVar: "delivery_fee" }
    ],
    ctaLabel: "Accept or Decline Job",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "logistics.job_assigned",
    requiredVariables: ["courier_name", "seller_name", "buyer_name", "order_id", "product_name", "pickup_address", "delivery_address", "delivery_fee", "dashboard_url", "support_email"],
    sendingConditions: "Send once when delivery job is booked at checkout or from Seller Dashboard.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "logistics_assignment_accepted",
    code: "L-10",
    name: "Delivery Assignment Accepted",
    recipientCategory: "logistics",
    section: "Delivery Assignments",
    classification: "transactional",
    subjectTemplate: "Delivery Job Accepted ({{order_id}}) - Proceed to Seller Pickup",
    previewTextTemplate: "You accepted delivery {{order_id}}. Verify Seller Handover PIN upon pickup.",
    badgeLabel: "JOB ACCEPTED",
    badgeColor: "#10b981",
    heroTitleTemplate: "Delivery Assignment Confirmed",
    greetingTemplate: "Hello {{courier_name}},",
    bodyParagraphs: [
      "You have confirmed delivery assignment {{order_id}} for {{product_name}}.",
      "Proceed to {{pickup_address}} and request the Seller Handover PIN from {{seller_name}} upon collection."
    ],
    detailRows: [
      { label: "Order ID", valueTemplate: "{{order_id}}" },
      { label: "Merchant", valueTemplate: "{{seller_name}}" },
      { label: "Pickup Address", valueTemplate: "{{pickup_address}}", hideIfEmptyVar: "pickup_address" },
      { label: "Delivery Address", valueTemplate: "{{delivery_address}}", hideIfEmptyVar: "delivery_address" },
      { label: "ETA Committed", valueTemplate: "{{estimated_delivery_date}}", hideIfEmptyVar: "estimated_delivery_date" }
    ],
    ctaLabel: "Open Active Shipments",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "logistics.job_accepted",
    requiredVariables: ["courier_name", "seller_name", "order_id", "product_name", "pickup_address", "delivery_address", "estimated_delivery_date", "dashboard_url", "support_email"],
    sendingConditions: "Send immediately when courier accepts job.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "logistics_assignment_rejected",
    code: "L-11",
    name: "Delivery Assignment Rejected",
    recipientCategory: "logistics",
    section: "Delivery Assignments",
    classification: "transactional",
    subjectTemplate: "Delivery Assignment Declined ({{order_id}})",
    previewTextTemplate: "You declined dispatch request {{order_id}}; seller has been notified to reassign.",
    badgeLabel: "JOB DECLINED",
    badgeColor: "#64748b",
    heroTitleTemplate: "Delivery Assignment Declined",
    greetingTemplate: "Hello {{courier_name}},",
    bodyParagraphs: [
      "This confirms you declined delivery request {{order_id}} ({{product_name}}) from {{seller_name}}.",
      "The order has been released back to the merchant so another courier can fulfill it."
    ],
    detailRows: [
      { label: "Order ID", valueTemplate: "{{order_id}}" },
      { label: "Product", valueTemplate: "{{product_name}}" },
      { label: "Status", valueTemplate: "Declined by Courier" }
    ],
    ctaLabel: "View Available Requests",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "logistics.job_declined",
    requiredVariables: ["courier_name", "seller_name", "order_id", "product_name", "dashboard_url", "support_email"],
    sendingConditions: "Send when courier clicks Decline Job.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "logistics_assignment_reassigned",
    code: "L-12",
    name: "Delivery Assignment Reassigned",
    recipientCategory: "logistics",
    section: "Delivery Assignments",
    classification: "transactional",
    subjectTemplate: "Notice: Delivery {{order_id}} Has Been Reassigned",
    previewTextTemplate: "Order {{order_id}} has been reassigned to another dispatch partner.",
    badgeLabel: "JOB REASSIGNED",
    badgeColor: "#f59e0b",
    heroTitleTemplate: "Delivery Assignment Reassigned",
    greetingTemplate: "Hello {{courier_name}},",
    bodyParagraphs: [
      "Order {{order_id}} ({{product_name}}) is no longer assigned to {{courier_name}} and has been reassigned by the seller or operations desk.",
      "No further pickup action is required from your riders for this order."
    ],
    detailRows: [
      { label: "Order ID", valueTemplate: "{{order_id}}" },
      { label: "Product", valueTemplate: "{{product_name}}" },
      { label: "Status", valueTemplate: "Reassigned" }
    ],
    ctaLabel: "Return to Logistics Hub",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "logistics.job_reassigned",
    requiredVariables: ["courier_name", "order_id", "product_name", "dashboard_url", "support_email"],
    sendingConditions: "Send to previous logistics partner if order `logisticsId` changes before pickup.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "logistics_pickup_customer_details",
    code: "L-13",
    name: "Pickup Location and Customer Details",
    recipientCategory: "logistics",
    section: "Delivery Assignments",
    classification: "transactional",
    subjectTemplate: "Dispatch Manifest for Order {{order_id}} - Pickup & Buyer Details",
    previewTextTemplate: "Full pickup and drop-off contact details for order {{order_id}}.",
    badgeLabel: "DISPATCH MANIFEST",
    badgeColor: "#3b82f6",
    heroTitleTemplate: "Pickup & Customer Route Sheet",
    greetingTemplate: "Hello {{courier_name}},",
    bodyParagraphs: [
      "Here is the complete dispatch manifest for active assignment {{order_id}} ({{product_name}}).",
      "Coordinate pickup with {{seller_name}} first, then deliver safely to {{buyer_name}}."
    ],
    detailRows: [
      { label: "Order ID", valueTemplate: "{{order_id}}" },
      { label: "Seller & Pickup Point", valueTemplate: "{{seller_name}} - {{pickup_address}}" },
      { label: "Buyer & Drop-Off Point", valueTemplate: "{{buyer_name}} - {{delivery_address}}" },
      { label: "Tracking Code", valueTemplate: "{{tracking_number}}", hideIfEmptyVar: "tracking_number" }
    ],
    ctaLabel: "View Full Contact Sheet",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "logistics.manifest_dispatched",
    requiredVariables: ["courier_name", "seller_name", "buyer_name", "order_id", "product_name", "pickup_address", "delivery_address", "tracking_number", "dashboard_url", "support_email"],
    sendingConditions: "Send upon assignment acceptance when pickup and buyer addresses exist.",
    recommendedSchedule: "Immediate upon job acceptance"
  },
  {
    id: "logistics_seller_prepared_package",
    code: "L-14",
    name: "Seller Has Prepared the Package for Pickup",
    recipientCategory: "logistics",
    section: "Delivery Assignments",
    classification: "transactional",
    subjectTemplate: "Ready for Rider Pickup: Order {{order_id}} Packed by {{seller_name}}",
    previewTextTemplate: "{{seller_name}} marked {{product_name}} ready at {{pickup_address}}.",
    badgeLabel: "PACKAGE READY",
    badgeColor: "#10b981",
    heroTitleTemplate: "Merchant Ready for Courier Collection",
    greetingTemplate: "Hello {{courier_name}},",
    bodyParagraphs: [
      "{{seller_name}} has packed order {{order_id}} ({{product_name}}) and marked it ready for collection at {{pickup_address}}.",
      "Please dispatch your rider to collect the package and verify the Seller Handover PIN."
    ],
    detailRows: [
      { label: "Order ID", valueTemplate: "{{order_id}}" },
      { label: "Seller", valueTemplate: "{{seller_name}}" },
      { label: "Pickup Point", valueTemplate: "{{pickup_address}}" }
    ],
    ctaLabel: "Mark Picked Up in Hub",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "seller.package_ready_for_courier",
    requiredVariables: ["courier_name", "seller_name", "order_id", "product_name", "pickup_address", "dashboard_url", "support_email"],
    sendingConditions: "Send when seller signals parcel is packed and awaiting rider collection.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "logistics_pickup_reminder",
    code: "L-15",
    name: "Pickup Reminder",
    recipientCategory: "logistics",
    section: "Delivery Assignments",
    classification: "transactional",
    subjectTemplate: "Pickup Reminder: Order {{order_id}} Still Awaiting Collection",
    previewTextTemplate: "Collect {{product_name}} from {{seller_name}} soon to keep committed SLA.",
    badgeLabel: "PICKUP REMINDER",
    badgeColor: "#f59e0b",
    heroTitleTemplate: "Pending Merchant Pickup Reminder",
    greetingTemplate: "Hello {{courier_name}},",
    bodyParagraphs: [
      "Friendly reminder: accepted delivery {{order_id}} ({{product_name}}) is still awaiting rider collection from {{seller_name}} at {{pickup_address}}.",
      "Verify the Seller Handover PIN as soon as your rider picks up the parcel."
    ],
    detailRows: [
      { label: "Order ID", valueTemplate: "{{order_id}}" },
      { label: "Pickup Address", valueTemplate: "{{pickup_address}}" },
      { label: "Committed ETA", valueTemplate: "{{estimated_delivery_date}}", hideIfEmptyVar: "estimated_delivery_date" }
    ],
    ctaLabel: "Verify Pickup PIN",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "logistics.pickup_sla_reminder",
    requiredVariables: ["courier_name", "seller_name", "order_id", "product_name", "pickup_address", "estimated_delivery_date", "dashboard_url", "support_email"],
    sendingConditions: "Send only if job remains in `accepted` state (not `picked_up`) past 2 hours.",
    recommendedSchedule: "2 hours after acceptance if not yet picked up"
  },
  {
    id: "logistics_package_collected",
    code: "L-16",
    name: "Package Successfully Collected",
    recipientCategory: "logistics",
    section: "Delivery Assignments",
    classification: "transactional",
    subjectTemplate: "Pickup Confirmed for Order {{order_id}} - Proceed to Delivery",
    previewTextTemplate: "Seller handover PIN verified; order {{order_id}} is now marked picked up.",
    badgeLabel: "PACKAGE COLLECTED",
    badgeColor: "#6366f1",
    heroTitleTemplate: "Package Collected from Merchant",
    greetingTemplate: "Hello {{courier_name}},",
    bodyParagraphs: [
      "Seller handover has been confirmed for order {{order_id}} ({{product_name}}).",
      "Proceed to deliver the package to {{buyer_name}} at {{delivery_address}} and request the Buyer Delivery PIN after customer inspection."
    ],
    detailRows: [
      { label: "Order ID", valueTemplate: "{{order_id}}" },
      { label: "Destination", valueTemplate: "{{delivery_address}}" },
      { label: "Delivery Status", valueTemplate: "Picked Up / In Transit" }
    ],
    ctaLabel: "Update to Out for Delivery",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "logistics.package_picked_up_courier",
    requiredVariables: ["courier_name", "buyer_name", "order_id", "product_name", "delivery_address", "dashboard_url", "support_email"],
    sendingConditions: "Send when logistics hub moves job from `accepted` to `picked_up`.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "logistics_package_in_transit",
    code: "L-17",
    name: "Package In Transit",
    recipientCategory: "logistics",
    section: "Delivery Assignments",
    classification: "transactional",
    subjectTemplate: "Shipment In Transit: Order {{order_id}}",
    previewTextTemplate: "Tracking log recorded: order {{order_id}} is actively moving toward {{delivery_address}}.",
    badgeLabel: "IN TRANSIT LOG",
    badgeColor: "#4f46e5",
    heroTitleTemplate: "Shipment Marked In Transit",
    greetingTemplate: "Hello {{courier_name}},",
    bodyParagraphs: [
      "Order {{order_id}} ({{product_name}}) is logged as In Transit toward {{buyer_name}} at {{delivery_address}}.",
      "Buyer and seller tracking timelines have been updated automatically."
    ],
    detailRows: [
      { label: "Order ID", valueTemplate: "{{order_id}}" },
      { label: "Tracking Number", valueTemplate: "{{tracking_number}}", hideIfEmptyVar: "tracking_number" },
      { label: "Status", valueTemplate: "In Transit" }
    ],
    ctaLabel: "View Active Shipments",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "logistics.package_in_transit",
    requiredVariables: ["courier_name", "buyer_name", "order_id", "product_name", "delivery_address", "tracking_number", "dashboard_url", "support_email"],
    sendingConditions: "Send when transit checkpoint is logged.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "logistics_package_out_for_delivery",
    code: "L-18",
    name: "Package Out for Delivery",
    recipientCategory: "logistics",
    section: "Delivery Assignments",
    classification: "transactional",
    subjectTemplate: "Out for Doorstep Delivery: Order {{order_id}}",
    previewTextTemplate: "Buyer {{buyer_name}} was alerted to keep their Delivery PIN ready for your rider.",
    badgeLabel: "OUT FOR DELIVERY",
    badgeColor: "#7c3aed",
    heroTitleTemplate: "Final Drop-Off Stage Active",
    greetingTemplate: "Hello {{courier_name}},",
    bodyParagraphs: [
      "Order {{order_id}} ({{product_name}}) is now marked Out for Delivery to {{buyer_name}}.",
      "Ensure the buyer inspects the package and verify their 6-digit Buyer Delivery PIN inside your Logistics Hub upon handover."
    ],
    detailRows: [
      { label: "Order ID", valueTemplate: "{{order_id}}" },
      { label: "Buyer", valueTemplate: "{{buyer_name}}" },
      { label: "Delivery Address", valueTemplate: "{{delivery_address}}" }
    ],
    ctaLabel: "Verify Delivery PIN",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "logistics.out_for_delivery_courier",
    requiredVariables: ["courier_name", "buyer_name", "order_id", "product_name", "delivery_address", "dashboard_url", "support_email"],
    sendingConditions: "Send when job moves to `in_transit` / Out For Delivery.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "logistics_delivery_completed",
    code: "L-19",
    name: "Delivery Successfully Completed",
    recipientCategory: "logistics",
    section: "Delivery Assignments",
    classification: "transactional",
    subjectTemplate: "Delivery Completed: Order {{order_id}} Handed Over to {{buyer_name}}",
    previewTextTemplate: "Drop-off for {{product_name}} is recorded and delivery fee credited.",
    badgeLabel: "DELIVERY COMPLETED",
    badgeColor: "#10b981",
    heroTitleTemplate: "Delivery Completed & Verified",
    greetingTemplate: "Hello {{courier_name}},",
    bodyParagraphs: [
      "Great job! Delivery for order {{order_id}} ({{product_name}}) to {{buyer_name}} has been verified and recorded as delivered.",
      "Your logistics delivery record is now finalized in your completed shipments log."
    ],
    detailRows: [
      { label: "Order ID", valueTemplate: "{{order_id}}" },
      { label: "Recipient", valueTemplate: "{{buyer_name}}" },
      { label: "Delivery Fee Earned", valueTemplate: "{{delivery_fee}}", hideIfEmptyVar: "delivery_fee" },
      { label: "Status", valueTemplate: "Delivered" }
    ],
    ctaLabel: "View Completed History",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "logistics.delivery_completed",
    requiredVariables: ["courier_name", "buyer_name", "order_id", "product_name", "delivery_fee", "dashboard_url", "support_email"],
    sendingConditions: "Send when Buyer Delivery PIN is verified or delivery hits `delivered`.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "logistics_delivery_unsuccessful",
    code: "L-20",
    name: "Delivery Unsuccessful",
    recipientCategory: "logistics",
    section: "Delivery Assignments",
    classification: "transactional",
    subjectTemplate: "Failed Delivery Logged for Order {{order_id}}",
    previewTextTemplate: "Follow re-attempt or merchant return steps for order {{order_id}}.",
    badgeLabel: "DELIVERY UNSUCCESSFUL",
    badgeColor: "#f59e0b",
    heroTitleTemplate: "Delivery Attempt Logged as Unsuccessful",
    greetingTemplate: "Hello {{courier_name}},",
    bodyParagraphs: [
      "The delivery attempt for order {{order_id}} ({{product_name}}) has been recorded as unsuccessful.",
      "Reason: {{failure_reason}}. Coordinate one additional delivery attempt with {{buyer_name}} or return the parcel safely to {{seller_name}}."
    ],
    detailRows: [
      { label: "Order ID", valueTemplate: "{{order_id}}" },
      { label: "Buyer", valueTemplate: "{{buyer_name}}" },
      { label: "Reason", valueTemplate: "{{failure_reason}}" }
    ],
    ctaLabel: "Update Delivery Log",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "logistics.delivery_unsuccessful",
    requiredVariables: ["courier_name", "buyer_name", "seller_name", "order_id", "product_name", "failure_reason", "dashboard_url", "support_email"],
    sendingConditions: "Send when courier logs generic failed attempt.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "logistics_customer_unavailable",
    code: "L-21",
    name: "Customer Unavailable",
    recipientCategory: "logistics",
    section: "Delivery Assignments",
    classification: "transactional",
    subjectTemplate: "Customer Unavailable Log: Order {{order_id}}",
    previewTextTemplate: "Buyer {{buyer_name}} has been alerted regarding missed handover attempt.",
    badgeLabel: "CUSTOMER UNAVAILABLE",
    badgeColor: "#f59e0b",
    heroTitleTemplate: "Recipient Unavailable at Drop-Off",
    greetingTemplate: "Hello {{courier_name}},",
    bodyParagraphs: [
      "We logged that {{buyer_name}} was unreachable during your drop-off attempt for order {{order_id}}.",
      "The buyer has been emailed and notified in-app to confirm a new drop-off window."
    ],
    detailRows: [
      { label: "Order ID", valueTemplate: "{{order_id}}" },
      { label: "Drop-Off Address", valueTemplate: "{{delivery_address}}" }
    ],
    ctaLabel: "Open Active Deliveries",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "logistics.customer_unavailable",
    requiredVariables: ["courier_name", "buyer_name", "order_id", "delivery_address", "dashboard_url", "support_email"],
    sendingConditions: "Send when rider selects Customer Unavailable exception.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "logistics_wrong_address",
    code: "L-22",
    name: "Wrong or Incomplete Delivery Address",
    recipientCategory: "logistics",
    section: "Delivery Assignments",
    classification: "transactional",
    subjectTemplate: "Address Issue Reported on Order {{order_id}}",
    previewTextTemplate: "Buyer has been prompted to correct address {{delivery_address}}.",
    badgeLabel: "ADDRESS CLARIFICATION",
    badgeColor: "#ea580c",
    heroTitleTemplate: "Address Correction Requested",
    greetingTemplate: "Hello {{courier_name}},",
    bodyParagraphs: [
      "Your report of an incomplete or incorrect delivery address on order {{order_id}} has been logged.",
      "Reported address: {{delivery_address}}. Wait for {{buyer_name}} or Support to confirm the corrected campus drop-off point."
    ],
    detailRows: [
      { label: "Order ID", valueTemplate: "{{order_id}}" },
      { label: "Submitted Address", valueTemplate: "{{delivery_address}}" },
      { label: "Buyer", valueTemplate: "{{buyer_name}}" }
    ],
    ctaLabel: "Manage Exception",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "logistics.wrong_address",
    requiredVariables: ["courier_name", "buyer_name", "order_id", "delivery_address", "dashboard_url", "support_email"],
    sendingConditions: "Send when rider flags `wrong_address` exception.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "logistics_package_returned_to_seller",
    code: "L-23",
    name: "Package Returned to Seller",
    recipientCategory: "logistics",
    section: "Delivery Assignments",
    classification: "transactional",
    subjectTemplate: "Return Completed: Order {{order_id}} Returned to {{seller_name}}",
    previewTextTemplate: "Package handover back to merchant is logged and closed.",
    badgeLabel: "RETURNED TO SELLER",
    badgeColor: "#4f46e5",
    heroTitleTemplate: "Package Safely Returned to Seller",
    greetingTemplate: "Hello {{courier_name}},",
    bodyParagraphs: [
      "Order {{order_id}} ({{product_name}}) has been recorded as safely returned to merchant {{seller_name}} at {{pickup_address}}."
    ],
    detailRows: [
      { label: "Order ID", valueTemplate: "{{order_id}}" },
      { label: "Merchant", valueTemplate: "{{seller_name}}" },
      { label: "Return Point", valueTemplate: "{{pickup_address}}" }
    ],
    ctaLabel: "View Shipment Log",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "logistics.returned_to_seller",
    requiredVariables: ["courier_name", "seller_name", "order_id", "product_name", "pickup_address", "dashboard_url", "support_email"],
    sendingConditions: "Send when undeliverable/returned parcel is handed back to merchant.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "logistics_delivery_cancelled",
    code: "L-24",
    name: "Delivery Cancelled",
    recipientCategory: "logistics",
    section: "Delivery Assignments",
    classification: "transactional",
    subjectTemplate: "Delivery Cancelled for Order {{order_id}} - Stand Down",
    previewTextTemplate: "Order {{order_id}} was cancelled; do not collect or dispatch.",
    badgeLabel: "DELIVERY CANCELLED",
    badgeColor: "#dc2626",
    heroTitleTemplate: "Dispatch Assignment Cancelled",
    greetingTemplate: "Hello {{courier_name}},",
    bodyParagraphs: [
      "Order {{order_id}} ({{product_name}}) has been cancelled prior to completion. Please stand down any rider assigned to this pickup.",
      "No further logistics action is needed."
    ],
    detailRows: [
      { label: "Order ID", valueTemplate: "{{order_id}}" },
      { label: "Product", valueTemplate: "{{product_name}}" },
      { label: "Status", valueTemplate: "Cancelled" }
    ],
    ctaLabel: "View Active Queue",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "logistics.delivery_cancelled",
    requiredVariables: ["courier_name", "order_id", "product_name", "dashboard_url", "support_email"],
    sendingConditions: "Send when an order with a linked `logisticsId` is cancelled.",
    recommendedSchedule: "Immediate (Real-time)"
  },

  // ==================== EARNINGS AND PERFORMANCE (25-31) ====================
  {
    id: "logistics_new_delivery_earning",
    code: "L-25",
    name: "New Delivery Earning Notification",
    recipientCategory: "logistics",
    section: "Earnings and Performance",
    classification: "transactional",
    subjectTemplate: "Delivery Fee Earned: {{delivery_fee}} on Order {{order_id}}",
    previewTextTemplate: "Completed delivery {{order_id}} added {{delivery_fee}} to your courier earnings.",
    badgeLabel: "DELIVERY EARNING",
    badgeColor: "#10b981",
    heroTitleTemplate: "New Delivery Earning Credited",
    greetingTemplate: "Hello {{courier_name}},",
    bodyParagraphs: [
      "Delivery assignment {{order_id}} ({{product_name}}) is confirmed complete and your courier fee of {{delivery_fee}} has been added to your Logistics Hub earnings pool."
    ],
    detailRows: [
      { label: "Order ID", valueTemplate: "{{order_id}}" },
      { label: "Delivery Fee Credited", valueTemplate: "{{delivery_fee}}" },
      { label: "Available Balance", valueTemplate: "{{available_balance}}", hideIfEmptyVar: "available_balance" }
    ],
    ctaLabel: "View Courier Earnings",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "logistics.earning_credited",
    requiredVariables: ["courier_name", "order_id", "product_name", "delivery_fee", "available_balance", "dashboard_url", "support_email"],
    sendingConditions: "Send once when delivery reaches completion/delivered.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "logistics_fee_update",
    code: "L-26",
    name: "Delivery Commission or Fee Update",
    recipientCategory: "logistics",
    section: "Earnings and Performance",
    classification: "transactional",
    subjectTemplate: "Courier Rate & Fee Schedule Updated for {{courier_name}}",
    previewTextTemplate: "Your base campus delivery fee or commission rate has been updated.",
    badgeLabel: "FEE SCHEDULE UPDATE",
    badgeColor: "#3b82f6",
    heroTitleTemplate: "Delivery Fee & Commission Update",
    greetingTemplate: "Hello {{courier_name}},",
    bodyParagraphs: [
      "This confirms an update to your delivery pricing or platform logistics fee schedule on Shopiversity.",
      "Updated delivery rate: {{delivery_fee}}. Effective immediately on all new delivery assignments."
    ],
    detailRows: [
      { label: "Logistics Company", valueTemplate: "{{courier_name}}" },
      { label: "Base Rate / Update", valueTemplate: "{{delivery_fee}}" }
    ],
    ctaLabel: "Review Logistics Rates",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "logistics.fee_updated",
    requiredVariables: ["courier_name", "delivery_fee", "dashboard_url", "support_email"],
    sendingConditions: "Send when courier saves updated `baseDeliveryPrice` or platform adjusts logistics fee tier.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "logistics_payout_initiated",
    code: "L-27",
    name: "Courier Payout Initiated",
    recipientCategory: "logistics",
    section: "Earnings and Performance",
    classification: "transactional",
    subjectTemplate: "Courier Payout Initiated: {{payout_amount}}",
    previewTextTemplate: "Your payout request ({{payout_id}}) to {{bank_account_summary}} is underway.",
    badgeLabel: "PAYOUT INITIATED",
    badgeColor: "#3b82f6",
    heroTitleTemplate: "Courier Payout Initiated",
    greetingTemplate: "Hello {{courier_name}},",
    bodyParagraphs: [
      "Your logistics settlement withdrawal {{payout_id}} for {{payout_amount}} has been initiated to {{bank_account_summary}}."
    ],
    detailRows: [
      { label: "Payout Reference", valueTemplate: "{{payout_id}}" },
      { label: "Amount", valueTemplate: "{{payout_amount}}" },
      { label: "Bank Destination", valueTemplate: "{{bank_account_summary}}" }
    ],
    ctaLabel: "Track Payout",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "logistics.payout_initiated",
    requiredVariables: ["courier_name", "payout_id", "payout_amount", "bank_account_summary", "dashboard_url", "support_email"],
    sendingConditions: "Send when courier submits payout request or admin approves.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "logistics_payout_successful",
    code: "L-28",
    name: "Courier Payout Successful",
    recipientCategory: "logistics",
    section: "Earnings and Performance",
    classification: "transactional",
    subjectTemplate: "Courier Payout Paid: {{payout_amount}} Sent to {{bank_account_summary}}",
    previewTextTemplate: "Your logistics payout transfer {{payout_id}} completed successfully.",
    badgeLabel: "PAYOUT SUCCESSFUL",
    badgeColor: "#10b981",
    heroTitleTemplate: "Courier Settlement Disbursed",
    greetingTemplate: "Hello {{courier_name}},",
    bodyParagraphs: [
      "Your Shopiversity Logistics settlement of {{payout_amount}} has been transferred successfully to {{bank_account_summary}}."
    ],
    detailRows: [
      { label: "Payout Reference", valueTemplate: "{{payout_id}}" },
      { label: "Amount Paid", valueTemplate: "{{payout_amount}}" },
      { label: "Bank Account", valueTemplate: "{{bank_account_summary}}" }
    ],
    ctaLabel: "View Settlement Ledger",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "logistics.payout_paid",
    requiredVariables: ["courier_name", "payout_id", "payout_amount", "bank_account_summary", "dashboard_url", "support_email"],
    sendingConditions: "Send when courier payout status becomes `paid`.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "logistics_payout_failed",
    code: "L-29",
    name: "Courier Payout Failed",
    recipientCategory: "logistics",
    section: "Earnings and Performance",
    classification: "transactional",
    subjectTemplate: "Action Needed: Courier Payout {{payout_id}} Failed",
    previewTextTemplate: "Transfer of {{payout_amount}} could not finish. Review settlement bank details.",
    badgeLabel: "PAYOUT FAILED",
    badgeColor: "#ef4444",
    heroTitleTemplate: "Courier Payout Could Not Complete",
    greetingTemplate: "Hello {{courier_name}},",
    bodyParagraphs: [
      "Your courier payout {{payout_id}} ({{payout_amount}}) could not be completed.",
      "Reason: {{failure_reason}}. Check your bank details inside Logistics Hub Settings."
    ],
    detailRows: [
      { label: "Payout Reference", valueTemplate: "{{payout_id}}" },
      { label: "Amount", valueTemplate: "{{payout_amount}}" },
      { label: "Reason", valueTemplate: "{{failure_reason}}" }
    ],
    ctaLabel: "Verify Bank Details",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "logistics.payout_failed",
    requiredVariables: ["courier_name", "payout_id", "payout_amount", "failure_reason", "dashboard_url", "support_email"],
    sendingConditions: "Send when bank transfer fails or payout request is rejected.",
    recommendedSchedule: "Immediate (Real-time)"
  },
  {
    id: "logistics_weekly_performance_report",
    code: "L-30",
    name: "Weekly Delivery Performance Report",
    recipientCategory: "logistics",
    section: "Earnings and Performance",
    classification: "marketing",
    subjectTemplate: "Weekly Courier Digest ({{report_period}}) - {{courier_name}}",
    previewTextTemplate: "Completed deliveries, on-time SLA rate, and weekly courier fees earned.",
    badgeLabel: "WEEKLY LOGISTICS DIGEST",
    badgeColor: "#4f46e5",
    heroTitleTemplate: "Weekly Delivery Performance Report",
    greetingTemplate: "Hello {{courier_name}},",
    bodyParagraphs: [
      "Here is your weekly Shopiversity courier scorecard for {{report_period}}.",
      "Keeping pickup times quick helps your fleet rank higher for campus merchants."
    ],
    detailRows: [
      { label: "Period", valueTemplate: "{{report_period}}" },
      { label: "Deliveries Completed", valueTemplate: "{{orders_count}}" },
      { label: "Weekly Delivery Fees", valueTemplate: "{{weekly_revenue}}" }
    ],
    ctaLabel: "Open Logistics Analytics",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "digest.logistics_weekly",
    requiredVariables: ["courier_name", "report_period", "orders_count", "weekly_revenue", "dashboard_url", "support_email"],
    sendingConditions: "Send only when `weeklyReports !== false`.",
    recommendedSchedule: "Every Monday at 8:00 AM local time"
  },
  {
    id: "logistics_monthly_performance_report",
    code: "L-31",
    name: "Monthly Courier Performance Report",
    recipientCategory: "logistics",
    section: "Earnings and Performance",
    classification: "marketing",
    subjectTemplate: "Monthly Courier Scorecard ({{report_period}}) - {{courier_name}}",
    previewTextTemplate: "Monthly deliveries, completion rate, and total fees earned on Shopiversity.",
    badgeLabel: "MONTHLY SCORECARD",
    badgeColor: "#0f172a",
    heroTitleTemplate: "Monthly Courier Performance Summary",
    greetingTemplate: "Hello {{courier_name}},",
    bodyParagraphs: [
      "Your monthly courier operations summary for {{report_period}} is ready.",
      "Thank you for keeping student deliveries fast, safe, and reliable across Shopiversity."
    ],
    detailRows: [
      { label: "Month", valueTemplate: "{{report_period}}" },
      { label: "Total Deliveries", valueTemplate: "{{orders_count}}" },
      { label: "Total Fees Earned", valueTemplate: "{{monthly_revenue}}" }
    ],
    ctaLabel: "Review Full Scorecard",
    ctaUrlTemplate: "{{dashboard_url}}",
    triggerEvent: "digest.logistics_monthly",
    requiredVariables: ["courier_name", "report_period", "orders_count", "monthly_revenue", "dashboard_url", "support_email"],
    sendingConditions: "Send only when `monthlyReports !== false`.",
    recommendedSchedule: "1st day of every month at 8:00 AM local time"
  }
];
