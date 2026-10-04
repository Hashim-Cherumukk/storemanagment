import {
  Category,
  Item,
  Person,
  Profile,
  InstitutionSettings,
  Issue,
  IssueItem,
  Return,
  ReturnItem,
  IssueStatus,
  ReturnCondition,
  getItemDisplayStatus,
  ItemDisplayStatus,
  StockAdjustment,
  StockAdjustmentReason,
  AuditLog,
  AuditActionType,
} from '@/types/database';
import {
  INITIAL_CATEGORIES,
  INITIAL_ITEMS,
  INITIAL_PEOPLE,
  INITIAL_PROFILES,
  INITIAL_SETTINGS,
} from './seed-data';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';

// In-memory persistent state for local development when Supabase URL is not configured
declare global {
  // eslint-disable-next-line no-var
  var __INSTITUTIONAL_STORE_DB__: {
    categories: Category[];
    items: Item[];
    people: Person[];
    profiles: Profile[];
    settings: InstitutionSettings;
    issues: Issue[];
    returns: Return[];
    stockAdjustments: StockAdjustment[];
    auditLogs: AuditLog[];
    issueCounter: number;
    returnCounter: number;
  } | undefined;
}

function getLocalStore() {
  if (!global.__INSTITUTIONAL_STORE_DB__) {
    global.__INSTITUTIONAL_STORE_DB__ = {
      categories: JSON.parse(JSON.stringify(INITIAL_CATEGORIES)),
      items: JSON.parse(JSON.stringify(INITIAL_ITEMS)),
      people: JSON.parse(JSON.stringify(INITIAL_PEOPLE)),
      profiles: JSON.parse(JSON.stringify(INITIAL_PROFILES)),
      settings: JSON.parse(JSON.stringify(INITIAL_SETTINGS)),
      issues: [],
      returns: [],
      stockAdjustments: [],
      auditLogs: [],
      issueCounter: 1,
      returnCounter: 1,
    };
  }
  if (!Array.isArray(global.__INSTITUTIONAL_STORE_DB__.auditLogs)) {
    global.__INSTITUTIONAL_STORE_DB__.auditLogs = [];
  }
  if (!Array.isArray(global.__INSTITUTIONAL_STORE_DB__.stockAdjustments)) {
    global.__INSTITUTIONAL_STORE_DB__.stockAdjustments = [];
  }
  if (!Array.isArray(global.__INSTITUTIONAL_STORE_DB__.issues)) {
    global.__INSTITUTIONAL_STORE_DB__.issues = [];
  }
  if (!Array.isArray(global.__INSTITUTIONAL_STORE_DB__.returns)) {
    global.__INSTITUTIONAL_STORE_DB__.returns = [];
  }
  return global.__INSTITUTIONAL_STORE_DB__!;
}

export function logAuditEntry(
  actionType: AuditActionType,
  details: string,
  performedBy: string = 'Storekeeper',
  entityRef?: string | null
) {
  const store = getLocalStore();
  const entry: AuditLog = {
    id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    action_type: actionType,
    details,
    entity_ref: entityRef || null,
    performed_by: performedBy,
    created_at: new Date().toISOString(),
  };
  store.auditLogs.unshift(entry);
  return entry;
}

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && !url.includes('your-project-id'));
}

/* =========================================================================
   CATEGORIES REPOSITORY
   ========================================================================= */

export async function getCategories(): Promise<Category[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data: categories, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      // Count items per category
      const { data: items } = await supabase
        .from('items')
        .select('category_id');

      const countMap: Record<string, number> = {};
      items?.forEach((i) => {
        countMap[i.category_id] = (countMap[i.category_id] || 0) + 1;
      });

      return (categories || []).map((cat) => ({
        ...cat,
        item_count: countMap[cat.id] || 0,
      }));
    } catch (err) {
      console.warn('Falling back to local store for categories:', err);
    }
  }

  const store = getLocalStore();
  return store.categories.map((c) => ({
    ...c,
    item_count: store.items.filter((i) => i.category_id === c.id).length,
  }));
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const categories = await getCategories();
  return categories.find((c) => c.id === id) || null;
}

