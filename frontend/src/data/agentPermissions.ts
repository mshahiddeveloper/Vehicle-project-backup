'use client';

/**
 * SafarPK Enterprise Hierarchical Permission System
 * Shopify-grade multi-tier permission matrix: Main Module -> Submodule -> Action
 */

export interface PermissionAction {
  id: string; // e.g. "customer.view"
  label: string; // e.g. "View Customers"
  description: string;
}

export interface PermissionSubmodule {
  id: string; // e.g. "customer.profiles"
  label: string; // e.g. "Customer Profiles & Records"
  actions: PermissionAction[];
}

export interface PermissionModule {
  id: string; // e.g. "customer"
  label: string; // e.g. "CUSTOMER MANAGEMENT"
  description: string;
  submodules: PermissionSubmodule[];
}

export const ENTERPRISE_PERMISSION_TREE: PermissionModule[] = [
  {
    id: 'customer',
    label: 'Customer Management',
    description: 'Manage registered and guest customer profiles, records, and bookings',
    submodules: [
      {
        id: 'customer.profiles',
        label: 'Profiles & Data',
        actions: [
          { id: 'customer.view', label: 'View Customers', description: 'Browse customer list and public details' },
          { id: 'customer.search', label: 'Search by Phone / Name', description: 'Search registered and guest customer records' },
          { id: 'customer.view_details', label: 'View Full Profile', description: 'Access contact, city, and verification metadata' },
          { id: 'customer.edit', label: 'Edit Customer Info', description: 'Update profile and contact information' },
          { id: 'customer.suspend', label: 'Suspend / Block Customer', description: 'Temporarily or permanently disable customer access' },
          { id: 'customer.export', label: 'Export Customer Data', description: 'Export customer lists and search reports' },
        ],
      },
      {
        id: 'customer.history',
        label: 'Booking & Activity History',
        actions: [
          { id: 'customer.view_bookings', label: 'View Customer Bookings', description: 'Inspect full historical bookings linked to customer' },
          { id: 'customer.view_activity', label: 'View Customer Activity', description: 'Review customer audit trail and login history' },
        ],
      },
    ],
  },
  {
    id: 'listing',
    label: 'Listing & Fleet Management',
    description: 'Inspect, verify, approve, reject, and manage vehicle & service listings',
    submodules: [
      {
        id: 'listing.moderation',
        label: 'Review & Moderation',
        actions: [
          { id: 'listing.view', label: 'View Listings', description: 'Browse and inspect all marketplace vehicle ads' },
          { id: 'listing.search', label: 'Search Listings', description: 'Filter by city, lister, category, and reference' },
          { id: 'listing.approve', label: 'Approve Listings', description: 'Approve draft/pending listings to go LIVE' },
          { id: 'listing.reject', label: 'Reject Listings', description: 'Decline listings with documented rejection reason' },
          { id: 'listing.suspend', label: 'Suspend Listings', description: 'Take down active listings for investigation' },
          { id: 'listing.activate', label: 'Reactivate Listings', description: 'Restore suspended listings back to LIVE status' },
        ],
      },
      {
        id: 'listing.authoring',
        label: 'Edit & Maintenance',
        actions: [
          { id: 'listing.create', label: 'Create Listing for Host', description: 'Manually assist a host in publishing an ad' },
          { id: 'listing.edit', label: 'Edit Listing Specs / Rates', description: 'Correct rates, specs, or images on behalf of host' },
          { id: 'listing.delete', label: 'Delete Listing', description: 'Permanently archive listing (Admin supervisor only)' },
        ],
      },
    ],
  },
  {
    id: 'driver',
    label: 'Driver & Chauffeur Management',
    description: 'Chauffeur profiles, driving licenses, background checks, and approvals',
    submodules: [
      {
        id: 'driver.profiles',
        label: 'Directory & Profiles',
        actions: [
          { id: 'driver.view', label: 'View Chauffeur Directory', description: 'Access list of independent drivers and status' },
          { id: 'driver.search', label: 'Search Drivers', description: 'Filter by license category, city, and experience' },
          { id: 'driver.view_details', label: 'View Driver Full Profile', description: 'Inspect contact, CNIC, and duty rates' },
        ],
      },
      {
        id: 'driver.verification',
        label: 'Document Verification',
        actions: [
          { id: 'driver.verify_docs', label: 'Verify Driver Documents', description: 'Review driving license scans and expiry' },
          { id: 'driver.approve', label: 'Approve Driver Account', description: 'Activate chauffeur profile for marketplace booking' },
          { id: 'driver.reject', label: 'Reject Driver Account', description: 'Decline driver profile with reason' },
          { id: 'driver.suspend', label: 'Suspend Driver Account', description: 'Pause driver profile for dispute or violation' },
        ],
      },
    ],
  },
  {
    id: 'payment',
    label: 'Payment & Billing Management',
    description: 'Review subscription payments, bank transfer receipts, and quotas',
    submodules: [
      {
        id: 'payment.reviews',
        label: 'Payment Verification',
        actions: [
          { id: 'payment.view', label: 'View Submitted Payments', description: 'Inspect pending subscription payment queue' },
          { id: 'payment.view_proof', label: 'Inspect Payment Proof Receipt', description: 'Review bank deposit slips and reference numbers' },
          { id: 'payment.approve', label: 'Approve Payment & Quota', description: 'Credit quota and activate host subscription' },
          { id: 'payment.reject', label: 'Reject Invalid Payment', description: 'Decline fraudulent or unmatched bank transfers' },
          { id: 'payment.history', label: 'View Payment History', description: 'Audit all completed and refunded transactions' },
        ],
      },
    ],
  },
  {
    id: 'booking',
    label: 'Booking & Dispatch Management',
    description: 'Track marketplace booking requests, dispatch statuses, and WhatsApp contact leads',
    submodules: [
      {
        id: 'booking.operations',
        label: 'Bookings & Orders',
        actions: [
          { id: 'booking.view', label: 'View All Bookings', description: 'Inspect bookings across all 5 marketplace services' },
          { id: 'booking.search', label: 'Search Bookings by Ref / Phone', description: 'Locate bookings via SF reference or mobile number' },
          { id: 'booking.view_details', label: 'View Booking Details', description: 'Review pickup/return dates, total cost, and options' },
          { id: 'booking.update_status', label: 'Update Booking Status', description: 'Change status to Confirmed, Completed, or Cancelled' },
          { id: 'booking.view_contact', label: 'View Customer Contact Info', description: 'Reveal unmasked customer phone and notes' },
        ],
      },
    ],
  },
  {
    id: 'complaint',
    label: 'Complaints & Dispute Resolution',
    description: 'Customer and host dispute tickets, mediation, and safety issues',
    submodules: [
      {
        id: 'complaint.tickets',
        label: 'Ticket Management',
        actions: [
          { id: 'complaint.view', label: 'View Complaints Queue', description: 'Browse pending, open, and escalated complaints' },
          { id: 'complaint.assign', label: 'Assign Complaints to Desk', description: 'Assign ticket to self or regional support desk' },
          { id: 'complaint.respond', label: 'Respond to Complainant', description: 'Send mediation messages to customer or lister' },
          { id: 'complaint.resolve', label: 'Close / Resolve Complaints', description: 'Mark dispute as resolved with conclusion notes' },
        ],
      },
    ],
  },
  {
    id: 'reports',
    label: 'Reports & Analytics',
    description: 'Marketplace traffic, conversion rates, leads, and operational performance',
    submodules: [
      {
        id: 'reports.analytics',
        label: 'Analytics & Insights',
        actions: [
          { id: 'reports.view_dashboard', label: 'View Dashboard Analytics', description: 'Inspect views, leads, and CTR charts' },
          { id: 'reports.view_customer', label: 'View Customer Insights', description: 'Analyze customer acquisition and search queries' },
          { id: 'reports.view_lister', label: 'View Host & Fleet Analytics', description: 'Inspect host performance and response times' },
          { id: 'reports.view_listing', label: 'View Listing Performance', description: 'Review individual car view/inquiry ratios' },
          { id: 'reports.export', label: 'Export Analytics Reports', description: 'Download CSV and Excel summary reports' },
        ],
      },
    ],
  },
  {
    id: 'platform',
    label: 'Platform Promotion & Featured Ads',
    description: 'Featured ad placement and promotional banner management',
    submodules: [
      {
        id: 'platform.promotions',
        label: 'Ad Placements',
        actions: [
          { id: 'platform.featured', label: 'Manage Featured Listings', description: 'Pin top vehicles and services to homepage hero' },
          { id: 'platform.promos', label: 'Manage Promo Codes', description: 'Issue discount codes for subscription plans' },
        ],
      },
    ],
  },
];

