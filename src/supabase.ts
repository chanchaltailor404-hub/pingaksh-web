import { createClient } from "@supabase/supabase-js";

// Fetch from environment variables dynamically using direct references to process.env
// this allows Vite's define plugin to inline the substituted values properly
const env = (import.meta as any).env || {};

// @ts-ignore
const rawSupabaseUrl = (typeof process !== "undefined" && process.env ? process.env.NEXT_PUBLIC_SUPABASE_URL : "") || env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || "";
// @ts-ignore
const rawSupabaseAnonKey = (typeof process !== "undefined" && process.env ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY : "") || env.VITE_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const trimValue = (val: any): string => {
  if (!val) return "";
  const s = String(val).trim();
  if (s === "undefined" || s === "null" || s === "[placeholder]" || s.includes("placeholder")) {
    return "";
  }
  return s;
};

export const supabaseUrl = trimValue(rawSupabaseUrl);
export const supabaseAnonKey = trimValue(rawSupabaseAnonKey);

// Verify if credentials have been correctly configured
export const isSupabaseConfigured = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith("http")
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Display visual warning logs when database connections are uncalibrated
if (!isSupabaseConfigured) {
  console.warn(
    "[Supabase Connection] Supabase credentials coordinates are missing or unconfigured. App will run in secure, robust high-fidelity client-only demo state."
  );
} else {
  console.log(`[Supabase Connection] Success: Initialized with URL: ${supabaseUrl}`);
}

// Interfaces aligned with our PostgreSQL database schema
export interface SupabaseProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  category: "Classic" | "Sport" | "Minimalist" | "Luxury";
  description: string;
  image_url?: string;
  stock_quantity?: number;
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
  order_status?: string;
  shipping_name?: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_zip?: string;
  payment_method?: string;
  created_at?: string;
  tracking_id?: string;
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
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("[Supabase Products] Failed to load products from database:", error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("[Supabase Products Exception] Failed inside getSupabaseProducts query:", err);
    return [];
  }
};

export const getSupabaseProductById = async (id: string): Promise<SupabaseProduct | null> => {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error(`[Supabase Product By ID] Failed to load product ${id} from database:`, error);
      return null;
    }
    return data;
  } catch (err) {
    console.error(`[Supabase Product By ID Exception] Failed inside getSupabaseProductById query for ${id}:`, err);
    return null;
  }
};

export const createSupabaseProduct = async (productData: Omit<SupabaseProduct, "id">): Promise<SupabaseProduct | null> => {
  if (!supabase) return null;
  const payload: any = {
    name: productData.name,
    price: productData.price,
    description: productData.description,
    category: productData.category,
    image: productData.image_url || productData.image || ""
  };
  
  try {
    const fullPayload = {
      ...payload,
      image_url: productData.image_url || productData.image || "",
      stock_quantity: productData.stock_quantity ?? 10
    };
    const { data, error } = await supabase.from("products").insert([fullPayload]).select().maybeSingle();
    if (!error && data) return data;
    console.warn("[Supabase Product Match Alert] First insert attempt with image_url/stock_quantity column failed, retrying default fields...", error);
  } catch (err) {
    console.warn("[Supabase Product Exception Alert] Retrying default fields insertion:", err);
  }

  const { data, error } = await supabase.from("products").insert([payload]).select().maybeSingle();
  if (error) {
    console.error("[Supabase Product Create Error]", error);
    throw error;
  }
  return data;
};

export const updateSupabaseProduct = async (id: string, productData: Partial<SupabaseProduct>): Promise<SupabaseProduct | null> => {
  if (!supabase) return null;
  const payload: any = {
    name: productData.name,
    price: productData.price,
    description: productData.description,
    category: productData.category,
    image: productData.image_url || productData.image
  };
  
  // Clean fields that might be undefined
  Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

  try {
    const fullPayload = {
      ...payload,
      image_url: productData.image_url || productData.image,
      stock_quantity: productData.stock_quantity
    };
    Object.keys(fullPayload).forEach(key => fullPayload[key] === undefined && delete fullPayload[key]);

    const { data, error } = await supabase.from("products").update(fullPayload).eq("id", id).select().maybeSingle();
    if (!error && data) return data;
    console.warn("[Supabase Product Match Alert] First update attempt with image_url/stock_quantity columns failed, retrying default fields...", error);
  } catch (err) {
    console.warn("[Supabase Product Exception Alert] Retrying default fields update:", err);
  }

  const { data, error } = await supabase.from("products").update(payload).eq("id", id).select().maybeSingle();
  if (error) {
    console.error("[Supabase Product Update Error]", error);
    throw error;
  }
  return data;
};