export async function createCategory(data: {
  name: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  is_active?: boolean;
}): Promise<Category> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data: created, error } = await supabase
        .from('categories')
        .insert({
          name: data.name,
          description: data.description || null,
          icon: data.icon || 'box',
          color: data.color || '#1E40AF',
          is_active: data.is_active ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return { ...created, item_count: 0 };
    } catch (err) {
      console.warn('Supabase createCategory error, fallback to local:', err);
    }
  }

  const store = getLocalStore();
  const existing = store.categories.find(
    (c) => c.name.toLowerCase() === data.name.trim().toLowerCase()
  );
  if (existing) {
    throw new Error(`A category named "${data.name}" already exists.`);
  }

  const newCat: Category = {
    id: `c-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: data.name.trim(),
    description: data.description || null,
    icon: data.icon || 'box',
    color: data.color || '#1E40AF',
    is_active: data.is_active ?? true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    item_count: 0,
  };

  store.categories.push(newCat);
  return newCat;
}

export async function updateCategory(
  id: string,
  data: Partial<Omit<Category, 'id' | 'created_at' | 'updated_at' | 'item_count'>>
): Promise<Category> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data: updated, error } = await supabase
        .from('categories')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    } catch (err) {
      console.warn('Supabase updateCategory error, fallback to local:', err);
    }
  }

  const store = getLocalStore();
  const index = store.categories.findIndex((c) => c.id === id);
  if (index === -1) throw new Error('Category not found');

  if (data.name) {
    const existing = store.categories.find(
      (c) => c.id !== id && c.name.toLowerCase() === data.name!.trim().toLowerCase()
    );
    if (existing) throw new Error(`Category "${data.name}" already exists.`);
  }

  const updated: Category = {
    ...store.categories[index],
    ...data,
    updated_at: new Date().toISOString(),
  };
  store.categories[index] = updated;
  return updated;
}

export async function toggleCategoryStatus(id: string): Promise<Category> {
  const store = getLocalStore();
  const cat = store.categories.find((c) => c.id === id);
  if (!cat) throw new Error('Category not found');
  return updateCategory(id, { is_active: !cat.is_active });
}

/* =========================================================================
   ITEMS (INVENTORY) REPOSITORY
   ========================================================================= */

export interface ItemFilters {
  search?: string;
  categoryId?: string;
  trackingType?: string;
  condition?: string;
  status?: string;
}

export async function getItems(filters?: ItemFilters): Promise<Item[]> {
  let itemsList: Item[] = [];

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createSupabaseServerClient();
      let query = supabase.from('items').select('*, category:categories(*)');

      if (filters?.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }
      if (filters?.trackingType) {
        query = query.eq('tracking_type', filters.trackingType);
      }
      if (filters?.condition) {
        query = query.eq('condition', filters.condition);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      itemsList = data || [];
    } catch (err) {
      console.warn('Supabase getItems error, fallback to local:', err);
      itemsList = getLocalStore().items;
    }
  } else {
    const store = getLocalStore();
    const categories = store.categories;
    itemsList = store.items.map((item) => ({
      ...item,
      category: categories.find((c) => c.id === item.category_id) || null,
    }));
  }

  // Client-level filtering for search and computed status
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    itemsList = itemsList.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.item_code.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q) ||
        item.category?.name.toLowerCase().includes(q)
    );
  }

  if (filters?.categoryId) {
    itemsList = itemsList.filter((i) => i.category_id === filters.categoryId);
  }

  if (filters?.trackingType) {
    itemsList = itemsList.filter((i) => i.tracking_type === filters.trackingType);
  }

  if (filters?.condition) {
    itemsList = itemsList.filter((i) => i.condition === filters.condition);
  }

  if (filters?.status) {
    itemsList = itemsList.filter(
      (item) => getItemDisplayStatus(item) === (filters.status as ItemDisplayStatus)
    );
  }

  return itemsList;
}

export async function getItemById(id: string): Promise<Item | null> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from('items')
        .select('*, category:categories(*)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('Supabase getItemById error, fallback to local:', err);
    }
  }

  const store = getLocalStore();
  const found = store.items.find((i) => i.id === id);
  if (!found) return null;
  const category = store.categories.find((c) => c.id === found.category_id);
  return { ...found, category: category || null };
}

export async function checkItemCodeExists(itemCode: string, excludeId?: string): Promise<boolean> {
  const store = getLocalStore();
  return store.items.some(
    (i) => i.item_code.toUpperCase() === itemCode.trim().toUpperCase() && i.id !== excludeId
  );
}

export async function createItem(
  data: Omit<Item, 'id' | 'created_at' | 'updated_at' | 'category' | 'available_quantity'> & {
    available_quantity?: number;
  }
): Promise<Item> {
  const formattedCode = data.item_code.trim().toUpperCase();

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data: created, error } = await supabase
        .from('items')
        .insert({
          ...data,
          item_code: formattedCode,
          available_quantity: data.available_quantity ?? data.total_quantity,
        })
        .select('*, category:categories(*)')
        .single();

      if (error) throw error;
      return created;
    } catch (err) {
      console.warn('Supabase createItem error, fallback to local:', err);
    }
  }

  const store = getLocalStore();
  const exists = store.items.some((i) => i.item_code.toUpperCase() === formattedCode);
  if (exists) {
    throw new Error(`An item with item code "${formattedCode}" already exists.`);
  }

  const newItem: Item = {
    id: `i-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    ...data,
    item_code: formattedCode,
    available_quantity: data.available_quantity ?? data.total_quantity,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  store.items.unshift(newItem);
  const cat = store.categories.find((c) => c.id === newItem.category_id);
  return { ...newItem, category: cat || null };
}

export async function updateItem(
  id: string,
  data: Partial<Omit<Item, 'id' | 'created_at' | 'updated_at' | 'category'>>
): Promise<Item> {
  if (data.item_code) {
    data.item_code = data.item_code.trim().toUpperCase();
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data: updated, error } = await supabase
        .from('items')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*, category:categories(*)')
        .single();

      if (error) throw error;
      return updated;
    } catch (err) {
      console.warn('Supabase updateItem error, fallback to local:', err);
    }
  }

  const store = getLocalStore();
  const index = store.items.findIndex((i) => i.id === id);
  if (index === -1) throw new Error('Item not found');

  if (data.item_code) {
    const codeExists = store.items.some(
      (i) => i.id !== id && i.item_code.toUpperCase() === data.item_code!.toUpperCase()
    );
    if (codeExists) {
      throw new Error(`Item code "${data.item_code}" is already in use by another item.`);
    }
  }

  const updatedItem: Item = {
    ...store.items[index],
    ...data,
    updated_at: new Date().toISOString(),
  };

  store.items[index] = updatedItem;
  const cat = store.categories.find((c) => c.id === updatedItem.category_id);
  return { ...updatedItem, category: cat || null };
}