/**
 * Returns all permission IDs present in the tree
 */
export function getAllAvailablePermissionIds(): string[] {
  const ids: string[] = [];
  for (const mod of ENTERPRISE_PERMISSION_TREE) {
    for (const sub of mod.submodules) {
      for (const act of sub.actions) {
        ids.push(act.id);
      }
    }
  }
  return ids;
}

/**
 * Checks if an action permission is granted to an agent
 */
export function hasAgentPermission(
  agentPermissions: string[] | undefined | null,
  requiredPermission: string
): boolean {
  if (!agentPermissions || !Array.isArray(agentPermissions)) return false;
  if (agentPermissions.includes('*') || agentPermissions.includes('super_admin')) return true;
  return agentPermissions.includes(requiredPermission);
}

/**
 * Predefined enterprise permission role templates for rapid provisioning
 */
export interface AgentRoleTemplate {
  name: string;
  description: string;
  permissions: string[];
}

export const PREDEFINED_AGENT_TEMPLATES: Record<string, AgentRoleTemplate> = {
  LISTING_APPROVER: {
    name: 'Listing & Fleet Reviewer',
    description: 'Inspects and approves vehicle listings, checks specs and pricing.',
    permissions: [
      'listing.view',
      'listing.search',
      'listing.approve',
      'listing.reject',
      'listing.activate',
      'listing.edit',
      'platform.featured',
    ],
  },
  VERIFICATION_OFFICER: {
    name: 'Compliance & Verification Officer',
    description: 'Audits host identities, driving licenses, and corporate registrations.',
    permissions: [
      'driver.view',
      'driver.search',
      'driver.view_details',
      'driver.verify_docs',
      'driver.approve',
      'driver.reject',
      'customer.view',
      'customer.search',
      'customer.view_details',
    ],
  },
  FINANCE_SPECIALIST: {
    name: 'Finance & Payment Reviewer',
    description: 'Verifies subscription payment slips, bank deposits, and quota credits.',
    permissions: [
      'payment.view',
      'payment.view_proof',
      'payment.approve',
      'payment.reject',
      'payment.history',
      'reports.view_dashboard',
      'platform.promos',
    ],
  },
  CUSTOMER_SUPPORT: {
    name: 'Customer & Booking Support',
    description: 'Assists customers, looks up bookings, and mediates dispute tickets.',
    permissions: [
      'customer.view',
      'customer.search',
      'customer.view_details',
      'customer.view_bookings',
      'booking.view',
      'booking.search',
      'booking.view_details',
      'booking.view_contact',
      'complaint.view',
      'complaint.assign',
      'complaint.respond',
      'complaint.resolve',
    ],
  },
  OPERATIONS_LEAD: {
    name: 'Operations Lead / Supervisor',
    description: 'Full agent capabilities across listings, drivers, bookings, payments, and analytics.',
    permissions: getAllAvailablePermissionIds().filter((p) => !p.includes('delete')),
  },
};

