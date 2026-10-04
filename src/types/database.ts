export type UserRole = 'ADMIN' | 'STOREKEEPER' | 'STAFF' | 'STUDENT';

export type PersonRole = 'STUDENT' | 'STAFF' | 'TEACHER' | 'OTHER';

export type TrackingType = 'ASSET' | 'STOCK';

export type ItemCondition = 'GOOD' | 'FAIR' | 'DAMAGED' | 'MAINTENANCE' | 'RETIRED';

export type ItemUnit =
  | 'piece'
  | 'set'
  | 'pair'
  | 'box'
  | 'bottle'
  | 'litre'
  | 'kg'
  | 'pack';

export type ItemDisplayStatus =
  | 'Available'
  | 'Low Stock'
  | 'Out of Stock'
  | 'Maintenance'
  | 'Inactive';

export type IssueStatus = 'ACTIVE' | 'PARTIALLY_RETURNED' | 'RETURNED' | 'OVERDUE';

export type ReturnCondition = 'GOOD' | 'FAIR' | 'DAMAGED' | 'NEEDS_REPAIR';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  avatar_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Computed / aggregated
  item_count?: number;
}

export interface Item {
  id: string;
  item_code: string;
  name: string;
  category_id: string;
  category?: Category | null;
  description?: string | null;
  tracking_type: TrackingType;
  unit: ItemUnit;
  unit_price?: number | null;
  total_quantity: number;
  available_quantity: number;
  minimum_quantity: number;
  location: string;
  condition: ItemCondition;
  image_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Person {
  id: string;
  admission_number?: string | null;
  full_name: string;
  role: PersonRole;
  department?: string | null;
  class_name?: string | null;
  phone?: string | null;
  email?: string | null;
  photo_url?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InstitutionSettings {
  id: string;
  institution_name: string;
  logo_url?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  updated_at: string;
}

// =====================================================================
// ISSUE / RETURN TYPES (Phase 2)
// =====================================================================

export interface IssueItem {
  id: string;
  issue_id: string;
  item_id: string;
  item?: Item | null;
  quantity_issued: number;
  quantity_returned: number;
  created_at: string;
}

export interface Issue {
  id: string;
  issue_number: string;
  person_id: string;
  person?: Person | null;
  issued_by: string; // Profile ID of storekeeper
  purpose?: string | null;
  expected_return_date?: string | null;
  status: IssueStatus;
  notes?: string | null;
  items: IssueItem[];
  created_at: string;
  updated_at: string;
}

export interface ReturnItem {
  id: string;
  return_id: string;
  issue_item_id: string;
  item_id: string;
  item?: Item | null;
  quantity_returned: number;
  condition: ReturnCondition;
  notes?: string | null;
  created_at: string;
}

export interface Return {
  id: string;
  return_number: string;
  issue_id: string;
  issue?: Issue | null;
  person_id: string;
  person?: Person | null;
  received_by: string; // Profile ID of storekeeper
  notes?: string | null;
  items: ReturnItem[];
  created_at: string;
  updated_at: string;
}

export type StockAdjustmentReason =
  | 'NEW_STOCK_RECEIVED'
  | 'PHYSICAL_COUNT_CORRECTION'
  | 'DAMAGED'
  | 'LOST'
  | 'OTHER';

export interface StockAdjustment {
  id: string;
  item_id: string;
  item?: Item | null;
  item_name?: string;
  quantity_before: number;
  quantity_change: number;
  quantity_after: number;
  reason: StockAdjustmentReason;
  notes?: string | null;
  performed_by: string; // Storekeeper name/email
  created_at: string;
}

export type AuditActionType =
  | 'ITEM_ADDED'
  | 'ITEM_EDITED'
  | 'ITEM_DEACTIVATED'
  | 'ITEM_REACTIVATED'
  | 'ITEM_IMAGE_CHANGED'
  | 'CATEGORY_CREATED'
  | 'CATEGORY_EDITED'
  | 'CATEGORY_DEACTIVATED'
  | 'PERSON_ADDED'
  | 'PERSON_IMPORTED'
  | 'PERSON_EDITED'
  | 'PERSON_DEACTIVATED'
  | 'ITEM_ISSUED'
  | 'ITEM_RETURNED'
  | 'STOCK_ADJUSTED';

export interface AuditLog {
  id: string;
  action_type: AuditActionType;
  details: string;
  entity_ref?: string | null;
  performed_by: string;
  created_at: string;
}

/**
 * Status computation logic strictly following Phase 1 specification:
 * - Maintenance: condition = MAINTENANCE
 * - Inactive: !is_active
 * - Out of Stock: available_quantity = 0
 * - Low Stock: available_quantity <= minimum_quantity AND > 0
 * - Available: available_quantity > minimum_quantity
 */
export function getItemDisplayStatus(item: {
  is_active: boolean;
  condition: ItemCondition;
  total_quantity: number;
  available_quantity?: number;
  minimum_quantity: number;
}): ItemDisplayStatus {
  if (!item.is_active) return 'Inactive';
  if (item.condition === 'MAINTENANCE') return 'Maintenance';
  const qty = item.available_quantity ?? item.total_quantity;
  if (qty === 0) return 'Out of Stock';
  if (qty <= item.minimum_quantity && qty > 0) {
    return 'Low Stock';
  }
  return 'Available';
}
