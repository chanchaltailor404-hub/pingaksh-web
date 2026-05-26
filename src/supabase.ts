import { createClient } from "@supabase/supabase-js";

// Fetch from Vite client-side environment variables defined in .env
const env = (import.meta as any).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

// Verify if credentials have been configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Display a high luxury notification logs when database connections are uncalibrated
if (!isSupabaseConfigured) {
  console.warn(
    "Supabase configuration coordinates are missing in environment variables. Define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY inside .env.example or settings."
  );
}

// Interfaces aligned with our PostgreSQL database schema
export interface SupabaseProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  category: "Classic" | "Sport" | "Minimalist" | "Luxury";
  description: string;
  created_at?: string;
}

export interface SupabaseProfile {
  id: string;
  name: string;
  email: string;
  role: "customer" | "admin";
  created_at?: string;
}

export interface SupabaseCartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at?: string;
}

export interface SupabaseOrder {
  id: string;
  user_id: string | null;
  customer_email: string;
  customer_phone: string | null;
  total: number;
  status: "calibrating" | "transit" | "customs" | "fulfilled" | "cancelled";
  created_at?: string;
  order_items?: {
    id: string;
    product_name: string;
    price: number;
    quantity: number;
  }[];
}

/* ==========================================
   SUPABASE TRANSACTION CLIENT APIs
   ========================================== */

// 1. Products Operations
export const getSupabaseProducts = async (): Promise<SupabaseProduct[]> => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("name", { ascending: true });
  
  if (error) {
    console.error("Failed to load products from Supabase", error);
    throw error;
  }
  return data || [];
};

// 2. Profile / User Operations
export const getSupabaseProfile = async (uid: string): Promise<SupabaseProfile | null> => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", uid)
    .single();

  if (error) {
    console.error("Error returning profile from Supabase profiles", error);
    return null;
  }
  return data;
};

// 3. Persistent Cart Items Database Sync
export const getSupabaseCart = async (userId: string): Promise<{ product_id: string; quantity: number }[]> => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("cart_items")
    .select("product_id, quantity")
    .eq("user_id", userId);

  if (error) {
    console.error("Failed fetching database cart items from Supabase", error);
    return [];
  }
  return data || [];
};

export const syncSupabaseCart = async (userId: string, items: { product_id: string; quantity: number }[]) => {
  if (!supabase) return;
  
  // Clear other cart entries to override
  const { error: deleteError } = await supabase
    .from("cart_items")
    .delete()
    .eq("user_id", userId);

  if (deleteError) {
    console.error("Cart consolidation clear error:", deleteError);
    return;
  }

  if (items.length === 0) return;

  // Bulk upsert new configurations
  const { error: upsertError } = await supabase
    .from("cart_items")
    .insert(
      items.map(item => ({
        user_id: userId,
        product_id: item.product_id,
        quantity: item.quantity
      }))
    );

  if (upsertError) {
    console.error("Cart sync integration failure:", upsertError);
  }
};

// 4. Create and Fetch High Standard Orders
export const createSupabaseOrder = async (
  userId: string | null,
  email: string,
  phone: string,
  total: number,
  items: { name: string; price: number; quantity: number }[]
): Promise<string | null> => {
  if (!supabase) return null;

  // Insert to standard public.orders
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: userId,
      customer_email: email,
      customer_phone: phone,
      total,
      status: "calibrating"
    })
    .select()
    .single();

  if (orderError) {
    console.error("Supabase order transaction write failed", orderError);
    throw orderError;
  }

  const orderId = order.id;

  // Insert order items
  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(
      items.map(item => ({
        order_id: orderId,
        product_name: item.name,
        price: item.price,
        quantity: item.quantity
      }))
    );

  if (itemsError) {
    console.error("Supabase order items transaction write failed", itemsError);
    throw itemsError;
  }

  return orderId;
};

export const getSupabaseOrders = async (userId: string): Promise<SupabaseOrder[]> => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error retrieving user database orders from Supabase", error);
    return [];
  }
  return data || [];
};

// 5. Admin Dashboard retrieve all database dispatches
export const getSupabaseAllOrders = async (): Promise<SupabaseOrder[]> => {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error retrieving all database orders from Supabase (Admin)", error);
    return [];
  }
  return data || [];
};

// 6. Update Order Status
export const updateSupabaseOrderStatus = async (
  orderId: string,
  status: SupabaseOrder["status"]
) => {
  if (!supabase) return;
  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId);

  if (error) {
    console.error("Admin order calibration update failed", error);
    throw error;
  }
};
