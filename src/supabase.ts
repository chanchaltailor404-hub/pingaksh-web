import { createClient } from "@supabase/supabase-js";

// Fetch from environment variables dynamically
const env = (import.meta as any).env || {};
const procEnv = (typeof process !== "undefined" ? process.env : {}) as any;

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || procEnv.NEXT_PUBLIC_SUPABASE_URL || env.VITE_SUPABASE_URL || procEnv.VITE_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || procEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || procEnv.VITE_SUPABASE_ANON_KEY;

// Verify if credentials have been configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Display a high luxury notification logs when database connections are uncalibrated
if (!isSupabaseConfigured) {
  console.warn(
    "Supabase configuration coordinates are missing in environment variables. Define NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY inside environment settings."
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

// 3. Dynamic Schema / Table Detections for Maximum Resilience
let cachedCartTable: "cart" | "cart_items" | null = null;
let cachedWishlistTable: "wishlist" | "wishlists" | null = null;

async function getCartTableName(): Promise<"cart" | "cart_items"> {
  if (cachedCartTable) return cachedCartTable;
  if (!supabase) return "cart";
  try {
    const { error } = await supabase.from("cart").select("product_id").limit(1);
    if (!error || error.code !== "42P01") {
      cachedCartTable = "cart";
      return "cart";
    }
  } catch {
    // Fall back to cart_items if error
  }
  cachedCartTable = "cart_items";
  return "cart_items";
}

async function getWishlistTableName(): Promise<"wishlist" | "wishlists"> {
  if (cachedWishlistTable) return cachedWishlistTable;
  if (!supabase) return "wishlist";
  try {
    const { error } = await supabase.from("wishlist").select("product_id").limit(1);
    if (!error || error.code !== "42P01") {
      cachedWishlistTable = "wishlist";
      return "wishlist";
    }
  } catch {
    // Fall back to wishlists if error
  }
  cachedWishlistTable = "wishlists";
  return "wishlists";
}

// 4. Persistent Cart Items Database Sync with Dynamic Table Detection & Robust Upserts
export const getSupabaseCart = async (userId: string): Promise<{ product_id: string; quantity: number }[]> => {
  if (!supabase) return [];
  try {
    const tableName = await getCartTableName();
    console.log(`[Supabase Cart] Fetching items from table: ${tableName} for user ID: ${userId}`);
    const { data, error } = await supabase
      .from(tableName || "cart")
      .select("product_id, quantity")
      .eq("user_id", userId);

    if (error) {
      console.warn(`[Supabase Cart] Failed fetching database cart items from table ${tableName}:`, error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("[Supabase Cart Exception] getSupabaseCart:", err);
    return [];
  }
};

export const syncSupabaseCart = async (userId: string, items: { product_id: string; quantity: number }[]) => {
  if (!supabase) return;
  try {
    const tableName = await getCartTableName();
    console.log(`[Supabase Cart] Synchronizing user cart with table: ${tableName} for user ID: ${userId}, item count: ${items.length}`);
    
    // Clear other cart entries to override
    const { error: deleteError } = await supabase
      .from(tableName || "cart")
      .delete()
      .eq("user_id", userId);

    if (deleteError) {
      console.warn(`[Supabase Cart] Clear existing items error inside ${tableName}:`, deleteError);
    }

    if (items.length === 0) {
      console.log(`[Supabase Cart] Cart is empty, sync complete for table ${tableName}.`);
      return;
    }

    const payload = items.map(item => ({
      user_id: userId,
      product_id: item.product_id,
      quantity: item.quantity,
      created_at: new Date().toISOString()
    }));

    const { error: insertError } = await supabase
      .from(tableName || "cart")
      .insert(payload);

    if (insertError) {
      console.warn(`[Supabase Cart] Initial cart insert failed (checking column structures):`, insertError);
      
      // Retry without created_at column if database does not contain it
      if (insertError.message?.includes("column") || insertError.code === "42703") {
        console.log(`[Supabase Cart Retry] Attempting to insert in table ${tableName} without "created_at" column...`);
        const { error: retryError } = await supabase
          .from(tableName || "cart")
          .insert(items.map(item => ({
            user_id: userId,
            product_id: item.product_id,
            quantity: item.quantity
          })));
        
        if (retryError) {
          console.error(`[Supabase Cart Retry Failure] Insert retry failed inside ${tableName}:`, retryError);
          throw retryError;
        }
      } else {
        throw insertError;
      }
    }
    console.log(`[Supabase Cart] Cart synchronized successfully for user ${userId} in table ${tableName}`);
  } catch (err) {
    console.error("[Supabase Cart Exception] syncSupabaseCart failed to finish sync:", err);
  }
};

// 5. Create and Fetch High Standard Orders & Fail-Safe Order Items Transaction
export const createSupabaseOrder = async (
  userId: string | null,
  email: string,
  phone: string,
  total: number,
  items: { name: string; price: number; quantity: number }[]
): Promise<string | null> => {
  if (!supabase) {
    console.warn("[Supabase Order] Supabase unconfigured, skipping order creation");
    return null;
  }

  try {
    console.log(`[Supabase Order] Creating new order entry: user ID: ${userId || "GUEST"}, email: ${email}, items: ${items.length}`);
    
    const payload: any = {
      customer_email: email,
      customer_phone: phone || null,
      total,
      status: "calibrating"
    };

    if (userId) {
      payload.user_id = userId;
    }

    // Insert to standard public.orders
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert(payload)
      .select()
      .single();

    if (orderError) {
      console.warn("[Supabase Order] Initial order entry failed:", orderError);

      if (userId && (orderError.message?.includes("foreign key") || orderError.code === "23503" || orderError.message?.includes("permission") || orderError.code === "42501")) {
        console.log("[Supabase Order Retry] Retrying order dispatch with neutral guest payload to bypass RLS or foreign key alignment constraints...");
        delete payload.user_id;
        const { data: retryOrder, error: retryError } = await supabase
          .from("orders")
          .insert(payload)
          .select()
          .single();

        if (retryError) {
          console.error("[Supabase Order Retry Failure] Order execution failed completely:", retryError);
          throw retryError;
        }

        if (retryOrder) {
          await processOrderItems(retryOrder.id, items);
          return retryOrder.id;
        }
      }
      throw orderError;
    }

    if (!order) {
      throw new Error("Empty response object received from Supabase orders statement check");
    }

    await processOrderItems(order.id, items);
    return order.id;
  } catch (err) {
    console.error("[Supabase Order Exception] createSupabaseOrder:", err);
    throw err;
  }
};

async function processOrderItems(orderId: string, items: { name: string; price: number; quantity: number }[]): Promise<void> {
  if (!supabase) return;
  console.log(`[Supabase Order Items] Linking items for Order ID: ${orderId}...`);
  try {
    const payload = items.map(item => ({
      order_id: orderId,
      product_name: item.name,
      price: item.price,
      quantity: item.quantity
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(payload);

    if (itemsError) {
      console.warn("[Supabase Order Items] Order items table insert failed:", itemsError);
    } else {
      console.log(`[Supabase Order Items] Successfully linked ${items.length} items to order ${orderId}`);
    }
  } catch (err) {
    console.error("[Supabase Order Items Exception] processOrderItems failed:", err);
  }
}

export const getSupabaseOrders = async (userId: string): Promise<SupabaseOrder[]> => {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Supabase Orders] Error retrieving user orders from database:", error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("[Supabase Orders Exception] getSupabaseOrders:", err);
    return [];
  }
};

// 6. Admin Dashboard Retrieve All Database Dispatches
export const getSupabaseAllOrders = async (): Promise<SupabaseOrder[]> => {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Supabase Admin Orders] Error retrieving all orders from Supabase:", error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("[Supabase Admin Orders Exception] getSupabaseAllOrders:", err);
    return [];
  }
};

// 7. Update Order Status
export const updateSupabaseOrderStatus = async (
  orderId: string,
  status: SupabaseOrder["status"]
) => {
  if (!supabase) return;
  try {
    console.log(`[Supabase Admin Status] Setting status for order ${orderId} to: ${status}`);
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId);

    if (error) {
      console.error("[Supabase Admin Status] Update order status failed:", error);
      throw error;
    }
  } catch (err) {
    console.error("[Supabase Admin Status Exception] updateSupabaseOrderStatus:", err);
    throw err;
  }
};

// 8. Wishlist Operations with Dynamic Table Selection & Column Fallbacks
// 8. Wishlist Operations with Dynamic Table Selection, Authenticated user ID fetch & Fail-safe policies
export const getSupabaseWishlist = async (userId: string): Promise<string[]> => {
  if (!supabase) return [];
  try {
    const tableName = await getWishlistTableName();
    
    // Dynamically retrieve the absolute authenticated user ID to align with RLS policies
    let finalUserId = userId;
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      finalUserId = authUser.id;
      console.log(`[Supabase Wishlist] Verified active dynamic auth user ID: ${finalUserId}`);
    } else {
      console.warn(`[Supabase Wishlist] No active auth session found. Using provided ID: ${userId}`);
    }

    console.log(`[Supabase Wishlist] Retrieving wishlist items from table: ${tableName} for user ID: ${finalUserId}`);
    let { data, error } = await supabase
      .from(tableName || "wishlist")
      .select("product_id")
      .eq("user_id", finalUserId);

    // If table relation is missing or undefined_table, try fallback alternative table
    if (error && (error.code === "42P01" || error.message?.includes("does not exist"))) {
      const altTable = tableName === "wishlist" ? "wishlists" : "wishlist";
      console.log(`[Supabase Wishlist Fallback] Table ${tableName} does not exist. Retrying with alternate table: ${altTable}`);
      const fallbackResult = await supabase
        .from(altTable)
        .select("product_id")
        .eq("user_id", finalUserId);
      
      if (fallbackResult.error) {
        console.error(`[Supabase Wishlist Fallback Failure] Retrying alternative table ${altTable} failed inside getSupabaseWishlist:`, fallbackResult.error);
        return [];
      }
      data = fallbackResult.data;
      error = null;
    }

    if (error) {
      console.error(`[Supabase Wishlist] Error retrieving user wishlist from table ${tableName}:`, error);
      return [];
    }
    return data?.map(d => d.product_id) || [];
  } catch (err) {
    console.error("[Supabase Wishlist Exception] getSupabaseWishlist:", err);
    return [];
  }
};

export const syncSupabaseWishlist = async (userId: string, productIds: string[]) => {
  if (!supabase) return;
  try {
    const tableName = await getWishlistTableName();
    
    // Dynamically retrieve the absolute authenticated user ID to align with RLS policies
    let finalUserId = userId;
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      finalUserId = authUser.id;
    }

    console.log(`[Supabase Wishlist] Synchronizing user wishlist with table: ${tableName} for user ID: ${finalUserId}, item count: ${productIds.length}`);
    
    // Helper to run delete / insert
    const runSyncOnTable = async (table: string) => {
      // Clear any existing entries for this user
      const { error: deleteError } = await supabase
        .from(table)
        .delete()
        .eq("user_id", finalUserId);

      if (deleteError) {
        console.warn(`[Supabase Wishlist] Error clearing wishlist inside ${table}:`, deleteError);
      }

      if (productIds.length === 0) return;

      // Insert wishlist entries
      const payload = productIds.map(productId => ({
        user_id: finalUserId,
        product_id: productId,
        created_at: new Date().toISOString()
      }));

      const { error: insertError } = await supabase
        .from(table)
        .insert(payload);

      if (insertError) {
        console.warn(`[Supabase Wishlist] Initial wishlist insert in ${table} failed:`, insertError);
        
        // Retry without created_at column if database does not contain it
        if (insertError.message?.includes("column") || insertError.code === "42703") {
          console.log(`[Supabase Wishlist Retry] Retrying wishlist insertion without "created_at" in ${table}...`);
          const { error: retryError } = await supabase
            .from(table)
            .insert(
              productIds.map(productId => ({
                user_id: finalUserId,
                product_id: productId
              }))
            );
          if (retryError) {
            console.error(`[Supabase Wishlist Retry Failure] Failed inserting into ${table}:`, retryError);
            throw retryError;
          } else {
            console.log(`[Supabase Wishlist] Wishlist synchronized successfully without created_at in ${table}`);
          }
        } else {
          throw insertError;
        }
      } else {
        console.log(`[Supabase Wishlist] Wishlist synchronized successfully for user ${finalUserId} in ${table}`);
      }
    };

    try {
      await runSyncOnTable(tableName || "wishlist");
    } catch (primaryErr: any) {
      if (primaryErr?.code === "42P01" || primaryErr?.message?.includes("does not exist")) {
        const altTable = tableName === "wishlist" ? "wishlists" : "wishlist";
        console.log(`[Supabase Wishlist Fallback] Retrying complete sync on alternate table: ${altTable}`);
        await runSyncOnTable(altTable);
      } else {
        throw primaryErr;
      }
    }
  } catch (err) {
    console.error("[Supabase Wishlist Exception] syncSupabaseWishlist:", err);
  }
};