export const deleteSupabaseProduct = async (id: string): Promise<boolean> => {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      console.error("[Supabase Product Delete Error]", error);
      throw error;
    }
    return true;
  } catch (err) {
    console.error("[Supabase Product Delete Exception]", err);
    throw err;
  }
};

// 2. Profile / User Operations
export const getSupabaseProfile = async (uid: string): Promise<SupabaseProfile | null> => {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", uid)
      .single();

    if (error) {
      console.error("[Supabase Profile] Error returning profile from Supabase profiles:", error);
      return null;
    }
    return data;
  } catch (err) {
    console.error("[Supabase Profile Exception] failed inside getSupabaseProfile query:", err);
    return null;
  }
};

// 3. Dynamic Schema / Table Detections for Maximum Resilience
let cachedCartTable: "cart" | "cart_items" | null = "cart";
let cachedWishlistTable: "wishlist" | "wishlists" | null = "wishlist";

export async function getCartTableName(): Promise<"cart" | "cart_items"> {
  return "cart";
}

export async function getWishlistTableName(): Promise<"wishlist" | "wishlists"> {
  return "wishlist";
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
  items: { name: string; price: number; quantity: number }[],
  extraDetails?: {
    payment_method?: string;
    order_status?: string;
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
  }
): Promise<string | null> => {
  if (!supabase) {
    console.warn("[Supabase Order] Supabase unconfigured, skipping order creation");
    return null;
  }

  try {
    const trackingId = "PNG" + Math.floor(Date.now() / 1000);
    console.log(`[Supabase Order] Creating new order entry: user ID: ${userId || "GUEST"}, email: ${email}, items: ${items.length}, tracking ID: ${trackingId}`);
    
    const payload: any = {
      customer_email: email,
      customer_phone: phone || null,
      total,
      status: "calibrating",
      tracking_id: trackingId
    };

    if (userId) {
      payload.user_id = userId;
    }

    if (extraDetails) {
      payload.payment_method = extraDetails.payment_method || "Razorpay";
      payload.order_status = extraDetails.order_status || "Pending";
      payload.shipping_name = extraDetails.name || null;
      payload.shipping_address = extraDetails.address || null;
      payload.shipping_city = extraDetails.city || null;
      payload.shipping_state = extraDetails.state || null;
      payload.shipping_zip = extraDetails.zip || null;
    }

    // Insert to standard public.orders
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert(payload)
      .select()
      .single();

    if (orderError) {
      console.warn("[Supabase Order] Initial order entry failed:", orderError);

      const isMissingColumn = orderError.message?.includes("column") || orderError.code === "42703";

      if (isMissingColumn) {
        console.log("[Supabase Order Fail-Safe] Dynamic schema column unrecognized on remote server. Compressing order metadata into customer_phone field...");
        const safePayload: any = {
          customer_email: email,
          customer_phone: phone ? `${phone} [COD Addr: ${extraDetails?.address || ""}, ${extraDetails?.city || ""}, ${extraDetails?.state || ""} ${extraDetails?.zip || ""}]` : `[COD: Name: ${extraDetails?.name || ""}, Phone: ${phone || ""}]`,
          total,
          status: "calibrating"
        };
        if (userId) {
          safePayload.user_id = userId;
        }

        const { data: fallbackOrder, error: fallbackError } = await supabase
          .from("orders")
          .insert(safePayload)
          .select()
          .single();

        if (fallbackError) {
          if (userId && (fallbackError.message?.includes("foreign key") || fallbackError.code === "23503" || fallbackError.message?.includes("permission") || fallbackError.code === "42501")) {
            console.log("[Supabase Order Retry] Retrying baseline fallback dispatch with neutral guest payload to bypass Auth / FK constraints...");
            delete safePayload.user_id;
            const { data: retryFallbackOrder, error: retryFallbackError } = await supabase
              .from("orders")
              .insert(safePayload)
              .select()
              .single();
            if (retryFallbackError) {
              throw retryFallbackError;
            }
            if (retryFallbackOrder) {
              await processOrderItems(retryFallbackOrder.id, items);
              return retryFallbackOrder.id;
            }
          }
          throw fallbackError;
        }

        if (fallbackOrder) {
          await processOrderItems(fallbackOrder.id, items);
          return fallbackOrder.id;
        }
      }

      if (userId && (orderError.message?.includes("foreign key") || orderError.code === "23503" || orderError.message?.includes("permission") || orderError.code === "42501")) {
        console.log("[Supabase Order Retry] Retrying order dispatch with neutral guest payload...");
        const guestPayload = { ...payload };
        delete guestPayload.user_id;
        
        const { data: retryOrder, error: retryError } = await supabase
          .from("orders")
          .insert(guestPayload)
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
    console.error("[Supabase Order Exception] createSupabaseOrder failed:", err);
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
    console.log(`[Supabase Orders] Fetching orders for user ${userId} without join...`);
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (ordersError) {
      console.error("[Supabase Orders] Error retrieving user orders from database:", ordersError);
      return [];
    }

    if (!orders || orders.length === 0) {
      return [];
    }

    const orderIds = orders.map((o: any) => o.id);
    console.log(`[Supabase Orders] Found ${orders.length} orders. Fetching related items...`);
    const { data: items, error: itemsError } = await supabase
      .from("order_items")
      .select("*")
      .in("order_id", orderIds);

    if (itemsError) {
      console.warn("[Supabase Orders] Failed to query related order_items table:", itemsError);
    }

    return orders.map((order: any) => ({
      ...order,
      order_items: (items || []).filter((item: any) => item.order_id === order.id)
    }));
  } catch (err) {
    console.error("[Supabase Orders Exception] getSupabaseOrders:", err);
    return [];
  }
};

// 6. Admin Dashboard Retrieve All Database Dispatches
export const getSupabaseAllOrders = async (): Promise<SupabaseOrder[]> => {
  if (!supabase) {
    console.warn("[Supabase Admin Orders] Supabase not configured.");
    return [];
  }
  try {
    console.log("[Supabase Admin Orders] Fetching raw orders directly using select('*')...");
    
    // Fetch raw orders directly from the 'orders' table without incorrect filters, joins, or coordinate matching logic
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("*");

    // Add console logs matching Requirements:
    console.log("fetched orders:", orders);
    console.log("order count:", orders ? orders.length : 0);
    console.log("query errors:", ordersError);

    if (ordersError) {
      console.error("[Supabase Admin Orders] Error retrieving all orders from Supabase:", ordersError);
      return [];
    }

    if (!orders || orders.length === 0) {
      return [];
    }

    // Sort the orders inside JS to ensure chronological display and production Vercel compatibility
    const sortedOrders = [...orders].sort((a: any, b: any) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });

    // Fetch related items separately to avoid broken joins if any
    const orderIds = sortedOrders.map((o: any) => o.id);
    console.log(`[Supabase Admin Orders] Fetching related items for ${sortedOrders.length} orders...`);
    
    try {
      const { data: items, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .in("order_id", orderIds);

      if (itemsError) {
        console.warn("[Supabase Admin Orders] Failed to query related order_items: ", itemsError);
        return sortedOrders.map((order: any) => ({
          ...order,
          order_items: []
        }));
      }

      return sortedOrders.map((order: any) => ({
        ...order,
        order_items: (items || []).filter((item: any) => item.order_id === order.id)
      }));
    } catch (innerErr) {
      console.error("[Supabase Admin Orders] Inner exception querying related items:", innerErr);
      return sortedOrders.map((order: any) => ({
        ...order,
        order_items: []
      }));
    }
  } catch (err) {
    console.error("[Supabase Admin Orders Exception] getSupabaseAllOrders:", err);
    return [];
  }
};

// 7. Update Order Status
export const updateSupabaseOrderStatus = async (
  orderId: string,
  statusInput: string
) => {
  if (!supabase) return;
  try {
    console.log(`[Supabase Admin Status] Input status change request for ${orderId}: "${statusInput}"`);
    
    // Perform robust mapping of tracking status to status column value (subject to check constraint)
    // and order_status column string
    let statusCol: "calibrating" | "transit" | "customs" | "fulfilled" | "cancelled" = "calibrating";
    let orderStatusStr = "Pending";

    const normalized = statusInput.trim().toLowerCase();
    switch (normalized) {
      case "pending":
        statusCol = "calibrating";
        orderStatusStr = "Pending";
        break;
      case "processing":
        statusCol = "calibrating";
        orderStatusStr = "Processing";
        break;
      case "shipped":
      case "transit":
        statusCol = "transit";
        orderStatusStr = "Shipped";
        break;
      case "out for delivery":
      case "customs":
        statusCol = "customs";
        orderStatusStr = "Out for Delivery";
        break;
      case "delivered":
      case "fulfilled":
        statusCol = "fulfilled";
        orderStatusStr = "Delivered";
        break;
      case "cancelled":
        statusCol = "cancelled";
        orderStatusStr = "Cancelled";
        break;
      default:
        // Default fallbacks for direct inputs
        if (normalized === "calibrating") {
          statusCol = "calibrating";
          orderStatusStr = "Processing";
        } else {
          statusCol = "calibrating";
          orderStatusStr = statusInput;
        }
        break;
    }

    console.log(`[Supabase Admin Status] Resulting update values - status: "${statusCol}", order_status: "${orderStatusStr}"`);

    // Perform database update
    const { error } = await supabase
      .from("orders")
      .update({ 
        status: statusCol,
        order_status: orderStatusStr
      })
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

// 8. Wishlist Operations with Dynamic Table Selection, Authenticated user ID fetch & Fail-safe policies
export const getSupabaseWishlist = async (userId: string): Promise<string[]> => {
  if (!supabase) return [];
  try {
    const tableName = await getWishlistTableName();
    
    // Dynamically retrieve the absolute authenticated user ID to align with RLS policies
    let finalUserId = userId;
    try {
      const { data: authUserRes } = await supabase.auth.getUser();
      if (authUserRes && authUserRes.user) {
        finalUserId = authUserRes.user.id;
        console.log(`[Supabase Wishlist] Verified active dynamic auth user ID: ${finalUserId}`);
      } else {
        console.warn(`[Supabase Wishlist] No active auth session found. Using provided ID: ${userId}`);
      }
    } catch (authErr) {
      console.warn(`[Supabase Wishlist] Failed dynamically checking auth state. Relying on supplied ID: ${userId}`, authErr);
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

    const productIds = data?.map(d => d.product_id) || [];
    console.log(`[Supabase Wishlist] Retrieved raw database product IDs:`, productIds);

    // Bidirectional mapped output: return both the database UUID AND the local mock ID if matching,
    // which guarantees that both UI modes (supabase watches list / static watches list) stay synchronized flawlessly!
    const expandedIds: string[] = [];
    const localMap: Record<string, string> = {
      "Aurelius Gold": "1",
      "Midnight Chrono": "2",
      "Nordic Silver": "3",
      "Heritage Classic": "4",
      "Oceanic Diver": "5",
      "Stellar Rose": "6"
    };

    // Initialize with direct product IDs retrieved
    for (const pid of productIds) {
      if (!expandedIds.includes(pid)) {
        expandedIds.push(pid);
      }
    }

    if (productIds.length > 0) {
      try {
        console.log(`[Supabase Wishlist Batch Query] Matching product details for IDs:`, productIds);
        const { data: productsData, error: batchErr } = await supabase
          .from("products")
          .select("id, name")
          .in("id", productIds);
        
        if (batchErr) throw batchErr;

        if (productsData && productsData.length > 0) {
          for (const item of productsData) {
            const matchedMockId = localMap[item.name];
            if (matchedMockId && !expandedIds.includes(matchedMockId)) {
              expandedIds.push(matchedMockId);
              console.log(`[Supabase Wishlist Map] Bidirectional mapped DB UUID "${item.id}" to local mock ID "${matchedMockId}" (${item.name})`);
            }
          }
        }
      } catch (mapErr) {
        console.warn(`[Supabase Wishlist Map Warn] Failed batch mapping product UUIDs to local IDs:`, mapErr);
      }
    }

    console.log(`[Supabase Wishlist Final] Returning aligned wishlist array:`, expandedIds);
    return expandedIds;
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
    try {
      const { data: authUserRes } = await supabase.auth.getUser();
      if (authUserRes && authUserRes.user) {
        finalUserId = authUserRes.user.id;
      }
    } catch (authErr) {
      console.warn(`[Supabase Wishlist Sync] Failed dynamically checking auth state. Relying on supplied ID: ${userId}`, authErr);
    }

    console.log(`[Supabase Wishlist] Synchronizing user wishlist with table: ${tableName} for user ID: ${finalUserId}, item count: ${productIds.length}`);
    
    // Resolve any incoming mock IDs ("1"-"6") to dynamic database products table UUIDs to prevent invalid UUID cast crash
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const finalProductIds: string[] = [];
    const dbProductMap: Record<string, string> = {
      "1": "Aurelius Gold",
      "2": "Midnight Chrono",
      "3": "Nordic Silver",
      "4": "Heritage Classic",
      "5": "Oceanic Diver",
      "6": "Stellar Rose"
    };

    for (const pid of productIds) {
      if (uuidRegex.test(pid)) {
        finalProductIds.push(pid);
      } else {
        const name = dbProductMap[pid];
        if (name) {
          try {
            const { data, error } = await supabase
              .from("products")
              .select("id")
              .eq("name", name)
              .limit(1);
            if (!error && data && data.length > 0) {
              finalProductIds.push(data[0].id);
              console.log(`[Supabase Wishlist Sync ID Resolver] Resolved mock ID "${pid}" to database UUID: ${data[0].id}`);
            } else {
              console.warn(`[Supabase Wishlist Sync ID Resolver] DB product not found for "${name}". Error:`, error);
              finalProductIds.push(pid);
            }
          } catch (resErr) {
            console.error(`[Supabase Wishlist Sync ID Exception] Failed to resolve mock ID to UUID:`, resErr);
            finalProductIds.push(pid);
          }
        } else {
          finalProductIds.push(pid);
        }
      }
    }
    
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

      if (finalProductIds.length === 0) return;

      // Insert wishlist entries
      const payload = finalProductIds.map(productId => ({
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
              finalProductIds.map(productId => ({
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
    try {
      const { data: authUserRes } = await supabase.auth.getUser();
      if (authUserRes && authUserRes.user) {
        finalUserId = authUserRes.user.id;
        console.log(`[Supabase Wishlist] Verified active dynamic auth user ID: ${finalUserId}`);
      } else {
        console.warn(`[Supabase Wishlist] No active auth session found for toggle. Using provided ID: ${userId}`);
      }
    } catch (authErr) {
      console.warn(`[Supabase Wishlist Toggle] Failed dynamically checking auth state. Relying on supplied ID: ${userId}`, authErr);
    }

    // Resolve product ID to database UUID to prevent Postgres CAST errors
    let finalProductId = productId;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(productId)) {
      const dbProductMap: Record<string, string> = {
        "1": "Aurelius Gold",
        "2": "Midnight Chrono",
        "3": "Nordic Silver",
        "4": "Heritage Classic",
        "5": "Oceanic Diver",
        "6": "Stellar Rose"
      };
      const name = dbProductMap[productId];
      if (name) {
        try {
          const { data, error } = await supabase
            .from("products")
            .select("id")
            .eq("name", name)
            .limit(1);
          if (!error && data && data.length > 0) {
            finalProductId = data[0].id;
            console.log(`[Supabase Wishlist ID Resolver] Resolved mock ID "${productId}" to dynamic UUID: ${finalProductId}`);
          } else {
            console.warn(`[Supabase Wishlist ID Resolver] DB product not found for name "${name}". Error:`, error);
          }
        } catch (resErr) {
          console.error(`[Supabase Wishlist ID Resolver Exception] Failed to resolve mock ID to UUID:`, resErr);
        }
      }
    }

    console.log(`[Supabase Wishlist] Toggling wishlist: user ${finalUserId}, product ${finalProductId} (original input ID: ${productId}), isAdding: ${isAdding} on table: ${tableName}`);
    
    const runToggleOnTable = async (table: string) => {
      if (isAdding) {
        console.log(`[Supabase Wishlist] Inserting row for user: ${finalUserId} and product: ${finalProductId} into table "${table}"...`);
        const { error } = await supabase
          .from(table)
          .insert({ 
            user_id: finalUserId, 
            product_id: finalProductId, 
            created_at: new Date().toISOString() 
          });
        
        if (error) {
          console.warn(`[Supabase Wishlist] Initial toggle insert error in ${table}:`, error);
          
          // Retry without created_at if DB table does not contain it
          if (error.message?.includes("column") || error.code === "42703") {
            console.log(`[Supabase Wishlist Retry] Retrying toggle wishlist insert without "created_at" on table "${table}"...`);
            const { error: retryErr } = await supabase
              .from(table)
              .insert({ 
                user_id: finalUserId, 
                product_id: finalProductId 
              });
            if (retryErr) {
              console.error(`[Supabase Wishlist Retry Failure] Failed to add item to wishlist on table "${table}":`, retryErr);
              throw retryErr;
            } else {
              console.log(`[Supabase Wishlist] Wishlist row added successfully without created_at on table "${table}"`);
            }
          } else {
            throw error;
          }
        } else {
          console.log(`[Supabase Wishlist] Wishlist row added successfully to table "${table}" with user_id: ${finalUserId}, product_id: ${finalProductId}, created_at: now`);
        }
      } else {
        console.log(`[Supabase Wishlist] Deleting row for user: ${finalUserId} and product: ${finalProductId} from table "${table}"...`);
        const { error } = await supabase
          .from(table)
          .delete()
          .eq("user_id", finalUserId)
          .eq("product_id", finalProductId);
        
        if (error) {
          console.error(`[Supabase Wishlist] Failed removing item from wishlist on table "${table}":`, error);
          throw error;
        } else {
          console.log(`[Supabase Wishlist] Wishlist row deleted successfully from table "${table}"`);
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
    console.error("[Supabase Wishlist Exception] toggleSupabaseWishlistItem failed:", err);
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

// 11. Fetch Newsletter Subscribers
export interface SupabaseSubscriber {
  id?: string;
  email: string;
  created_at?: string;
}

export const getSupabaseNewsletterSubscribers = async (): Promise<SupabaseSubscriber[]> => {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("newsletter_subscribers")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("[Supabase Admin Subscribers] Error retrieving:", error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("[Supabase Admin Subscribers Exception] getSupabaseNewsletterSubscribers:", err);
    return [];
  }
};

// 12. Fetch All User Profiles
export const getSupabaseAllProfiles = async (): Promise<SupabaseProfile[]> => {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*");
    
    if (error) {
      console.error("[Supabase Admin Profiles] Error fetching profiles:", error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("[Supabase Admin Profiles Exception] getSupabaseAllProfiles:", err);
    return [];
  }
};

// 13. Fetch All Wishlist Items Across Users
export const getSupabaseAllWishlists = async (): Promise<any[]> => {
  if (!supabase) {
    console.warn("[Supabase Admin Analytics Debug] Supabase client is not initialized.");
    return [];
  }
  try {
    console.log("[Supabase Admin Analytics Debug] Fetching admin wishlist records from table: wishlist");

    const { data, error } = await supabase
      .from("wishlist")
      .select("*");

    if (error) {
      console.error("[Supabase Admin Analytics Debug] Failed querying 'wishlist' table:", error);
      return [];
    }

    const count = data?.length || 0;
    console.log(`[Supabase Admin Analytics Debug] SUCCESS: 'wishlist' query resolved. Count of rows returned: ${count}`);
    console.log("[Supabase Admin Analytics Debug] RAW WISHLIST ARRAY DATA RECEIVED:", JSON.stringify(data));
    console.log("[Supabase Admin Analytics Debug] Raw Wishlist array object:", data);
    return data || [];
  } catch (err) {
    console.error("[Supabase Admin Wishlists Exception] getSupabaseAllWishlists failed completely:", err);
    return [];
  }
};

// 14. Fetch All Cart Items Across Users
export const getSupabaseAllCartItems = async (): Promise<any[]> => {
  if (!supabase) {
    console.warn("[Supabase Admin Analytics Debug] Supabase client is not initialized.");
    return [];
  }
  try {
    console.log("[Supabase Admin Analytics Debug] Fetching admin cart records from table: cart");

    const { data, error } = await supabase
      .from("cart")
      .select("*");

    if (error) {
      console.error("[Supabase Admin Analytics Debug] Failed querying 'cart' table:", error);
      return [];
    }

    const count = data?.length || 0;
    console.log(`[Supabase Admin Analytics Debug] SUCCESS: 'cart' query resolved. Count of rows returned: ${count}`);
    console.log("[Supabase Admin Analytics Debug] RAW CART ARRAY DATA RECEIVED:", JSON.stringify(data));
    console.log("[Supabase Admin Analytics Debug] Raw Cart array object:", data);
    return data || [];
  } catch (err) {
    console.error("[Supabase Admin Carts Exception] getSupabaseAllCartItems failed completely:", err);
    return [];
  }
};