export async function toggleItemStatus(id: string): Promise<Item> {
  const item = await getItemById(id);
  if (!item) throw new Error('Item not found');
  const updated = await updateItem(id, { is_active: !item.is_active });
  logAuditEntry('ITEM_DEACTIVATED', `Changed status of item "${item.name}" to ${updated.is_active ? 'Active' : 'Inactive'}`, 'Storekeeper', item.id);
  return updated;
}

/* =========================================================================
   STOCK ADJUSTMENT REPOSITORY (Phase 5)
   ========================================================================= */

export async function createStockAdjustment(data: {
  item_id: string;
  quantity_change: number;
  reason: StockAdjustmentReason;
  notes?: string | null;
  performed_by?: string;
}): Promise<StockAdjustment> {
  const store = getLocalStore();
  const itemIndex = store.items.findIndex((i) => i.id === data.item_id);
  if (itemIndex === -1) throw new Error('Item not found for stock adjustment.');

  const item = store.items[itemIndex];
  const oldTotal = item.total_quantity;
  const oldAvailable = item.available_quantity;
  const currentlyIssued = oldTotal - oldAvailable;

  const newTotal = oldTotal + data.quantity_change;
  const newAvailable = oldAvailable + data.quantity_change;

  if (newTotal < 0) {
    throw new Error(`Cannot adjust quantity below zero. Current total: ${oldTotal}`);
  }

  if (newAvailable < 0) {
    throw new Error(
      `You cannot remove ${Math.abs(data.quantity_change)} unit${Math.abs(data.quantity_change) > 1 ? 's' : ''} because only ${oldAvailable} unit${oldAvailable === 1 ? '' : 's'} are currently available in store (${currentlyIssued} unit${currentlyIssued === 1 ? '' : 's'} currently issued).`
    );
  }

  // Perform update
  store.items[itemIndex].total_quantity = newTotal;
  store.items[itemIndex].available_quantity = newAvailable;
  store.items[itemIndex].updated_at = new Date().toISOString();

  const adjustment: StockAdjustment = {
    id: `sa-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    item_id: item.id,
    quantity_before: oldTotal,
    quantity_change: data.quantity_change,
    quantity_after: newTotal,
    reason: data.reason,
    notes: data.notes || null,
    performed_by: data.performed_by || 'Storekeeper',
    created_at: new Date().toISOString(),
    item: { ...store.items[itemIndex] },
  };

  store.stockAdjustments.unshift(adjustment);

  const changeStr = data.quantity_change > 0 ? `+${data.quantity_change}` : `${data.quantity_change}`;
  logAuditEntry(
    'STOCK_ADJUSTED',
    `${item.name} (${item.item_code}) quantity adjusted by ${changeStr} (${oldTotal} → ${newTotal}). Reason: ${data.reason}`,
    data.performed_by || 'Storekeeper',
    item.id
  );

  return adjustment;
}

export async function getStockAdjustments(itemId?: string): Promise<StockAdjustment[]> {
  const store = getLocalStore();
  let list = store.stockAdjustments.map((sa) => {
    const item = store.items.find((i) => i.id === sa.item_id);
    return { ...sa, item: item || null };
  });

  if (itemId) {
    list = list.filter((sa) => sa.item_id === itemId);
  }

  return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

/* =========================================================================
   AUDIT LOG REPOSITORY (Phase 5)
   ========================================================================= */

export async function getAuditLogs(filters?: {
  search?: string;
  actionType?: string;
  performedBy?: string;
}): Promise<AuditLog[]> {
  const store = getLocalStore();
  let list = [...store.auditLogs];

  if (filters?.actionType) {
    list = list.filter((log) => log.action_type === filters.actionType);
  }

  if (filters?.performedBy) {
    list = list.filter((log) => log.performed_by.toLowerCase().includes(filters.performedBy!.toLowerCase()));
  }

  if (filters?.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(
      (log) =>
        log.details.toLowerCase().includes(q) ||
        log.performed_by.toLowerCase().includes(q) ||
        log.action_type.toLowerCase().includes(q)
    );
  }

  return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

/* =========================================================================
   PEOPLE REPOSITORY
   ========================================================================= */

export interface PeopleFilters {
  search?: string;
  role?: string;
  status?: 'active' | 'inactive';
}

export async function getPeople(filters?: PeopleFilters): Promise<Person[]> {
  let peopleList: Person[] = [];

  if (isSupabaseConfigured()) {
    try {
      const supabase = await createSupabaseServerClient();
      let query = supabase.from('people').select('*');

      if (filters?.role) {
        query = query.eq('role', filters.role);
      }
      if (filters?.status === 'active') {
        query = query.eq('is_active', true);
      } else if (filters?.status === 'inactive') {
        query = query.eq('is_active', false);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      peopleList = data || [];
    } catch (err) {
      console.warn('Supabase getPeople error, fallback to local:', err);
      peopleList = getLocalStore().people;
    }
  } else {
    peopleList = getLocalStore().people;
  }

  if (filters?.search) {
    const q = filters.search.toLowerCase();
    peopleList = peopleList.filter(
      (p) =>
        p.full_name.toLowerCase().includes(q) ||
        (p.admission_number && p.admission_number.toLowerCase().includes(q)) ||
        (p.email && p.email.toLowerCase().includes(q)) ||
        (p.phone && p.phone.toLowerCase().includes(q)) ||
        (p.department && p.department.toLowerCase().includes(q))
    );
  }

  if (filters?.role) {
    peopleList = peopleList.filter((p) => p.role === filters.role);
  }

  if (filters?.status === 'active') {
    peopleList = peopleList.filter((p) => p.is_active);
  } else if (filters?.status === 'inactive') {
    peopleList = peopleList.filter((p) => !p.is_active);
  }

  return peopleList;
}

export async function getPersonById(id: string): Promise<Person | null> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase.from('people').select('*').eq('id', id).single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('Supabase getPersonById error, fallback to local:', err);
    }
  }

  const store = getLocalStore();
  return store.people.find((p) => p.id === id) || null;
}

export async function createPerson(
  data: Omit<Person, 'id' | 'created_at' | 'updated_at'>
): Promise<Person> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data: created, error } = await supabase
        .from('people')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return created;
    } catch (err) {
      console.warn('Supabase createPerson error, fallback to local:', err);
    }
  }

  const store = getLocalStore();
  if (data.admission_number) {
    const exists = store.people.some(
      (p) => p.admission_number?.toLowerCase() === data.admission_number!.toLowerCase()
    );
    if (exists) {
      throw new Error(`Admission number "${data.admission_number}" is already registered.`);
    }
  }

  const newPerson: Person = {
    id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    ...data,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  store.people.unshift(newPerson);
  return newPerson;
}

export interface BatchImportPeopleOptions {
  skipDuplicates?: boolean;
}

export interface BatchImportPeopleResult {
  addedCount: number;
  skippedCount: number;
  errors: Array<{ row: number; name: string; error: string }>;
}

export async function batchImportPeople(
  records: Array<Omit<Person, 'id' | 'created_at' | 'updated_at'>>,
  options: BatchImportPeopleOptions = { skipDuplicates: true }
): Promise<BatchImportPeopleResult> {
  const store = getLocalStore();
  let addedCount = 0;
  let skippedCount = 0;
  const errors: Array<{ row: number; name: string; error: string }> = [];

  const existingAdmNumbers = new Set(
    store.people
      .filter((p) => Boolean(p.admission_number))
      .map((p) => p.admission_number!.trim().toLowerCase())
  );

  const existingNames = new Set(
    store.people.map((p) => p.full_name.trim().toLowerCase())
  );

  const batchToInsert: Person[] = [];

  records.forEach((rec, idx) => {
    const rowNum = idx + 1;
    const cleanName = rec.full_name?.trim() || '';
    const cleanAdm = rec.admission_number?.trim() || '';

    if (!cleanName) {
      errors.push({ row: rowNum, name: 'Unknown', error: 'Missing full name' });
      return;
    }

    const isDuplicateAdm = cleanAdm && existingAdmNumbers.has(cleanAdm.toLowerCase());
    const isDuplicateName = !cleanAdm && existingNames.has(cleanName.toLowerCase());

    if (isDuplicateAdm || isDuplicateName) {
      if (options.skipDuplicates) {
        skippedCount++;
        return;
      }
    }

    const newId = `p-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const personItem: Person = {
      id: newId,
      full_name: cleanName,
      admission_number: cleanAdm || null,
      role: rec.role || 'STUDENT',
      department: rec.department?.trim() || null,
      class_name: rec.class_name?.trim() || null,
      phone: rec.phone?.trim() || null,
      email: rec.email?.trim() || null,
      photo_url: rec.photo_url || null,
      is_active: rec.is_active ?? true,
      created_at: now,
      updated_at: now,
    };

    batchToInsert.push(personItem);
    if (cleanAdm) existingAdmNumbers.add(cleanAdm.toLowerCase());
    existingNames.add(cleanName.toLowerCase());
    addedCount++;
  });

  // Batch insert into in-memory store
  store.people = [...batchToInsert, ...store.people];

  return { addedCount, skippedCount, errors };
}