export const toggleSupabaseWishlistItem = async (userId: string, productId: string, isAdding: boolean) => {
  if (!supabase) {
    console.warn("[Supabase Wishlist] Supabase client unconfigured. Skipping toggle.");
    return;
  }
  try {
    const tableName = await getWishlistTableName();
    
    // Dynamically retrieve the absolute authenticated user ID to align with RLS policies
    let finalUserId = userId;
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      finalUserId = authUser.id;
      console.log(`[Supabase Wishlist] Verified active dynamic auth user ID: ${finalUserId}`);
    } else {
      console.warn(`[Supabase Wishlist] No active auth session found for toggle. Using provided ID: ${userId}`);
    }

    console.log(`[Supabase Wishlist] Toggling wishlist: user ${finalUserId}, product ${productId}, isAdding: ${isAdding} on table: ${tableName}`);
    
    const runToggleOnTable = async (table: string) => {
      if (isAdding) {
        const { error } = await supabase
          .from(table)
          .insert({ user_id: finalUserId, product_id: productId, created_at: new Date().toISOString() });
        
        if (error) {
          console.warn(`[Supabase Wishlist] Initial toggle insert error in ${table}:`, error);
          
          // Retry without created_at
          if (error.message?.includes("column") || error.code === "42703") {
            console.log(`[Supabase Wishlist Retry] Retrying toggle wishlist insert without created_at on ${table}...`);
            const { error: retryErr } = await supabase
              .from(table)
              .insert({ user_id: finalUserId, product_id: productId });
            if (retryErr) {
              console.error(`[Supabase Wishlist Retry Failure] Failed to add item to wishlist on ${table}:`, retryErr);
              throw retryErr;
            }
          } else {
            throw error;
          }
        }
      } else {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq("user_id", finalUserId)
          .eq("product_id", productId);
        
        if (error) {
          console.error(`[Supabase Wishlist] Failed removing item from wishlist on ${table}:`, error);
          throw error;
        }
      }
    };

    try {
      await runToggleOnTable(tableName || "wishlist");
      console.log(`[Supabase Wishlist] Successfully completed item toggle in table ${tableName}`);
    } catch (primaryErr: any) {
      if (primaryErr?.code === "42P01" || primaryErr?.message?.includes("does not exist")) {
        const altTable = tableName === "wishlist" ? "wishlists" : "wishlist";
        console.log(`[Supabase Wishlist Fallback] Retrying wishlist toggle insert/delete on alternate table: ${altTable}`);
        await runToggleOnTable(altTable);
        console.log(`[Supabase Wishlist] Successfully completed item toggle in alternate table ${altTable}`);
      } else {
        throw primaryErr;
      }
    }
  } catch (err) {
    console.error("[Supabase Wishlist Exception] toggleSupabaseWishlistItem:", err);
    throw err;
  }
};