export async function togglePersonStatus(id: string): Promise<Person> {
  const store = getLocalStore();
  const person = store.people.find((p) => p.id === id);
  if (!person) throw new Error('Person not found');

  person.is_active = !person.is_active;
  person.updated_at = new Date().toISOString();
  return person;
}

/* =========================================================================
   SETTINGS REPOSITORY
   ========================================================================= */

export async function getInstitutionSettings(): Promise<InstitutionSettings> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data, error } = await supabase
        .from('institution_settings')
        .select('*')
        .limit(1)
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      console.warn('Supabase getInstitutionSettings error, fallback to local:', err);
    }
  }

  return getLocalStore().settings;
}

export async function updateInstitutionSettings(
  data: Partial<Omit<InstitutionSettings, 'id' | 'updated_at'>>
): Promise<InstitutionSettings> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data: updated, error } = await supabase
        .from('institution_settings')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', INITIAL_SETTINGS.id)
        .select()
        .single();
      if (error) throw error;
      return updated;
    } catch (err) {
      console.warn('Supabase updateInstitutionSettings error, fallback to local:', err);
    }
  }

  const store = getLocalStore();
  store.settings = {
    ...store.settings,
    ...data,
    updated_at: new Date().toISOString(),
  };
  return store.settings;
}

/* =========================================================================
   ISSUES REPOSITORY (Phase 2)
   ========================================================================= */

export interface IssueFilters {
  search?: string;
  status?: IssueStatus;
  personId?: string;
}

function hydrateIssue(issue: Issue, store: ReturnType<typeof getLocalStore>): Issue {
  const person = store.people.find((p) => p.id === issue.person_id) || null;
  const hydratedItems = issue.items.map((ii) => {
    const item = store.items.find((i) => i.id === ii.item_id);
    const cat = item ? store.categories.find((c) => c.id === item.category_id) : null;
    return {
      ...ii,
      item: item ? { ...item, category: cat || null } : null,
    };
  });
  return { ...issue, person, items: hydratedItems };
}