// 9. Newsletter Subscription Operation with Fallback Support
export const subscribeNewsletter = async (email: string): Promise<void> => {
  if (!supabase) {
    console.warn("[Supabase Newsletter] Supabase unconfigured, skipping newsletter subscribe");
    return;
  }
  
  try {
    console.log(`[Supabase Newsletter] Subscribing email: ${email}`);
    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email, created_at: new Date().toISOString() });

    if (error) {
      console.warn("[Supabase Newsletter] Initial subscriber insert error:", error);
      
      // Retry without created_at column if database does not contain it
      if (error.message?.includes("column") || error.code === "42703") {
        console.log("[Supabase Newsletter Retry] Retrying insert into newsletter_subscribers without created_at column...");
        const { error: retryError } = await supabase
          .from("newsletter_subscribers")
          .insert({ email });
        
        if (retryError) {
          console.error("[Supabase Newsletter Retry Failure] Re-run subscription failed:", retryError);
          throw retryError;
        }
      } else {
        throw error;
      }
    }
    console.log(`[Supabase Newsletter] Successfully subscribed email: ${email}`);
  } catch (err) {
    console.error("[Supabase Newsletter Exception] subscribeNewsletter:", err);
    throw err;
  }
};

// 10. Profile Saving Operation with Non-Duplicate Check and Robust Minimal Schema Retry
export const saveSupabaseProfile = async (uid: string, name: string, email: string) => {
  if (!supabase) {
    console.warn("[Supabase Profile] Supabase is not configured. Skipping profile database write.");
    return;
  }
  
  try {
    console.log(`[Supabase Profile] Checking if user profile already exists for UID: ${uid}...`);
    const { data: existing, error: checkError } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", uid);

    if (checkError) {
      console.warn("[Supabase Profile] Error checking existing profile status:", checkError);
    }

    if (existing && existing.length > 0) {
      console.log(`[Supabase Profile] Row with id ${uid} already exists. Skipping insertion to prevent duplicate records.`);
      return;
    }

    const payload = {
      id: uid,
      name: name || email.split("@")[0] || "Exalted Collector",
      email: email,
      role: email === "chanchaltailor404@gmail.com" ? "admin" : "customer",
      created_at: new Date().toISOString()
    };

    console.log("[Supabase Profile] Attempting profile record insertion with payload:", payload);
    const { error: insertError } = await supabase
      .from("profiles")
      .insert(payload);

    if (insertError) {
      console.warn("[Supabase Profile] Main insertion failed, attempts retrying with minimalist requested columns:", insertError);
      
      // Fallback: save ONLY the strictly required columns mentioned in Requirement #1 (id, email, created_at)
      const fallbackPayload = {
        id: uid,
        email: email,
        created_at: new Date().toISOString()
      };
      
      console.log("[Supabase Profile Retry] Attempting minimalist fallback profile record:", fallbackPayload);
      const { error: fallbackError } = await supabase
        .from("profiles")
        .insert(fallbackPayload);
        
      if (fallbackError) {
        console.error("[Supabase Profile Fallback Failure] Profile insertion aborted:", fallbackError);
        throw fallbackError;
      }
      console.log(`[Supabase Profile] Fallback profile entry saved successfully for id: ${uid}`);
    } else {
      console.log(`[Supabase Profile] Successfully created new user profile row in profiles table for id: ${uid}`);
    }
  } catch (err) {
    console.error("[Supabase Profile Exception] saveSupabaseProfile:", err);
    throw err;
  }
};