export async function getIssues(filters?: IssueFilters): Promise<Issue[]> {
  // Local mode only for now; Supabase path to be added with migration
  const store = getLocalStore();
  let list = store.issues.map((issue) => hydrateIssue(issue, store));

  if (filters?.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(
      (issue) =>
        issue.issue_number.toLowerCase().includes(q) ||
        issue.person?.full_name.toLowerCase().includes(q) ||
        (issue.person?.admission_number && issue.person.admission_number.toLowerCase().includes(q))
    );
  }

  if (filters?.status) {
    list = list.filter((i) => i.status === filters.status);
  }

  if (filters?.personId) {
    list = list.filter((i) => i.person_id === filters.personId);
  }

  return list.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function getIssueById(id: string): Promise<Issue | null> {
  const store = getLocalStore();
  const issue = store.issues.find((i) => i.id === id);
  if (!issue) return null;
  return hydrateIssue(issue, store);
}

export interface CreateIssueData {
  person_id: string;
  issued_by: string;
  purpose?: string | null;
  expected_return_date?: string | null;
  notes?: string | null;
  items: Array<{
    item_id: string;
    quantity_issued: number;
  }>;
}

export async function createIssue(data: CreateIssueData): Promise<Issue> {
  const store = getLocalStore();

  // Validate availability for all items first
  for (const lineItem of data.items) {
    const item = store.items.find((i) => i.id === lineItem.item_id);
    if (!item) throw new Error(`Item not found: ${lineItem.item_id}`);
    if (!item.is_active) throw new Error(`Item "${item.name}" is not active.`);
    if (item.condition === 'MAINTENANCE')
      throw new Error(`Item "${item.name}" is under maintenance.`);
    if (item.available_quantity < lineItem.quantity_issued) {
      throw new Error(
        `Insufficient stock for "${item.name}". Available: ${item.available_quantity}, Requested: ${lineItem.quantity_issued}`
      );
    }
    if (lineItem.quantity_issued <= 0) {
      throw new Error(`Quantity must be at least 1 for "${item.name}".`);
    }
  }

  // Decrement available quantities
  for (const lineItem of data.items) {
    const itemIndex = store.items.findIndex((i) => i.id === lineItem.item_id);
    store.items[itemIndex].available_quantity -= lineItem.quantity_issued;
    store.items[itemIndex].updated_at = new Date().toISOString();
  }

  const issueNumber = `ISS-${new Date().getFullYear()}-${String(store.issueCounter).padStart(4, '0')}`;
  store.issueCounter++;

  const issueId = `iss-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const issueItems: IssueItem[] = data.items.map((li) => ({
    id: `ii-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    issue_id: issueId,
    item_id: li.item_id,
    quantity_issued: li.quantity_issued,
    quantity_returned: 0,
    created_at: now,
  }));

  const newIssue: Issue = {
    id: issueId,
    issue_number: issueNumber,
    person_id: data.person_id,
    issued_by: data.issued_by,
    purpose: data.purpose || null,
    expected_return_date: data.expected_return_date || null,
    status: 'ACTIVE',
    notes: data.notes || null,
    items: issueItems,
    created_at: now,
    updated_at: now,
  };

  store.issues.unshift(newIssue);

  const borrower = store.people.find((p) => p.id === data.person_id);
  const itemNames = data.items
    .map((li) => {
      const it = store.items.find((i) => i.id === li.item_id);
      return it ? `${li.quantity_issued}x ${it.name}` : `${li.quantity_issued}x item`;
    })
    .join(', ');

  logAuditEntry(
    'ITEM_ISSUED',
    `Issued ${itemNames} to ${borrower?.full_name || 'Borrower'} (Issue #${issueNumber})`,
    'Storekeeper',
    newIssue.id
  );

  return hydrateIssue(newIssue, store);
}

/* =========================================================================
   RETURNS REPOSITORY (Phase 2)
   ========================================================================= */

export interface ReturnFilters {
  search?: string;
  personId?: string;
}

function hydrateReturn(ret: Return, store: ReturnType<typeof getLocalStore>): Return {
  const person = store.people.find((p) => p.id === ret.person_id) || null;
  const issue = store.issues.find((i) => i.id === ret.issue_id) || null;

  const hydratedItems = ret.items.map((ri) => {
    const item = store.items.find((i) => i.id === ri.item_id);
    const cat = item ? store.categories.find((c) => c.id === item.category_id) : null;
    return {
      ...ri,
      item: item ? { ...item, category: cat || null } : null,
    };
  });

  return {
    ...ret,
    person,
    issue: issue ? hydrateIssue(issue, store) : null,
    items: hydratedItems,
  };
}

export async function getReturns(filters?: ReturnFilters): Promise<Return[]> {
  const store = getLocalStore();
  let list = store.returns.map((r) => hydrateReturn(r, store));

  if (filters?.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(
      (r) =>
        r.return_number.toLowerCase().includes(q) ||
        r.person?.full_name.toLowerCase().includes(q) ||
        r.issue?.issue_number.toLowerCase().includes(q)
    );
  }

  if (filters?.personId) {
    list = list.filter((r) => r.person_id === filters.personId);
  }

  return list.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function getReturnById(id: string): Promise<Return | null> {
  const store = getLocalStore();
  const ret = store.returns.find((r) => r.id === id);
  if (!ret) return null;
  return hydrateReturn(ret, store);
}

export interface CreateReturnData {
  issue_id: string;
  received_by: string;
  notes?: string | null;
  items: Array<{
    issue_item_id: string;
    item_id: string;
    quantity_returned: number;
    condition: ReturnCondition;
    notes?: string | null;
  }>;
}

export async function createReturn(data: CreateReturnData): Promise<Return> {
  const store = getLocalStore();

  const issue = store.issues.find((i) => i.id === data.issue_id);
  if (!issue) throw new Error('Issue record not found.');
  if (issue.status === 'RETURNED') throw new Error('This issue has already been fully returned.');

  // Validate quantities
  for (const lineItem of data.items) {
    const issueItem = issue.items.find((ii) => ii.id === lineItem.issue_item_id);
    if (!issueItem) throw new Error(`Issue line item not found: ${lineItem.issue_item_id}`);

    const alreadyReturned = issueItem.quantity_returned;
    const maxCanReturn = issueItem.quantity_issued - alreadyReturned;

    if (lineItem.quantity_returned <= 0) {
      throw new Error('Return quantity must be at least 1.');
    }
    if (lineItem.quantity_returned > maxCanReturn) {
      const item = store.items.find((i) => i.id === lineItem.item_id);
      throw new Error(
        `Cannot return ${lineItem.quantity_returned} of "${item?.name}". Maximum returnable: ${maxCanReturn}`
      );
    }
  }

  // Update available quantities and issue item returned counts
  for (const lineItem of data.items) {
    const itemIndex = store.items.findIndex((i) => i.id === lineItem.item_id);
    if (itemIndex !== -1) {
      store.items[itemIndex].available_quantity += lineItem.quantity_returned;
      store.items[itemIndex].updated_at = new Date().toISOString();
    }

    const issueItemIndex = issue.items.findIndex((ii) => ii.id === lineItem.issue_item_id);
    if (issueItemIndex !== -1) {
      issue.items[issueItemIndex].quantity_returned += lineItem.quantity_returned;
    }
  }

  // Recompute issue status
  const totalIssued = issue.items.reduce((sum, ii) => sum + ii.quantity_issued, 0);
  const totalReturned = issue.items.reduce((sum, ii) => sum + ii.quantity_returned, 0);

  if (totalReturned === 0) {
    issue.status = 'ACTIVE';
  } else if (totalReturned < totalIssued) {
    issue.status = 'PARTIALLY_RETURNED';
  } else {
    issue.status = 'RETURNED';
  }
  issue.updated_at = new Date().toISOString();

  const returnNumber = `RET-${new Date().getFullYear()}-${String(store.returnCounter).padStart(4, '0')}`;
  store.returnCounter++;

  const returnId = `ret-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const returnItems: ReturnItem[] = data.items.map((li) => ({
    id: `ri-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    return_id: returnId,
    issue_item_id: li.issue_item_id,
    item_id: li.item_id,
    quantity_returned: li.quantity_returned,
    condition: li.condition,
    notes: li.notes || null,
    created_at: now,
  }));

  const newReturn: Return = {
    id: returnId,
    return_number: returnNumber,
    issue_id: data.issue_id,
    person_id: issue.person_id,
    received_by: data.received_by,
    notes: data.notes || null,
    items: returnItems,
    created_at: now,
    updated_at: now,
  };

  store.returns.unshift(newReturn);

  const returnBorrower = store.people.find((p) => p.id === issue.person_id);
  const returnedItemNames = data.items
    .map((li) => {
      const it = store.items.find((i) => i.id === li.item_id);
      return it ? `${li.quantity_returned}x ${it.name}` : `${li.quantity_returned}x item`;
    })
    .join(', ');

  logAuditEntry(
    'ITEM_RETURNED',
    `Returned ${returnedItemNames} from ${returnBorrower?.full_name || 'Borrower'} (Return #${returnNumber})`,
    'Storekeeper',
    newReturn.id
  );

  return hydrateReturn(newReturn, store);
}

/* =========================================================================
   DASHBOARD STATS
   ========================================================================= */

export async function getDashboardStats() {
  const items = await getItems();
  const categories = await getCategories();
  const store = getLocalStore();

  const totalItems = items.length;
  const totalQuantity = items.reduce((sum, item) => sum + item.total_quantity, 0);

  let lowStockCount = 0;
  let outOfStockCount = 0;
  let maintenanceCount = 0;

  items.forEach((item) => {
    const status = getItemDisplayStatus(item);
    if (status === 'Low Stock') lowStockCount++;
    if (status === 'Out of Stock') outOfStockCount++;
    if (status === 'Maintenance') maintenanceCount++;
  });

  const allIssues = (store.issues || []).map((i) => hydrateIssue(i, store));
  const allReturns = (store.returns || []).map((r) => hydrateReturn(r, store));

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Active issues
  const activeIssues = allIssues.filter(
    (i) => i.status === 'ACTIVE' || i.status === 'PARTIALLY_RETURNED'
  );
  const activeIssueCount = activeIssues.length;

  // Overdue issues (expected_return_date < today and not fully returned)
  const overdueIssues = activeIssues.filter((i) => {
    if (!i.expected_return_date) return false;
    const exp = new Date(i.expected_return_date);
    // Overdue if expected date is strictly earlier than today's date
    const expStr = exp.toISOString().split('T')[0];
    return expStr < todayStr;
  });

  // Due today issues
  const dueTodayIssues = activeIssues.filter((i) => {
    if (!i.expected_return_date) return false;
    const expStr = new Date(i.expected_return_date).toISOString().split('T')[0];
    return expStr === todayStr;
  });

  // Low stock items list
  const lowStockItems = items.filter((item) => {
    const status = getItemDisplayStatus(item);
    return status === 'Low Stock' || status === 'Out of Stock';
  });

  // Recent activity stream (issues, returns, new items merged & sorted)
  const activities: Array<{
    id: string;
    type: 'ISSUE' | 'RETURN' | 'ITEM';
    timestamp: string;
    title: string;
    subtitle: string;
    link: string;
  }> = [];

  allIssues.forEach((issue) => {
    const totalQty = issue.items.reduce((acc, ii) => acc + ii.quantity_issued, 0);
    const itemNames = issue.items.map((ii) => ii.item?.name || 'Item').join(', ');
    activities.push({
      id: `act-issue-${issue.id}`,
      type: 'ISSUE',
      timestamp: issue.created_at,
      title: `${totalQty} unit${totalQty > 1 ? 's' : ''} (${itemNames}) issued to ${issue.person?.full_name || 'Borrower'}`,
      subtitle: issue.issue_number,
      link: `/issues/${issue.id}`,
    });
  });

  allReturns.forEach((ret) => {
    const totalQty = ret.items.reduce((acc, ri) => acc + ri.quantity_returned, 0);
    activities.push({
      id: `act-ret-${ret.id}`,
      type: 'RETURN',
      timestamp: ret.created_at,
      title: `Returned ${totalQty} unit${totalQty > 1 ? 's' : ''} by ${ret.person?.full_name || 'Borrower'}`,
      subtitle: ret.return_number,
      link: `/returns/${ret.id}`,
    });
  });

  items.forEach((item) => {
    activities.push({
      id: `act-item-${item.id}`,
      type: 'ITEM',
      timestamp: item.created_at,
      title: `Added "${item.name}" to inventory`,
      subtitle: `${item.item_code} · ${item.total_quantity} total units`,
      link: `/inventory/${item.id}`,
    });
  });

  activities.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const categoryStats = categories.map((cat) => {
    const catItems = items.filter((i) => i.category_id === cat.id);
    const catQty = catItems.reduce((acc, i) => acc + i.total_quantity, 0);
    return {
      id: cat.id,
      name: cat.name,
      itemCount: catItems.length,
      totalQuantity: catQty,
    };
  });

  return {
    totalItems,
    totalQuantity,
    lowStockCount,
    outOfStockCount,
    maintenanceCount,
    activeIssueCount,
    overdueCount: overdueIssues.length,
    overdueIssues,
    dueTodayIssues,
    lowStockItems,
    activities: activities.slice(0, 10),
    categoryStats,
  };
}

export async function getItemHistory(itemId: string) {
  const store = getLocalStore();
  const allIssues = (store.issues || []).map((i) => hydrateIssue(i, store));
  const allReturns = (store.returns || []).map((r) => hydrateReturn(r, store));

  // Active issues for this item
  const activeLoans = allIssues
    .filter(
      (issue) =>
        (issue.status === 'ACTIVE' || issue.status === 'PARTIALLY_RETURNED') &&
        issue.items.some((ii) => ii.item_id === itemId && ii.quantity_issued > ii.quantity_returned)
    )
    .map((issue) => {
      const lineItem = issue.items.find((ii) => ii.item_id === itemId);
      const outstanding = (lineItem?.quantity_issued || 0) - (lineItem?.quantity_returned || 0);
      return {
        issueId: issue.id,
        issueNumber: issue.issue_number,
        borrowerName: issue.person?.full_name || 'Borrower',
        borrowerType: issue.person?.role || 'STUDENT',
        quantity: outstanding,
        expectedReturnDate: issue.expected_return_date,
        createdAt: issue.created_at,
      };
    });

  // Timeline events for this item
  const timeline: Array<{
    id: string;
    type: 'ISSUE' | 'RETURN' | 'ADJUSTMENT';
    date: string;
    personName: string;
    quantity: number;
    notes?: string | null;
    reason?: string | null;
  }> = [];

  allIssues.forEach((issue) => {
    const lineItem = issue.items.find((ii) => ii.item_id === itemId);
    if (lineItem) {
      timeline.push({
        id: `timeline-iss-${issue.id}`,
        type: 'ISSUE',
        date: issue.created_at,
        personName: issue.person?.full_name || 'Borrower',
        quantity: lineItem.quantity_issued,
        notes: issue.purpose || issue.notes,
      });
    }
  });

  allReturns.forEach((ret) => {
    const lineItem = ret.items.find((ri) => ri.item_id === itemId);
    if (lineItem) {
      timeline.push({
        id: `timeline-ret-${ret.id}`,
        type: 'RETURN',
        date: ret.created_at,
        personName: ret.person?.full_name || 'Borrower',
        quantity: lineItem.quantity_returned,
        notes: lineItem.notes || ret.notes,
      });
    }
  });

  const stockAdjustments = (store.stockAdjustments || []).filter((sa) => sa.item_id === itemId);
  stockAdjustments.forEach((sa) => {
    timeline.push({
      id: `timeline-sa-${sa.id}`,
      type: 'ADJUSTMENT',
      date: sa.created_at,
      personName: sa.performed_by,
      quantity: sa.quantity_change,
      notes: sa.notes,
      reason: sa.reason,
    });
  });

  timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return { activeLoans, timeline, stockAdjustments };
}

export async function getReportsData(range: 'today' | 'week' | 'month' | 'all' = 'month') {
  const items = await getItems();
  const categories = await getCategories();
  const store = getLocalStore();

  const allIssues = (store.issues || []).map((i) => hydrateIssue(i, store));
  const allReturns = (store.returns || []).map((r) => hydrateReturn(r, store));

  // Compute date boundary
  const now = new Date();
  let startDate: Date | null = null;

  if (range === 'today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (range === 'week') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (range === 'month') {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  // Filter issues & returns by date range
  const filteredIssues = startDate
    ? allIssues.filter((i) => new Date(i.created_at) >= startDate!)
    : allIssues;

  const filteredReturns = startDate
    ? allReturns.filter((r) => new Date(r.created_at) >= startDate!)
    : allReturns;

  // Inventory Summary
  const totalItemTypes = items.length;
  const totalQuantity = items.reduce((sum, i) => sum + i.total_quantity, 0);
  const availableQuantity = items.reduce((sum, i) => sum + i.available_quantity, 0);
  const currentlyOutQuantity = totalQuantity - availableQuantity;
  const totalValuation = items.reduce((sum, i) => sum + ((i.unit_price || 0) * i.total_quantity), 0);

  let lowStockCount = 0;
  let outOfStockCount = 0;
  items.forEach((item) => {
    const status = getItemDisplayStatus(item);
    if (status === 'Low Stock') lowStockCount++;
    if (status === 'Out of Stock') outOfStockCount++;
  });

  // Borrowing Summary
  const itemsIssuedCount = filteredIssues.reduce(
    (sum, issue) => sum + issue.items.reduce((s, ii) => s + ii.quantity_issued, 0),
    0
  );

  const itemsReturnedCount = filteredReturns.reduce(
    (sum, ret) => sum + ret.items.reduce((s, ri) => s + ri.quantity_returned, 0),
    0
  );

  const activeIssuesList = allIssues.filter(
    (i) => i.status === 'ACTIVE' || i.status === 'PARTIALLY_RETURNED'
  );

  const todayStr = now.toISOString().split('T')[0];
  const overdueCount = activeIssuesList.filter((i) => {
    if (!i.expected_return_date) return false;
    return new Date(i.expected_return_date).toISOString().split('T')[0] < todayStr;
  }).length;

  // Most Borrowed Items calculation (rank by total units issued in period)
  const itemBorrowCounts: Record<string, { item: Item; totalIssued: number; issueTimes: number }> = {};

  filteredIssues.forEach((issue) => {
    issue.items.forEach((line) => {
      if (line.item) {
        if (!itemBorrowCounts[line.item.id]) {
          itemBorrowCounts[line.item.id] = {
            item: line.item,
            totalIssued: 0,
            issueTimes: 0,
          };
        }
        itemBorrowCounts[line.item.id].totalIssued += line.quantity_issued;
        itemBorrowCounts[line.item.id].issueTimes += 1;
      }
    });
  });

  const mostBorrowed = Object.values(itemBorrowCounts)
    .sort((a, b) => b.totalIssued - a.totalIssued)
    .slice(0, 10);

  // Most Frequent Borrowers
  const borrowerCounts: Record<
    string,
    { personName: string; role: string; totalIssues: number; currentlyOut: number }
  > = {};

  filteredIssues.forEach((issue) => {
    if (issue.person) {
      const pid = issue.person.id;
      if (!borrowerCounts[pid]) {
        borrowerCounts[pid] = {
          personName: issue.person.full_name,
          role: issue.person.role,
          totalIssues: 0,
          currentlyOut: 0,
        };
      }
      borrowerCounts[pid].totalIssues += 1;
      if (issue.status === 'ACTIVE' || issue.status === 'PARTIALLY_RETURNED') {
        borrowerCounts[pid].currentlyOut += 1;
      }
    }
  });

  const frequentBorrowers = Object.values(borrowerCounts)
    .sort((a, b) => b.totalIssues - a.totalIssues)
    .slice(0, 10);

  // Damaged & Maintenance Items Summary
  let damagedCount = 0;
  let needsRepairCount = 0;
  items.forEach((item) => {
    if (item.condition === 'DAMAGED') damagedCount++;
    if (item.condition === 'MAINTENANCE') needsRepairCount++;
  });

  // Category Activity
  const categoryActivity = categories.map((cat) => {
    const catItems = items.filter((i) => i.category_id === cat.id);
    const catItemIds = new Set(catItems.map((i) => i.id));
    const issueCount = filteredIssues.filter((iss) =>
      iss.items.some((ii) => catItemIds.has(ii.item_id))
    ).length;

    return {
      name: cat.name,
      issueCount,
      totalQuantity: catItems.reduce((acc, i) => acc + i.total_quantity, 0),
    };
  });

  return {
    inventorySummary: {
      totalItemTypes,
      totalQuantity,
      availableQuantity,
      currentlyOutQuantity,
      lowStockCount,
      outOfStockCount,
      totalValuation,
    },
    borrowingSummary: {
      totalIssuesCount: filteredIssues.length,
      totalReturnsCount: filteredReturns.length,
      itemsIssuedCount,
      itemsReturnedCount,
      currentlyOutCount: activeIssuesList.length,
      overdueCount,
    },
    mostBorrowed,
    frequentBorrowers,
    conditionSummary: {
      damagedCount,
      needsRepairCount,
    },
    categoryActivity,
  };
}
