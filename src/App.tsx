import React, { useState, useEffect } from "react";
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Link, 
  useNavigate,
  useParams
} from "react-router-dom";
import { 
  ShoppingBag, 
  X, 
  Menu, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Truck,
  Instagram,
  Facebook,
  Twitter,
  Search,
  User,
  Star,
  Plus,
  Trash2,
  Edit2,
  LogOut,
  LayoutDashboard,
  ChevronDown,
  ChevronUp,
  Heart,
  Lock,
  Mail,
  AlertCircle,
  CreditCard,
  Wallet,
  Smartphone,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "./lib/utils";
// Define CustomUser interface aligned with Supabase authentication
export interface CustomUser {
  uid: string;
  email: string | null;
  displayName: string;
}
import { 
  isSupabaseConfigured,
  supabase,
  getSupabaseProducts,
  getSupabaseProfile,
  getSupabaseCart,
  syncSupabaseCart,
  createSupabaseOrder,
  getSupabaseOrders,
  getSupabaseAllOrders,
  updateSupabaseOrderStatus,
  getSupabaseWishlist,
  syncSupabaseWishlist,
  toggleSupabaseWishlistItem,
  subscribeNewsletter,
  saveSupabaseProfile,
  getSupabaseProductById
} from "./supabase";
import WatchAssistant from "./components/WatchAssistant";

// --- Database Error Handling ---
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  console.error('Database Error: ', error, operationType, path);
  throw new Error(error instanceof Error ? error.message : String(error));
}

// --- Types ---
interface Watch {
  id: string;
  name: string;
  price: number;
  image: string;
  category: "Classic" | "Sport" | "Minimalist" | "Luxury";
  description: string;
  image_url?: string;
  created_at?: string;
}

interface CartItem extends Watch {
  quantity: number;
}

const getRawPriceINR = (price: number) => {
  return price < 5000 ? Math.round(price * 83) : price;
};

const getFormattedPrice = (price: number) => {
  return `₹${getRawPriceINR(price).toLocaleString("en-IN")}`;
};

// --- Mock Data ---
const WATCHES: Watch[] = [
  {
    id: "1",
    name: "Aurelius Gold",
    price: 299,
    category: "Luxury",
    image: "https://images.unsplash.com/photo-1524592091214-8c97af1c0db4?auto=format&fit=crop&q=80&w=800",
    description: "A timeless masterpiece with 18k gold plating and sapphire glass."
  },
  {
    id: "2",
    name: "Midnight Chrono",
    price: 189,
    category: "Sport",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800",
    description: "Sleek black finish with precision chronograph movement."
  },
  {
    id: "3",
    name: "Nordic Silver",
    price: 149,
    category: "Minimalist",
    image: "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&q=80&w=800",
    description: "Pure Scandinavian design for the modern minimalist."
  },
  {
    id: "4",
    name: "Heritage Classic",
    price: 259,
    category: "Classic",
    image: "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&q=80&w=800",
    description: "Vintage inspired design with premium leather strap."
  },
  {
    id: "5",
    name: "Oceanic Diver",
    price: 349,
    category: "Sport",
    image: "https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?auto=format&fit=crop&q=80&w=800",
    description: "Water resistant up to 200m, perfect for the adventurous."
  },
  {
    id: "6",
    name: "Stellar Rose",
    price: 219,
    category: "Luxury",
    image: "https://images.unsplash.com/photo-1533139502658-0198f920d8e8?auto=format&fit=crop&q=80&w=800",
    description: "Elegant rose gold finish with delicate detailing."
  }
];

// --- Components ---

const Navbar = ({ 
  cartCount, 
  onCartClick, 
  user,
  onSearchClick,
  onMenuClick 
}: { 
  cartCount: number; 
  onCartClick: () => void; 
  user: CustomUser | null;
  onSearchClick: () => void;
  onMenuClick: () => void;
}) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={cn(
      "fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-6 py-6 flex items-center justify-between",
      isScrolled ? "bg-black/95 border-b border-neutral-900/50 backdrop-blur-md py-4 shadow-2xl" : "bg-transparent py-7"
    )}>
      <div className="flex items-center gap-16">
        <Link to="/" className="text-xl md:text-2xl font-serif font-bold tracking-[0.22em] text-white hover:text-gold transition-colors duration-500">
          PINGAKSH
        </Link>
        <div className="hidden md:flex items-center gap-12 text-[11px] font-bold tracking-[0.25em] text-neutral-400 font-mono">
          <Link to="/" className="hover:text-white transition-all duration-300 relative py-2 group">
            HOME
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-gold transition-all duration-300 ease-out group-hover:w-full opacity-0 group-hover:opacity-100" />
          </Link>
          <Link to="/shop" className="hover:text-white transition-all duration-300 relative py-2 group">
            SHOP
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-gold transition-all duration-300 ease-out group-hover:w-full opacity-0 group-hover:opacity-100" />
          </Link>
          <Link to="/about" className="hover:text-white transition-all duration-300 relative py-2 group">
            ABOUT
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[1px] bg-gold transition-all duration-300 ease-out group-hover:w-full opacity-0 group-hover:opacity-100" />
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-5 text-white">
        <button onClick={onSearchClick} className="hover:text-gold transition-all duration-300 hover:scale-110 p-2 flex items-center justify-center"><Search size={18} /></button>
        <Link 
          to={!user ? "/login" : (user.email === "chanchaltailor404@gmail.com" ? "/admin" : "/profile")} 
          className="hover:text-gold transition-all duration-300 hover:scale-110 p-2 flex items-center justify-center"
        >
          {user ? (user.email === "chanchaltailor404@gmail.com" ? <LayoutDashboard size={18} /> : <User size={18} />) : <User size={18} />}
        </Link>
        <button 
          onClick={onCartClick}
          className="relative hover:text-gold transition-all duration-300 hover:scale-110 p-2 flex items-center justify-center"
        >
          <ShoppingBag size={18} />
          {cartCount > 0 && (
            <span className="absolute top-1 right-1 bg-gold text-black text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center font-mono shadow-md">
              {cartCount}
            </span>
          )}
        </button>
        <button onClick={onMenuClick} className="md:hidden hover:text-gold transition-all duration-300 hover:scale-110 p-2 flex items-center justify-center"><Menu size={18} /></button>
      </div>
    </nav>
  );
};

const Footer = () => {
  const [email, setEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subscribeError, setSubscribeError] = useState<string | null>(null);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    setSubscribeError(null);
    try {
      if (isSupabaseConfigured && supabase) {
        await subscribeNewsletter(email.trim());
      }
      setIsSubscribed(true);
      setEmail("");
      setTimeout(() => setIsSubscribed(false), 5000);
    } catch (err: any) {
      console.error("Mailing subscription failed:", err);
      setSubscribeError(err?.message || "An anomalous error occurred with the subscription.");
      setTimeout(() => setSubscribeError(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="bg-neutral-950 text-white pt-24 pb-12 px-6 border-t border-neutral-900">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="space-y-6">
          <h3 className="text-xl font-serif font-bold tracking-[0.2em]">PINGAKSH</h3>
          <p className="text-neutral-400 text-sm leading-relaxed font-light">
            Crafting architectural accuracy and pristine posture. Luxury-inspired statement timepieces engineered for the distinguished connoisseur.
          </p>
          <div className="flex gap-4">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-gold hover:border-gold/35 transition-all duration-300">
              <Instagram size={15} />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-gold hover:border-gold/35 transition-all duration-300">
              <Facebook size={15} />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-gold hover:border-gold/35 transition-all duration-300">
              <Twitter size={15} />
            </a>
          </div>
        </div>
        <div>
          <h4 className="text-gold font-mono text-xs font-bold mb-6 tracking-[0.2em] uppercase">The Collection</h4>
          <ul className="space-y-4 text-xs font-mono text-neutral-400 uppercase tracking-wider">
            <li><Link to="/shop" className="hover:text-white transition-colors">All Watches</Link></li>
            <li><Link to="/shop" className="hover:text-white transition-colors">Aurelius Series</Link></li>
            <li><Link to="/shop" className="hover:text-white transition-colors">Nordic Minimalist</Link></li>
            <li><Link to="/shop" className="hover:text-white transition-colors">Limited Calibres</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-gold font-mono text-xs font-bold mb-6 tracking-[0.2em] uppercase">Concierge</h4>
          <ul className="space-y-4 text-xs font-mono text-neutral-400 uppercase tracking-wider">
            <li><Link to="/shipping" className="hover:text-white transition-colors">Shipping Policy</Link></li>
            <li><Link to="/returns" className="hover:text-white transition-colors">Returns & Exchanges</Link></li>
            <li><Link to="/faq" className="hover:text-white transition-colors">FAQ Support</Link></li>
            <li><Link to="/warranty" className="hover:text-white transition-colors">Product Warranty</Link></li>
            <li><Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
          </ul>
        </div>
        <div className="space-y-4">
          <h4 className="text-gold font-mono text-xs font-bold tracking-[0.2em] uppercase">The Dispatch</h4>
          <p className="text-neutral-400 text-sm font-light">Receive private announcements and priority calibre updates.</p>
          <form onSubmit={handleSubscribe} className="flex gap-2 relative">
            <input 
              type="email" 
              placeholder="Email Dossier" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              className="bg-neutral-900 border border-neutral-800 rounded-sm px-4 py-3 text-xs w-full focus:outline-none focus:border-gold text-white placeholder-neutral-500 transition-colors disabled:opacity-50"
            />
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-gold text-black rounded-sm px-5 py-3 text-xs font-bold font-mono tracking-widest hover:bg-white hover:text-black transition-all duration-300 disabled:opacity-60"
            >
              {isSubmitting ? "SYNC..." : "JOIN"}
            </button>
            <AnimatePresence>
              {isSubscribed && (
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute -bottom-8 left-0 text-gold text-xs font-bold font-serif italic"
                >
                  Subscription confirmed. Welcome.
                </motion.p>
              )}
              {subscribeError && (
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute -bottom-8 left-0 text-red-500 text-xs font-mono"
                >
                  {subscribeError}
                </motion.p>
              )}
            </AnimatePresence>
          </form>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-neutral-900 text-center text-[10px] font-mono tracking-widest text-neutral-600 uppercase">
        &copy; {new Date().getFullYear()} PINGAKSH Chronographs. Pure refinement.
      </div>
    </footer>
  );
};

const getStockStatus = (watchId: string) => {
  if (watchId === "3" || watchId === "6") return { label: "Low Stock", color: "text-amber-500 bg-amber-500/10 border-amber-500/20" };
  if (watchId === "5") return { label: "Limited Edition", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" };
  return { label: "In Stock", color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" };
};

const WatchCard = ({ 
  watch, 
  onAddToCart,
  onViewDetails,
  wishlist = [],
  onToggleWishlist,
  cart = [],
  onUpdateQty
}: { 
  watch: Watch; 
  onAddToCart: (w: Watch) => void; 
  onViewDetails?: (w: Watch) => void;
  wishlist?: string[];
  onToggleWishlist?: (id: string) => void;
  cart?: CartItem[];
  onUpdateQty?: (id: string, delta: number) => void;
  key?: string;
}) => {
  const isLiked = wishlist.includes(watch.id);
  const inCartItem = cart.find(item => item.id === watch.id);

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="group relative flex flex-col h-full bg-neutral-950/40 border border-neutral-900 hover:border-gold/30 hover:bg-neutral-950 hover:shadow-[0_12px_45px_rgba(212,175,55,0.06)] hover:-translate-y-1.5 transition-all duration-500 rounded-2xl overflow-hidden"
    >
      <div className="relative w-full h-80 overflow-hidden bg-neutral-950 flex-shrink-0 border-b border-neutral-900/60">
        <img 
          src={watch.image} 
          alt={watch.name} 
          className="w-full h-full object-cover transition-transform duration-[800ms] group-hover:scale-[1.04] ease-out select-none"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent opacity-60" />
        
        {/* Exquisite / Category Pill */}
        {watch.price > 250 && (
          <span className="absolute top-4 left-4 bg-gold text-black text-[9px] font-bold px-3 py-1.5 tracking-[0.15em] rounded-sm font-mono uppercase shadow-md select-none">
            EXQUISITE
          </span>
        )}

        {/* Wishlist Button */}
        {onToggleWishlist && (
          <button 
            onClick={() => onToggleWishlist(watch.id)}
            className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-neutral-950/90 border border-neutral-800 hover:border-gold/50 flex items-center justify-center text-white transition-all duration-300 hover:scale-110 active:scale-95 group/wishlist shadow-lg backdrop-blur-sm"
            aria-label={isLiked ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart 
              size={14} 
              className={cn(
                "transition-all duration-300 transform", 
                isLiked 
                  ? "fill-red-500 text-red-500 scale-110 filter drop-shadow-[0_0_4px_rgba(239,68,68,0.5)]" 
                  : "text-neutral-400 group-hover/wishlist:text-red-400"
              )} 
            />
          </button>
        )}
      </div>

      <div className="p-5 flex flex-col flex-grow justify-between bg-neutral-950/20">
        <div className="space-y-3">
          <div className="flex justify-between items-start gap-2">
            <h3 className="text-base font-serif font-bold text-white group-hover:text-gold transition-colors duration-300 leading-snug line-clamp-1 truncate">{watch.name}</h3>
            <div className="text-right flex-shrink-0">
              <p className="text-base font-bold text-gold font-sans">{getFormattedPrice(watch.price)}</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-[9px] text-neutral-500 uppercase tracking-[0.2em] font-mono font-semibold">{watch.category} CALIBRE</p>
            <span className={cn("text-[8px] font-mono font-semibold px-2 py-0.5 rounded border uppercase tracking-widest", getStockStatus(watch.id).color)}>
              {getStockStatus(watch.id).label}
            </span>
          </div>

          <p className="text-neutral-400 text-[11px] font-light leading-relaxed line-clamp-2 h-9">
            {watch.description || "Individually calibrated premium automatic watch finished with protective sapphire lens and fine steel link bands."}
          </p>
        </div>
        
        {/* Actions panel */}
        <div className="mt-5 pt-4 border-t border-neutral-900/60 grid grid-cols-2 gap-3">
          <Link 
            to={`/product/${watch.id}`}
            className="w-full bg-transparent border border-neutral-800 hover:border-gold hover:text-white text-neutral-400 hover:scale-[1.02] active:scale-[0.98] py-3 text-[10px] font-mono font-bold tracking-[0.2em] transition-all duration-300 uppercase rounded-sm flex items-center justify-center gap-1.5"
          >
            Details
          </Link>
          {inCartItem && onUpdateQty ? (
            <div className="w-full flex items-center justify-between border border-gold/40 bg-gold/5 rounded-sm overflow-hidden text-neutral-200 font-mono">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateQty(watch.id, -1);
                }}
                className="px-2 w-8 h-full bg-neutral-900/40 hover:bg-gold hover:text-black transition-colors text-gold text-xs font-bold active:scale-95"
              >
                -
              </button>
              <span className="text-[9px] font-bold tracking-wider text-gold font-mono uppercase">
                {inCartItem.quantity} IN BAG
              </span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateQty(watch.id, 1);
                }}
                className="px-2 w-8 h-full bg-neutral-900/40 hover:bg-gold hover:text-black transition-colors text-gold text-xs font-bold active:scale-95"
              >
                +
              </button>
            </div>
          ) : (
            <button 
              onClick={() => onAddToCart(watch)}
              className="w-full bg-gold hover:bg-white hover:scale-[1.02] active:scale-[0.98] text-black py-3 text-[10px] font-mono font-bold tracking-[0.2em] transition-all duration-300 uppercase rounded-sm flex items-center justify-center shadow-lg shadow-gold/5"
            >
              Acquire
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const CartDrawer = ({ 
  isOpen, 
  onClose, 
  items, 
  onUpdateQty, 
  onRemove,
  onCheckout
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  items: CartItem[];
  onUpdateQty: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
}) => {
  const navigate = useNavigate();
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
          />
          <motion.div 
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-neutral-950 border-l border-neutral-900 z-[70] shadow-2xl flex flex-col text-white"
          >
            <div className="p-6 flex items-center justify-between border-b border-neutral-900">
              <h2 className="text-xl font-serif font-bold tracking-tight">Shopping Bag</h2>
              <button onClick={onClose} className="p-2 hover:bg-neutral-900 rounded-full text-neutral-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-neutral-500 space-y-4">
                  <div className="w-16 h-16 bg-neutral-900/50 rounded-full flex items-center justify-center border border-neutral-800 text-neutral-500">
                    <ShoppingBag size={28} strokeWidth={1.5} />
                  </div>
                  <p className="font-serif">Your bag is currently empty</p>
                  <button 
                    onClick={onClose}
                    className="text-gold font-bold text-xs tracking-widest hover:text-white transition-colors"
                  >
                    CONTINUE EXPLORING
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4 rounded-xl bg-neutral-900/20 border border-neutral-900/60">
                    <div className="w-20 h-24 bg-neutral-950 overflow-hidden rounded border border-neutral-800">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between items-start">
                        <h3 className="text-sm font-serif font-medium text-white">{item.name}</h3>
                        <button onClick={() => onRemove(item.id)} className="text-neutral-500 hover:text-red-400 transition-colors">
                          <X size={14} />
                        </button>
                      </div>
                      <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono">{item.category}</p>
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-neutral-900/30">
                        <div className="flex items-center border border-neutral-800 rounded bg-neutral-950">
                          <button 
                            onClick={() => onUpdateQty(item.id, -1)}
                            className="px-2.5 py-1 text-neutral-400 hover:bg-neutral-900 hover:text-white transition-colors"
                          >-</button>
                          <span className="px-3 text-xs font-mono font-bold text-white">{item.quantity}</span>
                          <button 
                            onClick={() => onUpdateQty(item.id, 1)}
                            className="px-2.5 py-1 text-neutral-400 hover:bg-neutral-900 hover:text-white transition-colors"
                          >+</button>
                        </div>
                        <div className="flex flex-col items-end">
                          <p className="text-sm font-bold text-gold">{getFormattedPrice(item.price * item.quantity)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="p-6 border-t border-neutral-900 bg-neutral-950/90 backdrop-blur-md space-y-4">
                <div className="space-y-1.5 pb-2 border-b border-neutral-900/60">
                  <div className="flex justify-between items-end">
                    <span className="text-neutral-400 text-sm font-medium">Subtotal</span>
                    <span className="text-lg font-bold text-gold font-mono">{getFormattedPrice(total)}</span>
                  </div>
                </div>
                <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono select-none">
                  Pan-India Air Delivery • 18% GST Included • Auto-Calibrated
                </p>
                <button 
                  onClick={() => {
                    onClose();
                    navigate("/checkout");
                  }}
                  className="w-full bg-gold text-black hover:bg-white hover:scale-[1.01] active:scale-[0.99] py-4 font-mono text-xs font-bold tracking-[0.2em] transition-all duration-300 uppercase rounded shadow-lg shadow-gold/5"
                >
                  SECURE CHECKOUT — ₹{getRawPriceINR(total).toLocaleString("en-IN")}
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const Home = ({ 
  onAddToCart, 
  watches,
  onViewDetails,
  wishlist,
  onToggleWishlist,
  cart = [],
  onUpdateQty,
  isProductsLoading = false
}: { 
  onAddToCart: (w: Watch) => void; 
  watches: Watch[];
  onViewDetails: (w: Watch) => void;
  wishlist: string[];
  onToggleWishlist: (id: string) => void;
  cart?: CartItem[];
  onUpdateQty?: (id: string, delta: number) => void;
  isProductsLoading?: boolean;
}) => {
  // Sort dynamic products: newest first (using created_at timestamp falling back to id descending)
  const sortedWatches = [...watches].sort((a, b) => {
    const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
    if (timeA === timeB) {
      return b.id.localeCompare(a.id);
    }
    return timeB - timeA;
  });

  return (
    <main>
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-black">
        <div className="absolute inset-0 opacity-35">
          <img 
            src="https://images.unsplash.com/photo-1622434641406-a158123450f9?auto=format&fit=crop&q=80&w=1920" 
            alt="Luxury Watch Crafts" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/85" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.75)_0%,transparent_65%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.06)_0%,transparent_60%)]" />
        
        <div className="relative z-10 text-center space-y-10 px-6 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="text-gold tracking-[0.4em] text-xs font-bold uppercase block font-mono">The Art of Stature</span>
            <h1 className="text-6xl md:text-9xl font-serif font-semibold text-white mt-4 tracking-[-0.04em] drop-shadow-lg">
              PINGAKSH
            </h1>
            <p className="text-neutral-200 max-w-xl mx-auto mt-6 text-sm md:text-base leading-relaxed font-normal tracking-wide drop-shadow">
              Discover our curated collection of affordable, luxury-inspired statement timepieces. 
              Calibrated for distinction and designed for those who appreciate iconic horological aesthetics.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-5"
          >
            <Link 
              to="/shop" 
              className="w-full sm:w-auto bg-gold text-black px-12 py-5 text-xs font-bold tracking-[0.25em] hover:bg-white hover:text-black transition-all duration-300 flex items-center justify-center gap-2 group rounded-sm shadow-xl shadow-gold/10"
            >
              DISCOVER CATALOGUE <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              to="/about" 
              className="w-full sm:w-auto text-white border border-neutral-800 hover:border-gold hover:text-gold px-12 py-5 text-xs font-bold tracking-[0.25em] bg-neutral-950/40 backdrop-blur-sm transition-all duration-300 rounded-sm"
            >
              OUR HERITAGE
            </Link>
          </motion.div>
        </div>

        <motion.div 
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 select-none pointer-events-none"
        >
          <span className="text-[9px] font-mono tracking-[0.3em] uppercase text-neutral-500">Scroll Down</span>
          <div className="w-[1px] h-10 bg-gradient-to-b from-gold/50 to-transparent" />
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-28 px-6 bg-neutral-950 border-y border-neutral-900/30 relative animate-fade-in">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
          <motion.div 
            whileHover={{ y: -6 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center text-center space-y-5 p-10 rounded-2xl bg-neutral-950 border border-neutral-900/80 hover:border-gold/30 hover:shadow-[0_16px_40px_rgba(212,175,55,0.04)] transition-all duration-500"
          >
            <div className="w-16 h-16 bg-gold/[0.03] rounded-full flex items-center justify-center text-gold border border-gold/15 mb-1">
              <Truck size={24} />
            </div>
            <h3 className="text-lg md:text-xl font-serif text-white font-medium tracking-tight">Pan-India Shipping</h3>
            <p className="text-neutral-400 text-xs md:text-sm leading-relaxed max-w-xs font-light">
              Secure, insured delivery operations available exclusively across India. Custom shipping rates are dynamically calculated relative to item size or insurance.
            </p>
          </motion.div>
          <motion.div 
            whileHover={{ y: -6 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center text-center space-y-5 p-10 rounded-2xl bg-neutral-950 border border-neutral-900/80 hover:border-gold/30 hover:shadow-[0_16px_40px_rgba(212,175,55,0.04)] transition-all duration-500"
          >
            <div className="w-16 h-16 bg-gold/[0.03] rounded-full flex items-center justify-center text-gold border border-gold/15 mb-1">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-lg md:text-xl font-serif text-white font-medium tracking-tight">1-Year Warranty</h3>
            <p className="text-neutral-400 text-xs md:text-sm leading-relaxed max-w-xs font-light">
              Each certified original Pingaksh timepiece is fully backed by our official 1-year manufacturer warranty, guarding internal mechanical calibre alignments securely.
            </p>
          </motion.div>
          <motion.div 
            whileHover={{ y: -6 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center text-center space-y-5 p-10 rounded-2xl bg-neutral-950 border border-neutral-900/80 hover:border-gold/30 hover:shadow-[0_16px_40px_rgba(212,175,55,0.04)] transition-all duration-500"
          >
            <div className="w-16 h-16 bg-gold/[0.03] rounded-full flex items-center justify-center text-gold border border-gold/15 mb-1">
              <Clock size={24} />
            </div>
            <h3 className="text-lg md:text-xl font-serif text-white font-medium tracking-tight">Precision Quartz Movement</h3>
            <p className="text-neutral-400 text-xs md:text-sm leading-relaxed max-w-xs font-light">
              Crafted for reliable everyday performance with refined craftsmanship and premium finishing.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Premium Featured Collection */}
      <section className="py-32 px-6 bg-black relative">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.02)_0%,transparent_50%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
            <div className="space-y-3">
              <span className="text-gold text-xs font-mono font-bold tracking-[0.3em] uppercase block">PREEMINENT COLLECTION</span>
              <h2 className="text-3xl md:text-5xl font-serif font-bold text-white tracking-tight">Featured Masterpieces</h2>
              <p className="text-neutral-400 text-sm font-light max-w-md">Our finest, custom-curated calibres. Hand-calibrated with surgical precision, designed to define stature.</p>
            </div>
            <Link to="/shop" className="text-xs font-mono font-bold tracking-[0.25em] text-gold border-b border-gold/10 pb-2 hover:border-gold hover:text-white transition-all duration-300 uppercase shrink-0">
              View All Series
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10">
            {isProductsLoading ? (
              // Luxury dark shimmer placeholder skeleton loaders
              Array.from({ length: 4 }).map((_, idx) => (
                <div 
                  key={idx} 
                  className="bg-neutral-950/40 border border-neutral-900 rounded-2xl overflow-hidden flex flex-col h-[480px] animate-pulse relative"
                >
                  <div className="w-full h-80 bg-neutral-900/45 relative" />
                  <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="h-5 bg-neutral-900/60 rounded w-2/3" />
                      <div className="h-4 bg-neutral-900/60 rounded w-1/3" />
                      <div className="space-y-2">
                        <div className="h-3 bg-neutral-900/40 rounded w-full" />
                        <div className="h-3 bg-neutral-900/40 rounded w-5/6" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-neutral-900/60">
                      <div className="h-10 bg-neutral-900/50 rounded-sm" />
                      <div className="h-10 bg-neutral-900/50 rounded-sm" />
                    </div>
                  </div>
                </div>
              ))
            ) : sortedWatches.length === 0 ? (
              <div className="col-span-full text-center py-20 bg-neutral-950/20 border border-neutral-900 rounded-2xl space-y-4">
                <span className="text-gold text-xs font-mono font-bold tracking-[0.3em] uppercase block">NO MASTERPIECES FOUND</span>
                <p className="text-neutral-400 text-xs font-light max-w-md mx-auto">Our digital vault is temporarily closed or empty. Add some original pieces inside settings to start exploring.</p>
              </div>
            ) :
              sortedWatches.map((watch) => {
                const isLiked = wishlist.includes(watch.id);
                return (
                  <motion.div 
                    key={watch.id}
                    layout
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="group bg-neutral-950/40 border border-neutral-905 hover:border-gold/30 hover:bg-neutral-950 hover:shadow-[0_12px_45px_rgba(212,175,55,0.06)] hover:-translate-y-1.5 transition-all duration-500 rounded-2xl overflow-hidden flex flex-col h-full relative"
                  >
                    {/* Image Container with Consistent Dimensions */}
                    <div className="relative w-full h-80 overflow-hidden bg-neutral-950 flex-shrink-0 border-b border-neutral-900/60">
                      <img 
                        src={watch.image || watch.image_url || "https://images.unsplash.com/photo-1524592091214-8c97af1c0db4?auto=format&fit=crop&q=80&w=800"} 
                        alt={watch.name} 
                        onError={(e) => {
                          e.currentTarget.src = "https://images.unsplash.com/photo-1524592091214-8c97af1c0db4?auto=format&fit=crop&q=80&w=800";
                        }}
                        className="w-full h-full object-cover transition-transform duration-[800ms] group-hover:scale-[1.04] ease-out select-none"
                        referrerPolicy="no-referrer"
                      />
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent opacity-60" />
                    
                    {/* Category Pill */}
                    <span className="absolute top-4 left-4 bg-neutral-950/90 border border-neutral-800/80 backdrop-blur-md text-neutral-300 text-[8px] font-bold font-mono px-3 py-1.5 tracking-[0.15em] rounded-sm uppercase shadow-sm">
                      {watch.category}
                    </span>

                    {/* Wishlist Button inside Image block */}
                    <button 
                      onClick={() => onToggleWishlist(watch.id)}
                      className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-neutral-950/90 border border-neutral-800 hover:border-gold/50 flex items-center justify-center text-white transition-all duration-300 hover:scale-110 active:scale-95 group/wishlist shadow-lg backdrop-blur-sm"
                      aria-label={isLiked ? "Remove from wishlist" : "Add to wishlist"}
                    >
                      <Heart 
                        size={14} 
                        className={cn(
                          "transition-all duration-300 transform", 
                          isLiked 
                            ? "fill-red-500 text-red-500 scale-110 filter drop-shadow-[0_0_4px_rgba(239,68,68,0.5)]" 
                            : "text-neutral-400 group-hover/wishlist:text-red-400"
                        )} 
                      />
                    </button>
                  </div>

                  {/* Card Info Details - Supports Equal Heights nicely via flex-1 */}
                  <div className="p-5 flex flex-col flex-grow justify-between bg-neutral-950/20">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="text-base font-serif font-bold text-white group-hover:text-gold transition-colors duration-300 leading-snug line-clamp-1 truncate">{watch.name}</h3>
                        <div className="text-right flex-shrink-0">
                          <p className="text-base font-bold text-gold font-sans">{getFormattedPrice(watch.price)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-[9px] text-neutral-500 uppercase tracking-[0.2em] font-mono font-semibold">{watch.category} CALIBRE</p>
                        <span className={cn("text-[8px] font-mono font-semibold px-2 py-0.5 rounded border uppercase tracking-widest", getStockStatus(watch.id).color)}>
                          {getStockStatus(watch.id).label}
                        </span>
                      </div>

                      <p className="text-neutral-400 text-[11px] font-light leading-relaxed line-clamp-2 h-9">
                        {watch.description || "Individually calibrated premium automatic watch finished with protective sapphire lens and fine steel link bands."}
                      </p>
                    </div>
                    
                    {/* Action buttons panel: View Details & Acquire stacked beautifully */}
                    <div className="mt-5 pt-4 border-t border-neutral-900/60 grid grid-cols-2 gap-3">
                      <button 
                        onClick={() => onViewDetails(watch)}
                        className="w-full bg-transparent border border-neutral-800 hover:border-gold hover:text-white text-neutral-400 hover:scale-[1.02] active:scale-[0.98] py-3 text-[10px] font-mono font-bold tracking-[0.2em] transition-all duration-300 uppercase rounded-sm flex items-center justify-center gap-1.5"
                      >
                        Details
                      </button>
                      {cart.find(item => item.id === watch.id) ? (
                        <div className="w-full flex items-center justify-between border border-gold/40 bg-gold/5 rounded-sm overflow-hidden text-neutral-200 font-mono">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateQty && onUpdateQty(watch.id, -1);
                            }}
                            className="px-2 w-8 h-full bg-neutral-900/40 hover:bg-gold hover:text-black transition-colors text-gold text-xs font-bold active:scale-95"
                          >
                            -
                          </button>
                          <span className="text-[9px] font-bold tracking-wider text-gold font-mono uppercase">
                            {cart.find(item => item.id === watch.id)?.quantity} IN BAG
                          </span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateQty && onUpdateQty(watch.id, 1);
                            }}
                            className="px-2 w-8 h-full bg-neutral-900/40 hover:bg-gold hover:text-black transition-colors text-gold text-xs font-bold active:scale-95"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => onAddToCart(watch)}
                          className="w-full bg-gold hover:bg-white hover:scale-[1.02] active:scale-[0.98] text-black py-3 text-[10px] font-mono font-bold tracking-[0.2em] transition-all duration-300 uppercase rounded-sm flex items-center justify-center shadow-lg shadow-gold/5"
                        >
                          Acquire
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

    {/* Testimonial */}
    <section className="py-28 px-6 bg-neutral-950 text-white overflow-hidden relative border-t border-neutral-900/40">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold/5 rounded-full blur-3xl -mr-64 -mt-64 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-gold/5 rounded-full blur-3xl -ml-40 -mb-40 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16 space-y-3">
          <span className="text-gold text-xs font-bold tracking-[0.3em] uppercase block font-mono">Worldwide Acclaim</span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold tracking-tight text-white">The Connoisseur Experience</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div 
            whileHover={{ y: -6 }}
            transition={{ duration: 0.3 }}
            className="bg-neutral-900/10 border border-neutral-900 p-8 rounded-2xl flex flex-col justify-between space-y-8"
          >
            <div className="space-y-4">
              <div className="flex gap-1 text-gold">
                {[...Array(5)].map((_, i) => <Star key={i} size={15} fill="currentColor" />)}
              </div>
              <p className="text-neutral-300 font-serif italic text-base leading-relaxed">
                "Pingaksh has completely redefined what affordable homage value represents. The finishing on my Aurelius Gold gives me the classic high-end look and weight at an incredibly approachable price point."
              </p>
            </div>
            <div className="pt-4 border-t border-neutral-900/60 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center font-serif text-gold font-bold text-sm">
                JH
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">James Harrison</h4>
                <span className="text-[10px] text-neutral-500 font-mono tracking-widest uppercase block">Watch Collector</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -6 }}
            transition={{ duration: 0.3 }}
            className="bg-neutral-900/10 border border-neutral-900 p-8 rounded-2xl flex flex-col justify-between space-y-8"
          >
            <div className="space-y-4">
              <div className="flex gap-1 text-gold">
                {[...Array(5)].map((_, i) => <Star key={i} size={15} fill="currentColor" />)}
              </div>
              <p className="text-neutral-300 font-serif italic text-base leading-relaxed">
                "The minimalism of the Nordic Silver is exquisite. It is remarkably lightweight, exceptionally accurate on time parameters, and commands instant curiosity in any social room."
              </p>
            </div>
            <div className="pt-4 border-t border-neutral-900/60 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center font-serif text-gold font-bold text-sm">
                VS
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Valerie Sterling</h4>
                <span className="text-[10px] text-neutral-500 font-mono tracking-widest uppercase block">Lifestyle Editor</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -6 }}
            transition={{ duration: 0.3 }}
            className="bg-neutral-900/10 border border-neutral-900 p-8 rounded-2xl flex flex-col justify-between space-y-8"
          >
            <div className="space-y-4">
              <div className="flex gap-1 text-gold">
                {[...Array(5)].map((_, i) => <Star key={i} size={15} fill="currentColor" />)}
              </div>
              <p className="text-neutral-300 font-serif italic text-base leading-relaxed">
                "The customer service matches the elegance of their watches. Fast express fulfillment, incredible premium presentation framing, and a truly high-class concierge response team."
              </p>
            </div>
            <div className="pt-4 border-t border-neutral-900/60 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center font-serif text-gold font-bold text-sm">
                MV
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Marcus Vance</h4>
                <span className="text-[10px] text-neutral-500 font-mono tracking-widest uppercase block">Creative Director</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  </main>
);
};

const Shop = ({ 
  onAddToCart, 
  watches,
  onViewDetails,
  wishlist,
  onToggleWishlist,
  cart = [],
  onUpdateQty
}: { 
  onAddToCart: (w: Watch) => void; 
  watches: Watch[];
  onViewDetails: (w: Watch) => void;
  wishlist: string[];
  onToggleWishlist: (id: string) => void;
  cart?: CartItem[];
  onUpdateQty?: (id: string, delta: number) => void;
}) => {
  const [filter, setFilter] = useState("All");
  const categories = ["All", "Classic", "Sport", "Minimalist", "Luxury"];

  const filteredWatches = filter === "All" 
    ? watches 
    : watches.filter(w => w.category === filter);

  return (
    <div className="pt-40 pb-28 px-6 bg-black min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <span className="text-gold text-xs font-bold tracking-[0.3em] uppercase block font-mono">The Catalogue</span>
          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white tracking-tight">The Pingaksh Collection</h1>
          <p className="text-neutral-400 mt-4 max-w-lg mx-auto text-sm md:text-base font-light leading-relaxed tracking-wide">
            Explore our range of meticulously crafted timepieces. Designed for elite stature and precise daily calibration.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mb-16">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={cn(
                "px-7 py-3 text-[10px] font-bold tracking-[0.2em] transition-all uppercase border rounded-full font-mono",
                filter === cat 
                  ? "bg-gold text-black border-gold shadow-lg shadow-gold/10" 
                  : "bg-transparent text-neutral-400 border-neutral-800 hover:border-gold hover:text-white"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {filteredWatches.map(watch => (
            <WatchCard 
              key={watch.id} 
              watch={watch} 
              onAddToCart={onAddToCart} 
              onViewDetails={onViewDetails}
              wishlist={wishlist}
              onToggleWishlist={onToggleWishlist}
              cart={cart}
              onUpdateQty={onUpdateQty}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const Checkout = ({ 
  items, 
  onSuccess,
  user
}: { 
  items: CartItem[]; 
  onSuccess: () => void;
  user: any;
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isSandboxActive, setIsSandboxActive] = useState(false);
  const [sandboxPayload, setSandboxPayload] = useState<any>(null);
  const [activeMockTab, setActiveMockTab] = useState<'card' | 'upi' | 'net'>('card');
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip: ""
  });

  // Prefill Form Details
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.displayName || "",
        email: user.email || ""
      }));
    }
  }, [user]);

  // Load Razorpay Checkout dynamically inside client
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      // Cleanup to be safe
      const scriptElement = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (scriptElement && scriptElement.parentNode) {
        scriptElement.parentNode.removeChild(scriptElement);
      }
    };
  }, []);

  const total = items.reduce((sum, item) => sum + getRawPriceINR(item.price) * item.quantity, 0);
  const totalINR = total;

  const saveOrderToDatabase = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: authUserRes } = await supabase.auth.getUser();
        const activeUid = authUserRes?.user?.id || null;
        await createSupabaseOrder(
          activeUid,
          formData.email,
          formData.phone || "9828488365",
          total,
          items.map(i => ({ name: i.name, price: getRawPriceINR(i.price), quantity: i.quantity }))
        );
      } catch (supabaseErr) {
        console.error("Failed to commit order details to Supabase database", supabaseErr);
        throw supabaseErr;
      }
    }

    // Save order local sync for Client tracking
    const savedOrders = localStorage.getItem("pingaksh_customer_orders") || "[]";
    try {
      const ordersList = JSON.parse(savedOrders);
      const newOrder = {
        id: "ORD-" + Math.floor(100000 + Math.random() * 900000),
        date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        total,
        items: items.map(i => ({ id: i.id, name: i.name, price: getRawPriceINR(i.price), quantity: i.quantity, image: i.image })),
        status: "calibrating" // high elegant status
      };
      ordersList.unshift(newOrder);
      localStorage.setItem("pingaksh_customer_orders", JSON.stringify(ordersList));
    } catch (err) {
      console.error("Local order sync failed", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setPaymentError(null);

    try {
      // 1. Create order on the backend (real Razorpay or sandbox fallback)
      const res = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          total,
          customerEmail: formData.email
        })
      });

      if (!res.ok) {
        throw new Error("Unable to establish payment session with the server.");
      }

      const orderData = await res.json();
      console.log("Order initialization payload:", orderData);

      if (orderData.sandbox) {
        setSandboxPayload(orderData);
        setIsSandboxActive(true);
      } else {
        if (!(window as any).Razorpay) {
          throw new Error("Razorpay SDK is not fully loaded. Please check your network connection.");
        }

        const options = {
          key: orderData.key_id,
          amount: orderData.amount,
          currency: orderData.currency,
          name: "Pingaksh",
          description: "Luxury-inspired statement watches",
          order_id: orderData.order_id,
          handler: async (response: any) => {
            setVerifyingPayment(true);
            try {
              const verifyRes = await fetch("/api/razorpay/verify-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  items,
                  total,
                  customerEmail: formData.email,
                  sandbox: false
                })
              });
              
              const verifyData = await verifyRes.json();
              if (verifyData.success) {
                await saveOrderToDatabase();
                onSuccess();
                navigate("/success");
              } else {
                setPaymentError(verifyData.error || "Cryptographic verification failed.");
              }
            } catch (vErr) {
              setPaymentError("An error occurred during transaction validation.");
            } finally {
              setVerifyingPayment(false);
              setIsProcessing(false);
            }
          },
          prefill: {
            name: formData.name,
            email: formData.email,
            contact: formData.phone || "9828488365"
          },
          theme: {
            color: "#d4af37"
          },
          modal: {
            ondismiss: function() {
              setIsProcessing(false);
              setPaymentError("Payment process canceled by customer.");
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", function (resp: any) {
          setPaymentError(resp.error.description || "The real payment transaction failed.");
          setIsProcessing(false);
        });
        rzp.open();
      }
    } catch (err: any) {
      console.error("Order submit failed:", err);
      setPaymentError(err?.message || "Failed to initialize payment gateway. Please check connection.");
      setIsProcessing(false);
    }
  };

  const handleSandboxSimulateSuccess = async () => {
    setIsSandboxActive(false);
    setVerifyingPayment(true);
    try {
      const verifyRes = await fetch("/api/razorpay/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpay_order_id: sandboxPayload?.order_id,
          razorpay_payment_id: "pay_sandbox_" + Math.random().toString(36).substring(2, 10),
          razorpay_signature: "sandbox_sig_verified",
          items,
          total,
          customerEmail: formData.email,
          sandbox: true
        })
      });
      const verifyData = await verifyRes.json();
      if (verifyData.success) {
        await saveOrderToDatabase();
        onSuccess();
        navigate("/success");
      } else {
        setPaymentError("Sandbox payment processing verification failed.");
      }
    } catch (err) {
      setPaymentError("An error occurred simulating sandbox verify.");
    } finally {
      setVerifyingPayment(false);
      setIsProcessing(false);
    }
  };

  const handleSandboxSimulateFailure = () => {
    setIsSandboxActive(false);
    setIsProcessing(false);
    setPaymentError("Razorpay transaction rejected: Insufficient credit limit. (Code: INSUFFICIENT_FUNDS_402)");
  };

  return (
    <div className="pt-32 sm:pt-40 pb-20 sm:pb-28 px-4 sm:px-6 min-h-screen bg-black">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8 animate-fade-in">
          <div className="space-y-2 border-b border-neutral-900 pb-4">
            <h2 className="text-2xl font-serif font-bold text-white tracking-tight">Securing Your Order</h2>
            <p className="text-xs text-neutral-500 font-sans">Provide shipping coordinates for dispatch tracking.</p>
          </div>

          {paymentError && (
            <motion.div 
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-red-950/20 border border-red-500/30 rounded-xl text-red-200 text-xs flex gap-3 items-start"
            >
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-serif font-bold text-sm">Transaction Failed</p>
                <p className="font-sans leading-relaxed text-[11px] text-neutral-400">{paymentError}</p>
                <button 
                  type="button"
                  onClick={() => setPaymentError(null)}
                  className="text-gold font-mono hover:underline uppercase text-[9px] tracking-widest block pt-1.5"
                >
                  Dismiss Error & Retry Checkout
                </button>
              </div>
            </motion.div>
          )}

          {verifyingPayment && (
            <div className="p-5 bg-gold/5 border border-gold/20 rounded-xl flex items-center justify-center gap-3">
              <span className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-gold font-mono uppercase tracking-widest">Verifying payment token... Please wait</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <input 
                required
                type="email" 
                placeholder="Email Address" 
                className="w-full px-5 py-4 border border-neutral-800 rounded bg-neutral-900/40 text-white placeholder-neutral-500 focus:outline-none focus:border-gold transition-all duration-300 font-sans text-sm"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input 
                  required
                  type="text" 
                  placeholder="Full Name" 
                  className="w-full px-5 py-4 border border-neutral-800 rounded bg-neutral-900/40 text-white placeholder-neutral-500 focus:outline-none focus:border-gold transition-all duration-300 font-sans text-sm"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
                <input 
                  required
                  type="tel" 
                  pattern="[0-9]{10}"
                  maxLength={10}
                  placeholder="10-Digit Mobile Number" 
                  className="w-full px-5 py-4 border border-neutral-800 rounded bg-neutral-900/40 text-white placeholder-neutral-500 focus:outline-none focus:border-gold transition-all duration-300 font-sans text-sm"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <input 
                required
                type="text" 
                placeholder="Shipping Address (India Only)" 
                className="w-full px-5 py-4 border border-neutral-800 rounded bg-neutral-900/40 text-white placeholder-neutral-500 focus:outline-none focus:border-gold transition-all duration-300 font-sans text-sm"
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <input 
                  required
                  type="text" 
                  placeholder="City" 
                  className="w-full px-5 py-4 border border-neutral-800 rounded bg-neutral-900/40 text-white placeholder-neutral-500 focus:outline-none focus:border-gold transition-all duration-300 font-sans text-sm"
                  value={formData.city}
                  onChange={e => setFormData({...formData, city: e.target.value})}
                />
                <div className="relative">
                  <select 
                    required
                    className="w-full px-5 py-4 pr-10 border border-neutral-800 rounded bg-[#101010] text-white focus:outline-none focus:border-gold transition-all duration-300 font-sans text-sm appearance-none cursor-pointer"
                    value={formData.state}
                    onChange={e => setFormData({...formData, state: e.target.value})}
                  >
                    <option value="" disabled className="bg-neutral-950 text-neutral-500">State</option>
                    {[
                      "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", 
                      "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
                      "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", 
                      "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Chandigarh"
                    ].map(st => (
                      <option key={st} value={st} className="bg-neutral-950 text-white">{st}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-neutral-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
                <input 
                  required
                  type="text" 
                  pattern="[0-9]{6}"
                  maxLength={6}
                  placeholder="Pincode (6-digits)" 
                  className="w-full px-5 py-4 border border-neutral-800 rounded bg-neutral-900/40 text-white placeholder-neutral-500 focus:outline-none focus:border-gold transition-all duration-300 font-sans text-sm"
                  value={formData.zip}
                  onChange={e => setFormData({...formData, zip: e.target.value})}
                />
              </div>
            </div>

            <div className="pt-6">
              <h3 className="text-lg font-serif font-bold text-white mb-4">Payment Method</h3>
              <div className="p-5 border border-gold/40 bg-gold/5 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full border-4 border-gold bg-black" />
                  <span className="text-sm font-serif font-medium text-white">Razorpay Secure Gateway</span>
                </div>
                <div className="flex gap-2 items-center text-xs text-neutral-400 font-mono tracking-widest uppercase">
                  <span>INR Supported</span>
                </div>
              </div>
              <p className="text-[10px] text-neutral-500 mt-2 font-mono uppercase tracking-widest">
                Pay instantly via UPI, Netbanking, or Debit/Credit card.
              </p>
            </div>

            <button 
              disabled={isProcessing || verifyingPayment}
              type="submit"
              className="w-full bg-gold hover:bg-white text-black py-4.5 font-mono text-xs font-bold tracking-[0.2em] rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-8 uppercase whitespace-nowrap"
            >
              {isProcessing ? "INITIALIZING SECURE GATEWAY..." : `PROCEED TO PAY — ₹${total.toLocaleString("en-IN")}`}
            </button>
          </form>
        </div>

        <div className="bg-neutral-900/20 border border-neutral-900 p-5 sm:p-8 rounded-2xl h-fit space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-serif font-bold text-white tracking-tight">Order Verification</h2>
            <p className="text-xs text-neutral-500">Curating luxury-inspired statement timepieces.</p>
          </div>
          <div className="space-y-4 max-h-64 overflow-y-auto pr-2 flex-col">
            {items.map(item => (
              <div key={item.id} className="flex justify-between items-center text-sm border-b border-neutral-900/50 pb-3 gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-12 rounded overflow-hidden bg-neutral-950 border border-neutral-800 flex-shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-white font-serif font-medium block truncate">{item.name}</span>
                    <span className="text-[10px] text-neutral-500 font-mono uppercase">QTY: {item.quantity}</span>
                  </div>
                </div>
                <span className="font-mono text-gold font-bold flex-shrink-0">{getFormattedPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="pt-6 border-t border-neutral-900 space-y-4">
            <div className="flex justify-between text-sm items-center gap-2">
              <span className="text-neutral-400 text-xs sm:text-sm">GST Tax Invoice</span>
              <span className="text-neutral-300 font-mono text-xs">18% GST Included</span>
            </div>
            <div className="flex justify-between text-sm items-center gap-2">
              <span className="text-neutral-400 text-xs sm:text-sm">Signature Dispatch</span>
              <span className="text-gold font-mono font-bold uppercase text-[10px] tracking-[0.2em] text-right">FREE IN INDIA</span>
            </div>
            <div className="flex justify-between text-lg font-serif font-bold border-t border-neutral-900/60 pt-4 text-white">
              <span>Grand Total</span>
              <div className="text-right">
                <span className="text-gold font-mono block">₹{total.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Sandbox Modal */}
      <AnimatePresence>
        {isSandboxActive && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-[420px] bg-[#121212] border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col font-sans"
            >
              {/* Header */}
              <div className="p-5 border-b border-neutral-900 bg-[#0a0a0a] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black tracking-tight text-white gap-1 flex items-center">
                      <span className="text-blue-500">★</span> razorpay
                    </span>
                    <span className="bg-red-500/10 text-red-500 border border-red-500/20 text-[8px] font-mono px-2 py-0.5 rounded uppercase tracking-widest font-bold">
                      Sandbox Mode
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400 mt-1 font-mono uppercase tracking-wider">Pingaksh Homage Studio</p>
                </div>
                <button 
                  onClick={() => {
                    setIsSandboxActive(false);
                    setIsProcessing(false);
                    setPaymentError("User exited payment modal.");
                  }}
                  className="p-1 hover:bg-neutral-900 rounded-md text-neutral-400 hover:text-white transition"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-5">
                {/* Total box */}
                <div className="p-4 bg-[#181818] border border-neutral-800 rounded-xl text-center">
                  <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono block mb-1">Simulated Charge</span>
                  <span className="text-2xl font-mono text-white font-bold">₹{total.toLocaleString("en-IN")}</span>
                  <span className="text-[10px] text-neutral-500 font-mono block mt-1">Net Payable Amount in INR</span>
                </div>

                {/* Simulated contacts */}
                <div className="grid grid-cols-2 gap-3 bg-[#161616]/40 p-3 rounded-lg border border-neutral-900 text-[11px] font-mono text-neutral-400">
                  <div className="min-w-0">
                    <span className="text-[9px] text-neutral-600 block uppercase">Client Email</span>
                    <span className="truncate block text-neutral-200">{formData.email || "guest@client.com"}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-neutral-600 block uppercase">Client Phone</span>
                    <span className="block text-neutral-200">9828488365</span>
                  </div>
                </div>

                {/* Tabs */}
                <div className="grid grid-cols-3 gap-1 bg-[#161616] p-1 border border-neutral-900 rounded-lg">
                  <button 
                    type="button"
                    onClick={() => setActiveMockTab('card')}
                    className={cn("py-2 px-2 text-[10px] font-bold tracking-wider rounded font-mono uppercase transition", activeMockTab === 'card' ? "bg-neutral-800 text-gold" : "text-neutral-500 hover:text-neutral-300")}
                  >
                    Card info
                  </button>
                  <button 
                    type="button"
                    onClick={() => setActiveMockTab('upi')}
                    className={cn("py-2 px-2 text-[10px] font-bold tracking-wider rounded font-mono uppercase transition", activeMockTab === 'upi' ? "bg-neutral-800 text-gold" : "text-neutral-500 hover:text-neutral-300")}
                  >
                    UPI ID
                  </button>
                  <button 
                    type="button"
                    onClick={() => setActiveMockTab('net')}
                    className={cn("py-2 px-2 text-[10px] font-bold tracking-wider rounded font-mono uppercase transition", activeMockTab === 'net' ? "bg-neutral-800 text-gold" : "text-neutral-500 hover:text-neutral-300")}
                  >
                    Netbank
                  </button>
                </div>

                {/* Tab Content */}
                <div className="min-h-[110px]">
                  {activeMockTab === 'card' && (
                    <div className="space-y-3">
                      <div className="border border-neutral-800 rounded bg-[#161616] p-3 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono">Simulated Card</p>
                          <p className="font-mono text-sm text-neutral-200 mt-1">4111 • • • • • • • • 1111</p>
                        </div>
                        <CreditCard size={20} className="text-neutral-500" />
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div className="border border-neutral-800 rounded bg-[#161616] p-2.5">
                          <span className="text-[8px] text-neutral-600 block uppercase">Expiry</span>
                          <span className="text-neutral-300">12/29</span>
                        </div>
                        <div className="border border-neutral-800 rounded bg-[#161616] p-2.5">
                          <span className="text-[8px] text-neutral-600 block uppercase">CVV Code</span>
                          <span className="text-neutral-300">•••</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeMockTab === 'upi' && (
                    <div className="space-y-3">
                      <div className="border border-neutral-800 rounded bg-[#161616] p-3 flex items-center gap-3">
                        <Smartphone size={20} className="text-neutral-500 shrink-0" />
                        <div className="w-full">
                          <span className="text-[9px] text-neutral-600 block uppercase font-mono">Simulated UPI Address</span>
                          <input 
                            disabled
                            type="text" 
                            className="bg-transparent border-none p-0 text-xs text-neutral-300 font-mono focus:outline-none w-full"
                            value="pingaksh@oksbi"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 text-[9.5px] font-mono text-neutral-500 justify-center">
                        <span className="px-2 py-1 border border-neutral-800 rounded bg-neutral-900/40">GPay</span>
                        <span className="px-2 py-1 border border-neutral-800 rounded bg-neutral-900/40">PhonePe</span>
                        <span className="px-2 py-1 border border-neutral-800 rounded bg-neutral-900/40">Paytm</span>
                      </div>
                    </div>
                  )}

                  {activeMockTab === 'net' && (
                    <div className="space-y-3 font-mono text-[10.5px]">
                      <span className="text-[9px] text-neutral-600 block uppercase font-mono">Simulate Banking Partner</span>
                      <div className="grid grid-cols-2 gap-2 text-neutral-400">
                        <div className="p-2.5 border border-gold/20 bg-gold/5 rounded text-neutral-200 text-center flex items-center justify-center gap-1.5 cursor-pointer">
                          <Check size={10} className="text-gold" /> State Bank of India
                        </div>
                        <div className="p-2.5 border border-neutral-800 rounded text-center hover:bg-neutral-900 hover:text-white cursor-pointer select-none">
                          HDFC Bank
                        </div>
                        <div className="p-2.5 border border-neutral-800 rounded text-center hover:bg-neutral-900 hover:text-white cursor-pointer select-none">
                          ICICI Bank
                        </div>
                        <div className="p-2.5 border border-neutral-800 rounded text-center hover:bg-neutral-900 hover:text-white cursor-pointer select-none">
                          Axis Bank
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="p-5 border-t border-neutral-900 bg-[#0e0e0e] grid grid-cols-1 gap-2.5">
                <button 
                  onClick={handleSandboxSimulateSuccess}
                  type="button"
                  className="w-full bg-[#10b981] hover:bg-[#059669] text-white py-3.5 font-mono text-xs font-bold tracking-widest uppercase rounded flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Check size={14} /> Simulate Success (Verify)
                </button>
                <button 
                  onClick={handleSandboxSimulateFailure}
                  type="button"
                  className="w-full bg-red-800 hover:bg-red-900 text-white py-3 font-mono text-xs font-bold tracking-widest uppercase rounded flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <X size={14} /> Simulate Declined Payment
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Success = () => {
  const today = new Date();
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
  
  const minDelivery = new Date();
  minDelivery.setDate(today.getDate() + 3);
  
  const maxDelivery = new Date();
  maxDelivery.setDate(today.getDate() + 5);
  
  const formattedDelivery = `${minDelivery.toLocaleDateString("en-IN", options)} - ${maxDelivery.toLocaleDateString("en-IN", options)}`;

  return (
    <div className="pt-40 pb-28 px-6 min-h-screen bg-black flex items-center justify-center text-center">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="max-w-md w-full space-y-8 bg-neutral-900/20 border border-neutral-900 p-8 sm:p-10 rounded-2xl mx-auto"
      >
        <div className="w-20 h-20 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
          <CheckCircle2 size={36} />
        </div>
        <div className="space-y-3">
          <span className="text-gold text-xs font-mono tracking-[0.3em] uppercase block">Acquisition Confirmed</span>
          <h1 className="text-4xl font-serif font-bold text-white tracking-tight font-display">Order Received</h1>
        </div>
        <p className="text-neutral-400 text-sm leading-relaxed max-w-sm mx-auto font-sans">
          Your Pingaksh timepiece registration has been finalized. A verification receipt with delivery details has been dispatched to your email address.
        </p>

        {/* Dynamic delivery box */}
        <div className="p-5 border border-neutral-800/80 bg-neutral-950/60 rounded-xl text-left space-y-3 font-sans">
          <div className="flex items-start gap-3">
            <div className="text-gold shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono font-medium">Estimated Delivery</p>
              <p className="text-sm font-semibold text-white mt-0.5">{formattedDelivery}</p>
              <p className="text-[10px] text-neutral-400 mt-1">Via Secure Handpicked Express Air Cargo</p>
            </div>
          </div>
          <div className="pt-2.5 border-t border-neutral-900/60 flex items-center justify-between text-[11px] font-mono">
            <span className="text-neutral-500 uppercase tracking-wider">Status</span>
            <span className="text-gold uppercase tracking-widest font-bold bg-gold/10 px-2 py-0.5 rounded border border-gold/20">CALIBRATING DISPATCH</span>
          </div>
        </div>

        <Link 
          to="/" 
          className="inline-block w-full bg-gold hover:bg-white text-black py-4 font-mono text-xs font-bold tracking-[0.25em] rounded transition-all uppercase"
        >
          Return to Gallery
        </Link>
      </motion.div>
    </div>
  );
};

const InfoPage = ({ title, content }: { title: string; content: React.ReactNode }) => (
  <div className="pt-48 pb-28 px-6 min-h-screen bg-black">
    <div className="max-w-3xl mx-auto space-y-12">
      <div className="space-y-3">
        <span className="text-gold text-xs font-bold tracking-[0.3em] uppercase block font-mono">Service Dossier</span>
        <h1 className="text-4xl md:text-6xl font-serif font-bold text-white tracking-tight">{title}</h1>
      </div>
      <div className="text-neutral-300 font-light leading-relaxed space-y-6 text-sm md:text-base border-t border-neutral-900 pt-10">
        {content}
      </div>
    </div>
  </div>
);

const SearchOverlay = ({ isOpen, onClose, watches, onAddToCart }: { 
  isOpen: boolean; 
  onClose: () => void; 
  watches: Watch[];
  onAddToCart: (w: Watch) => void;
}) => {
  const [queryText, setQueryText] = useState("");
  const filtered = queryText.length > 1 
    ? watches.filter(w => w.name.toLowerCase().includes(queryText.toLowerCase()))
    : [];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-start pt-20 px-6"
        >
          <button 
            onClick={onClose}
            className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors p-2"
          >
            <X size={32} />
          </button>
          
          <div className="w-full max-w-2xl space-y-12">
            <input 
              autoFocus
              type="text"
              placeholder="SEARCH TIMEPIECES..."
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              className="w-full bg-transparent border-b-2 border-white/10 py-6 text-3xl md:text-5xl font-serif font-bold text-white focus:outline-none focus:border-gold transition-colors text-center"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filtered.map(watch => (
                <div key={watch.id} className="flex gap-4 items-center bg-white/5 p-4 rounded group">
                  <div className="w-16 h-20 overflow-hidden rounded">
                    <img src={watch.image} alt={watch.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-bold">{watch.name}</h3>
                    <p className="text-gold text-sm">{getFormattedPrice(watch.price)}</p>
                    <button 
                      onClick={() => {
                        onAddToCart(watch);
                        onClose();
                      }}
                      className="text-xs text-white/50 hover:text-white mt-2 transition-colors flex items-center gap-1"
                    >
                      ADD TO BAG <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              ))}
              {queryText.length > 1 && filtered.length === 0 && (
                <p className="text-white/30 col-span-full text-center">No results found for "{queryText}"</p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const MobileMenu = ({ isOpen, onClose, user }: { isOpen: boolean; onClose: () => void; user: CustomUser | null }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div 
        initial={{ x: "-100%" }}
        animate={{ x: 0 }}
        exit={{ x: "-100%" }}
        className="fixed inset-0 z-[80] bg-black flex flex-col p-12"
      >
        <button onClick={onClose} className="absolute top-8 right-8 text-white p-2">
          <X size={32} />
        </button>
        
        <div className="flex flex-col gap-8 mt-20">
          <Link to="/" onClick={onClose} className="text-4xl font-serif font-bold text-white hover:text-gold">HOME</Link>
          <Link to="/shop" onClick={onClose} className="text-4xl font-serif font-bold text-white hover:text-gold">SHOP</Link>
          <Link to="/about" onClick={onClose} className="text-4xl font-serif font-bold text-white hover:text-gold">ABOUT</Link>
          <Link 
            to={!user ? "/login" : (user.email === "chanchaltailor404@gmail.com" ? "/admin" : "/profile")} 
            onClick={onClose} 
            className="text-4xl font-serif font-bold text-white hover:text-gold"
          >
            {user ? (user.email === "chanchaltailor404@gmail.com" ? "DASHBOARD" : "PROFILE") : "LOGIN"}
          </Link>
        </div>
        
        <div className="mt-auto space-y-8">
          <div className="flex gap-6 text-white/40">
            <Instagram size={24} />
            <Facebook size={24} />
            <Twitter size={24} />
          </div>
          <p className="text-white/30 text-sm italic">Crafting moments of elegant style.</p>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

const PremiumLoader = ({ onComplete }: { onComplete: () => void; key?: string }) => {
  const onCompleteRef = React.useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onCompleteRef.current();
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="fixed inset-0 z-[999] bg-black flex flex-col items-center justify-center p-6 text-center select-none"
    >
      <div className="space-y-8 max-w-md">
        <motion.div
          initial={{ letterSpacing: "0.1em", opacity: 0, y: 30 }}
          animate={{ letterSpacing: "0.35em", opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="text-white text-4xl md:text-6xl font-serif font-bold tracking-[0.35em]"
        >
          PINGAKSH
        </motion.div>
        
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "140px" }}
          transition={{ delay: 0.4, duration: 0.8, ease: "easeInOut" }}
          className="h-[1px] bg-gold mx-auto"
        />

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="text-white/50 text-[10px] tracking-[0.3em] font-mono uppercase"
        >
          The Calibre of High Stature
        </motion.p>
      </div>
    </motion.div>
  );
};

const getSpecifications = (watch: Watch) => {
  if (watch.name.toLowerCase().includes("gold") || watch.id === "1") {
    return [
      { label: "Movement", value: "Hand-Assembled Swiss Quartz Calibre" },
      { label: "Water Resistance", value: "5 ATM (50 Meters / 165 Feet)" },
      { label: "Dial Core", value: "Curved Arc Sapphire Crystal Lens" },
      { label: "Case Profile", value: "40mm 316L Surgical Stainless Steel, 18k Gold Finish" },
      { label: "Strap Material", value: "Polished Stainless Steel Gold Link Bracelet" },
    ];
  } else if (watch.name.toLowerCase().includes("chrono") || watch.id === "2") {
    return [
      { label: "Movement", value: "Calibre-S Precision Chronograph Movement" },
      { label: "Water Resistance", value: "10 ATM (100 Meters / 330 Feet)" },
      { label: "Dial Core", value: "Vaulted High-Density Sapphire Core" },
      { label: "Case Profile", value: "42mm Liquid Matt Coal Steel, Polished Bezel" },
      { label: "Strap Material", value: "Anti-corrosive Premium Silicon Sport Strap" },
    ];
  } else if (watch.name.toLowerCase().includes("nordic") || watch.id === "3") {
    return [
      { label: "Movement", value: "High-Accuracy Slimline Japanese Calibre" },
      { label: "Water Resistance", value: "3 ATM (30 Meters / 100 Feet)" },
      { label: "Dial Core", value: "Flat-Spun Sapphire Crystal Dial Face" },
      { label: "Case Profile", value: "38mm Brushed Platinum-Finish Alloy, Fine Lug Details" },
      { label: "Strap Material", value: "Suede-backed Genuine Italian Nubuck Leather" },
    ];
  } else if (watch.name.toLowerCase().includes("heritage") || watch.id === "4") {
    return [
      { label: "Movement", value: "Tourbillon Mechanical Manual-Winding Calibre" },
      { label: "Water Resistance", value: "5 ATM (50 Meters / 165 Feet)" },
      { label: "Dial Core", value: "High-Definition anti-reflective Mineral Crystal" },
      { label: "Case Profile", value: "41mm Vintage Bronze-Plated Architectural Core" },
      { label: "Strap Material", value: "Full-Grain Italian Calfskin Leather with gold lining" },
    ];
  } else {
    return [
      { label: "Movement", value: "Self-Winding Japanese Automatic Movement" },
      { label: "Water Resistance", value: "10 ATM (100 Meters / 330 Feet)" },
      { label: "Dial Core", value: "Anti-Reflective Double-Vaulted Sapphire Dial" },
      { label: "Case Profile", value: "40mm Solid Surgical Steel Construction" },
      { label: "Strap Material", value: "Adjustable Double-Locking Deployant Safety Clasp" },
    ];
  }
};

const WatchDetailModal = ({ 
  watch, 
  onClose, 
  onAddToCart,
  wishlist,
  onToggleWishlist,
  cart = [],
  onUpdateQty
}: { 
  watch: Watch | null; 
  onClose: () => void; 
  onAddToCart: (w: Watch) => void;
  wishlist: string[];
  onToggleWishlist: (id: string) => void;
  cart?: CartItem[];
  onUpdateQty?: (id: string, delta: number) => void;
}) => {
  const [activeIdx, setActiveIdx] = useState(0);

  if (!watch) return null;

  const galleryImages = getProductGallery(watch);
  const specs = getSpecifications(watch);
  const isLiked = wishlist.includes(watch.id);
  const inCartItem = cart.find(item => item.id === watch.id);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 overflow-y-auto">
        {/* Backdrop overlay */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/90 backdrop-blur-md"
        />

        {/* Modal content box */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 30 }}
          transition={{ type: "spring", damping: 25, stiffness: 220 }}
          className="relative w-full max-w-4xl bg-neutral-950 border border-neutral-900 rounded-2xl overflow-hidden shadow-2xl z-10 flex flex-col md:flex-row my-auto max-h-[90vh] md:max-h-none overflow-y-auto md:overflow-y-visible"
        >
          {/* Close button top right */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-30 p-2.5 rounded-full bg-black/80 border border-neutral-800 text-neutral-400 hover:text-white hover:border-gold/40 hover:scale-105 transition-all duration-300"
            aria-label="Close details"
          >
            <X size={18} />
          </button>

          {/* Left panel: Watch image and multiple gallery */}
          <div className="w-full md:w-1/2 flex flex-col bg-neutral-950 border-r border-neutral-900/60 max-h-[350px] md:max-h-none">
            <div className="relative flex-grow aspect-[4/5] overflow-hidden bg-neutral-950">
              <img 
                src={galleryImages[activeIdx] || watch.image} 
                alt={watch.name} 
                className="w-full h-full object-cover transition-all duration-[600ms]"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-black/20" />
              <span className="absolute bottom-4 left-4 bg-gold/10 text-gold text-[9px] font-mono font-bold px-3 py-1.5 tracking-[0.2em] rounded-sm uppercase border border-gold/20">
                {watch.category} Edition
              </span>
            </div>
            
            {/* Gallery Selector at the bottom of left panel */}
            {galleryImages.length > 1 && (
              <div className="p-4 bg-neutral-950/90 border-t border-neutral-900/40 flex items-center gap-2 overflow-x-auto select-none">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveIdx(idx)}
                    className={cn(
                      "w-12 h-15 rounded overflow-hidden bg-neutral-900 border transition-all duration-300 flex-shrink-0 cursor-pointer",
                      activeIdx === idx 
                        ? "border-gold scale-[1.05]" 
                        : "border-neutral-800 opacity-60 hover:opacity-100"
                    )}
                  >
                    <img 
                      src={img} 
                      alt="gallery thumb" 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right panel: Details & Specifications & Logistics */}
          <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between space-y-6 overflow-y-auto max-h-[50vh] md:max-h-[650px]">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gold text-[10px] font-mono tracking-[0.3em] font-bold block uppercase">PINGAKSH EXQUISITE</span>
                <span className={cn("text-[8px] font-mono font-semibold px-2 py-0.5 rounded border uppercase tracking-widest", getStockStatus(watch.id).color)}>
                  {getStockStatus(watch.id).label}
                </span>
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl md:text-3xl font-serif font-bold text-white tracking-tight leading-snug">{watch.name}</h2>
                <div className="flex items-baseline gap-3 mt-1.5">
                  <p className="text-xl font-bold text-gold font-sans">{getFormattedPrice(watch.price)}</p>
                </div>
              </div>

              <div className="w-12 h-[1px] bg-gold" />

              <p className="text-neutral-300 text-xs md:text-sm leading-relaxed font-light">
                {watch.description || "Individually hand-assembled and meticulously calibrated. This masterpiece pairs aesthetic luxury with robust mechanics, designed specifically for those with ambitious taste."}
              </p>
            </div>

            {/* Specifications matrix */}
            <div className="space-y-3">
              <h3 className="text-white text-[10px] font-mono font-bold tracking-[0.2em] uppercase border-b border-neutral-900 pb-2">Technical Specifications</h3>
              <div className="divide-y divide-neutral-900 text-xs text-neutral-400 font-mono">
                {specs.map((spec, i) => (
                  <div key={i} className="py-2 flex justify-between gap-4">
                    <span className="text-neutral-500 text-[9px] tracking-wide uppercase">{spec.label}</span>
                    <span className="text-white text-right text-[11px] font-light">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping & Warranty Info inside simple compact grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-neutral-900 text-[11px]">
              <div className="space-y-1 font-sans">
                <div className="flex items-center gap-1.5 text-gold font-mono text-[9px] tracking-wider uppercase font-bold">
                  <Truck size={12} />
                  <span>Pan-India Delivery</span>
                </div>
                <p className="text-neutral-400 leading-relaxed font-light">
                  Bespoke insured speed transport inside India, dispatched securely within 24 hours.
                </p>
              </div>
              
              <div className="space-y-1 font-sans">
                <div className="flex items-center gap-1.5 text-gold font-mono text-[9px] tracking-wider uppercase font-bold">
                  <ShieldCheck size={12} />
                  <span>1-Year Warranty</span>
                </div>
                <p className="text-neutral-400 leading-relaxed font-light">
                  Covers hand-alignments, counterweights, gaskets, and core mechanical calibration errors.
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-4 border-t border-neutral-900 flex flex-col sm:flex-row gap-3">
              {inCartItem && onUpdateQty ? (
                <div className="flex-1 flex items-center justify-between border border-gold/40 bg-gold/5 rounded-sm overflow-hidden text-gold font-mono p-1">
                  <button 
                    onClick={() => onUpdateQty(watch.id, -1)}
                    className="px-4 py-2 hover:bg-gold hover:text-black transition-colors text-gold text-sm font-bold active:scale-95"
                  >
                    -
                  </button>
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold tracking-wider uppercase font-mono text-gold">
                      {inCartItem.quantity} in Bag
                    </span>
                    <span className="text-[9px] text-neutral-400 font-mono tracking-wider">
                      {getFormattedPrice(watch.price * inCartItem.quantity)}
                    </span>
                  </div>
                  <button 
                    onClick={() => onUpdateQty(watch.id, 1)}
                    className="px-4 py-2 hover:bg-gold hover:text-black transition-colors text-gold text-sm font-bold active:scale-95"
                  >
                    +
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => {
                    onAddToCart(watch);
                  }}
                  className="flex-1 bg-gold hover:bg-white text-black py-4 text-xs font-mono font-bold tracking-[0.2em] transition-all duration-300 uppercase rounded-sm flex items-center justify-center gap-2 shadow-lg shadow-gold/5"
                >
                  Acquire Series — {getFormattedPrice(watch.price)}
                </button>
              )}
              <button 
                onClick={() => onToggleWishlist(watch.id)}
                className="bg-transparent border border-neutral-800 hover:border-gold hover:text-white text-neutral-400 px-6 py-4 text-xs font-mono font-bold tracking-[0.2em] transition-all duration-300 uppercase rounded-sm flex items-center justify-center gap-2"
              >
                <Heart size={14} className={cn("transition-colors", isLiked ? "fill-red-500 text-red-500" : "text-neutral-400")} />
                {isLiked ? "Wishlisted" : "Wishlist"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

const getProductGallery = (watch: Watch) => {
  const base = watch.image;
  const list: string[] = [base];
  if (watch.name.toLowerCase().includes("gold") || watch.id === "1") {
    list.push(
      "https://images.unsplash.com/photo-1619134778706-7015533a6150?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1434056886845-dac89ffee9b5?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&q=80&w=800"
    );
  } else if (watch.name.toLowerCase().includes("chrono") || watch.id === "2") {
    list.push(
      "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1434056886845-dac89ffee9b5?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&q=80&w=800"
    );
  } else if (watch.name.toLowerCase().includes("nordic") || watch.id === "3") {
    list.push(
      "https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1434056886845-dac89ffee9b5?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&q=80&w=800"
    );
  } else if (watch.name.toLowerCase().includes("heritage") || watch.id === "4") {
    list.push(
      "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1434056886845-dac89ffee9b5?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&q=80&w=800"
    );
  } else {
    list.push(
      "https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1434056886845-dac89ffee9b5?auto=format&fit=crop&q=80&w=800"
    );
  }
  return list;
};

interface ProductPageProps {
  onAddToCart: (w: Watch) => void;
  watches: Watch[];
  wishlist: string[];
  onToggleWishlist: (id: string) => void;
  cart?: CartItem[];
  onUpdateQty?: (id: string, delta: number) => void;
}

const ProductPage = ({ 
  onAddToCart, 
  watches,
  wishlist,
  onToggleWishlist,
  cart = [],
  onUpdateQty
}: ProductPageProps) => {
  const { id } = useParams<{ id: string }>();

  const [product, setProduct] = useState<Watch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const [zoomStyle, setZoomStyle] = useState({});
  const [localReviews, setLocalReviews] = useState<any[]>([]);

  const [revName, setRevName] = useState("");
  const [revRating, setRevRating] = useState(5);
  const [revComment, setRevComment] = useState("");
  const [revSuccess, setRevSuccess] = useState(false);

  // States for Pre-Cart Quantity
  const [quantity, setQuantity] = useState(1);

  // Reset scroll to top when page changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // Dynamic products loader
  useEffect(() => {
    let active = true;
    const fetchProduct = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const dbProd = await getSupabaseProductById(id);
        if (!active) return;
        if (dbProd) {
          const loadedProduct: Watch = {
            id: dbProd.id,
            name: dbProd.name,
            price: dbProd.price,
            image: dbProd.image,
            category: dbProd.category,
            description: dbProd.description,
            created_at: dbProd.created_at
          };
          setProduct(loadedProduct);
        } else {
          // Fallback to parents
          const matched = watches.find(w => w.id === id) || WATCHES.find(w => w.id === id);
          setProduct(matched || null);
        }
      } catch (err) {
        console.error("Failed inside product details lookup:", err);
        const matched = watches.find(w => w.id === id) || WATCHES.find(w => w.id === id);
        setProduct(matched || null);
      } finally {
        if (active) {
          setIsLoading(false);
          setActiveIdx(0); // Reset gallery active page
        }
      }
    };
    fetchProduct();
    return () => {
      active = false;
    };
  }, [id, watches]);

  const existingCartItem = product ? cart.find(item => item.id === product.id) : null;

  // Sync state quantity to current cart if loaded
  useEffect(() => {
    if (existingCartItem) {
      setQuantity(existingCartItem.quantity);
    } else {
      setQuantity(1);
    }
  }, [existingCartItem?.quantity, product?.id]);

  // Load reviews client-side
  useEffect(() => {
    if (!product) return;
    try {
      const saved = localStorage.getItem(`pingaksh_reviews_${product.id}`);
      if (saved) {
        setLocalReviews(JSON.parse(saved));
      } else {
        setLocalReviews([
          {
            id: "r1",
            name: "Siddharth Sharma",
            rating: 5,
            date: "May 18, 2026",
            verified: true,
            comment: "Truly stellar craft. Every link on the strap fits flawlessly, and the accuracy is immaculate. Exceeded all my expectations. The movement is robustly heavy and silent."
          },
          {
            id: "r2",
            name: "Priya Patel",
            rating: 5,
            date: "May 12, 2026",
            verified: true,
            comment: "The glass sapphire finish is of outstanding quality. I have received countless compliments already inside my corporate firm. An absolute showstopper of a dial!"
          },
          {
            id: "r3",
            name: "Amit Deshmukh",
            rating: 4,
            date: "April 29, 2026",
            verified: true,
            comment: "Very sleek and heavy-built weight. Feels premium on hand operations. Shipping charges applied since it was India speed-delivery, but totally worth the insurance."
          }
        ]);
      }
    } catch {
      setLocalReviews([]);
    }
  }, [product?.id]);

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !revName.trim() || !revComment.trim()) return;

    const newRev = {
      id: "r_user_" + Date.now(),
      name: revName,
      rating: revRating,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      verified: true,
      comment: revComment
    };

    const updated = [newRev, ...localReviews];
    setLocalReviews(updated);
    try {
      localStorage.setItem(`pingaksh_reviews_${product.id}`, JSON.stringify(updated));
    } catch (err) {
      console.error("Local storage sync error", err);
    }

    setRevName("");
    setRevRating(5);
    setRevComment("");
    setRevSuccess(true);
    setTimeout(() => setRevSuccess(false), 4000);
  };

  const avgRating = localReviews.length > 0 
    ? (localReviews.reduce((sum, r) => sum + r.rating, 0) / localReviews.length).toFixed(1)
    : "5.0";

  if (isLoading) {
    return (
      <div className="pt-32 pb-24 text-neutral-100 max-w-7xl mx-auto px-4 md:px-8 space-y-16 animate-pulse">
        {/* Breadcrumb skeleton */}
        <div className="h-4 bg-neutral-900 rounded w-40" />

        {/* Core Layout Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Gallery Skeleton */}
          <div className="lg:col-span-7 flex flex-col md:flex-row-reverse gap-4">
            <div className="w-full aspect-[4/5] bg-neutral-900 rounded-2xl" />
            <div className="flex md:flex-col gap-3 min-w-[80px]">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-20 aspect-[4/5] bg-neutral-900 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>

          {/* Details Skeleton */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              <div className="h-4 bg-neutral-900 rounded w-32" />
              <div className="h-10 bg-neutral-900 rounded w-3/4" />
              <div className="h-6 bg-neutral-900 rounded w-1/4" />
              <div className="w-16 h-0.5 bg-neutral-900" />
              <div className="space-y-2">
                <div className="h-4 bg-neutral-900 rounded w-full" />
                <div className="h-4 bg-neutral-900 rounded w-5/6" />
                <div className="h-4 bg-neutral-900 rounded w-2/3" />
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-neutral-900">
              <div className="h-4 bg-neutral-900 rounded w-1/2" />
              <div className="space-y-2">
                <div className="h-3 bg-neutral-900 rounded w-full" />
                <div className="h-3 bg-neutral-900 rounded w-full" />
              </div>
            </div>

            <div className="pt-6 border-t border-neutral-900 flex gap-4">
              <div className="h-12 bg-neutral-900 rounded flex-1" />
              <div className="h-12 bg-neutral-900 rounded w-32" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pt-40 pb-32 text-center max-w-md mx-auto px-6 space-y-6">
        <h1 className="text-3xl font-serif font-bold text-white tracking-tight">Timepiece Not Found</h1>
        <p className="text-neutral-500 text-sm">We are unable to locate the designated horological specimen inside our current inventory archives.</p>
        <Link to="/shop" className="inline-block bg-gold hover:bg-white text-black text-xs font-mono font-bold tracking-[0.2em] px-8 py-4 transition-all duration-300 uppercase rounded-sm">
          Return to Catalogue
        </Link>
      </div>
    );
  }

  const galleryImages = getProductGallery(product);
  const specs = getSpecifications(product);
  const isLiked = wishlist.includes(product.id);
  const stockInfo = getStockStatus(product.id);

  // States for Image Zoom
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      transformOrigin: `${x}% ${y}%`,
      transform: "scale(1.8)"
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({
      transformOrigin: "center center",
      transform: "scale(1)"
    });
  };

  // Similar products section: filter matches categories, remove current watch
  const similarProducts = (watches.length > 0 ? watches : WATCHES)
    .filter(w => w.id !== product.id)
    .sort((a, b) => {
      // Prioritize same category match
      const aMatch = a.category === product.category ? 1 : 0;
      const bMatch = b.category === product.category ? 1 : 0;
      return bMatch - aMatch;
    })
    .slice(0, 4);

  // Determine dynamic shipping rate display according to watch price class
  const getDynamicShippingChargesText = (price: number) => {
    if (price >= 300) {
      return "₹450 Speed Cargo (Premium Insured)";
    } else if (price >= 200) {
      return "₹350 Insured Speed (Standard Insured Air)";
    } else {
      return "₹250 Secure Ground (Safe Ground Carrier)";
    }
  };

  return (
    <div className="pt-32 pb-24 text-neutral-100 max-w-7xl mx-auto px-4 md:px-8 space-y-16">
      {/* Return to catalogue link */}
      <div>
        <Link 
          to="/shop" 
          className="text-xs font-mono font-bold tracking-[0.25em] text-neutral-400 hover:text-gold flex items-center gap-2 transition-all duration-300 group inline-flex"
        >
          <ArrowRight size={14} className="transform rotate-180 transition-transform group-hover:-translate-x-1" /> RETURN TO CATALOGUE
        </Link>
      </div>

      {/* Main product presentation layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        {/* Left Side: Product Images Gallery (6cols in grid layout) */}
        <div className="lg:col-span-7 flex flex-col md:flex-row-reverse gap-4">
          {/* Main Showcase Panel with zoom on hover */}
          <div className="w-full flex-1 aspect-[4/5] bg-neutral-950 border border-neutral-900 rounded-2xl overflow-hidden relative group/zoom cursor-zoom-in">
            <div 
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="w-full h-full relative overflow-hidden flex items-center justify-center p-2"
            >
              <img 
                src={galleryImages[activeIdx] || product.image} 
                alt={`${product.name} detail`} 
                onError={(e) => {
                  e.currentTarget.src = "https://images.unsplash.com/photo-1524592091214-8c97af1c0db4?auto=format&fit=crop&q=80&w=800";
                }}
                style={zoomStyle}
                className="w-full h-full object-cover transition-transform duration-100 ease-out"
                referrerPolicy="no-referrer"
              />
            </div>
            
            {/* Custom overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
            <span className="absolute bottom-6 left-6 bg-gold/10 text-gold text-[9px] font-mono font-bold px-3 py-1.5 tracking-[0.2em] rounded-sm uppercase border border-gold/20 pointer-events-none select-none">
              Hover to Zoom Calibre
            </span>
          </div>

          {/* Thumbnails rail (Vertical layout on md devices, Horizontal on mobile) */}
          <div className="flex md:flex-col gap-3 min-w-[80px] md:max-w-[100px] overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 select-none">
            {galleryImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIdx(idx)}
                className={cn(
                  "w-20 md:w-full aspect-[4/5] rounded-lg overflow-hidden bg-neutral-950 border transition-all duration-300 flex-shrink-0 cursor-pointer",
                  activeIdx === idx 
                    ? "border-gold scale-[1.03] shadow-md shadow-gold/5" 
                    : "border-neutral-900 hover:border-neutral-700 opacity-60 hover:opacity-100"
                )}
              >
                <img 
                  src={img} 
                  alt="thumbnail tool" 
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1524592091214-8c97af1c0db4?auto=format&fit=crop&q=80&w=800";
                  }}
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Product Details & Specs Info (5cols in layout) */}
        <div className="lg:col-span-5 space-y-8">
          <div className="space-y-4">
            <span className="text-gold text-[10px] font-mono tracking-[0.3em] font-bold block uppercase pb-1">PINGAKSH HOMAGE STUDIO</span>
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-neutral-400 text-[10px] font-mono tracking-widest uppercase border border-neutral-900 px-2 py-0.5 rounded bg-neutral-950/40">
                  {product.category}
                </span>
                <span className={cn("text-[8.5px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-widest", stockInfo.color)}>
                  {stockInfo.label}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-white tracking-tight leading-none pt-1">{product.name}</h1>
              <div className="flex items-center gap-3">
                <span className="text-xl font-bold text-gold font-sans">{getFormattedPrice(product.price)}</span>
                <span className="text-neutral-600 font-sans text-xs flex mt-1">|</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="flex gap-0.5 text-gold">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        size={12} 
                        className={cn(star <= Math.round(Number(avgRating)) ? "fill-gold text-gold" : "text-neutral-800")} 
                      />
                    ))}
                  </div>
                  <span className="text-[11px] font-mono text-neutral-400">({localReviews.length} verified thoughts)</span>
                </div>
              </div>
            </div>

            <div className="w-16 h-[2px] bg-gold" />

            <p className="text-neutral-300 text-sm leading-relaxed font-light">
              {product.description || "Individually hand-assembled and meticulously calibrated. This masterpiece pairs aesthetic luxury with robust mechanics, designed specifically for those with ambitious taste."}
            </p>
          </div>

          {/* Quick Specifications list */}
          <div className="space-y-4 pt-2 border-t border-neutral-900/40">
            <h3 className="text-neutral-400 text-[10px] font-mono font-bold tracking-[0.2em] uppercase">Core Mechanical Configuration</h3>
            <div className="grid grid-cols-1 divide-y divide-neutral-900/60 font-mono text-xs">
              {specs.slice(0, 3).map((spec, i) => (
                <div key={i} className="py-2.5 flex justify-between gap-4">
                  <span className="text-neutral-500 text-[9px] uppercase tracking-wider">{spec.label}</span>
                  <span className="text-white text-right font-light text-[11px]">{spec.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Interaction Row (Add to Cart, Wishlist, Quantity selector) */}
          <div className="pt-6 border-t border-neutral-900/45 flex flex-col md:flex-row gap-4 items-stretch">
            {existingCartItem && onUpdateQty ? (
              <div className="flex-1 flex items-center justify-between border border-gold/40 bg-gold/5 rounded-sm overflow-hidden text-white font-mono p-1">
                <button 
                  onClick={() => {
                    if (onUpdateQty) onUpdateQty(product.id, -1);
                  }}
                  className="px-5 py-3.5 hover:bg-gold hover:text-black transition-colors text-gold text-sm font-bold active:scale-95 cursor-pointer"
                >
                  -
                </button>
                <div className="flex flex-col items-center select-none text-center">
                  <span className="text-[10px] font-bold tracking-widest text-gold font-mono uppercase">
                    {existingCartItem.quantity} in bag
                  </span>
                  <span className="text-[9px] text-neutral-400 font-mono tracking-wider">
                    {getFormattedPrice(product.price * existingCartItem.quantity)}
                  </span>
                </div>
                <button 
                  onClick={() => {
                    if (onUpdateQty) onUpdateQty(product.id, 1);
                  }}
                  className="px-5 py-3.5 hover:bg-gold hover:text-black transition-colors text-gold text-sm font-bold active:scale-95 cursor-pointer"
                >
                  +
                </button>
              </div>
            ) : (
              <div className="flex flex-1 gap-3 items-stretch">
                {/* Quantity selector */}
                <div className="flex items-center border border-neutral-900 rounded-sm bg-neutral-950/60 px-3 font-mono gap-3 select-none">
                  <button 
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    className="w-6 h-full flex items-center justify-center hover:text-gold text-neutral-500 disabled:text-neutral-800 disabled:hover:text-neutral-800 text-sm transition-colors font-bold cursor-pointer"
                  >
                    -
                  </button>
                  <span className="text-white text-xs font-bold w-5 text-center">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(q => q + 1)}
                    className="w-6 h-full flex items-center justify-center hover:text-gold text-neutral-500 text-sm transition-colors font-bold cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={() => {
                    onAddToCart(product);
                    if (quantity > 1 && onUpdateQty) {
                      onUpdateQty(product.id, quantity - 1);
                    }
                  }}
                  className="flex-1 bg-gold hover:bg-white text-black py-4 font-mono font-bold tracking-[0.15em] transition-all duration-300 text-[11px] uppercase rounded-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-gold/10 cursor-pointer"
                >
                  Acquire Series — {getFormattedPrice(product.price * quantity)}
                </button>
              </div>
            )}
            
            <button
              onClick={() => onToggleWishlist(product.id)}
              className="bg-transparent border border-neutral-900 hover:border-gold hover:text-white text-neutral-400 hover:scale-[1.02] active:scale-[0.98] px-6 py-4 text-xs font-mono font-bold tracking-[0.2em] transition-all duration-300 uppercase rounded-sm flex items-center justify-center gap-2 cursor-pointer"
              aria-label={isLiked ? "Retract from wishlist" : "Secure to wishlist"}
            >
              <Heart size={14} className={cn("transition-colors", isLiked ? "fill-red-500 text-red-500" : "text-neutral-500")} />
              {isLiked ? "Secured" : "Wishlist"}
            </button>
          </div>

          {/* Highlights grids of concerns (Shipping, Warranty) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 text-xs text-neutral-400">
            <div className="p-4 bg-neutral-950/40 border border-neutral-900 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-gold">
                <Truck size={14} />
                <span className="font-mono font-bold uppercase tracking-wider text-[10px]">India Carrier Logistics</span>
              </div>
              <p className="text-[11px] font-sans leading-relaxed text-neutral-400">
                Delivery operations are exclusive to **India**. Secure transit rates of **{getDynamicShippingChargesText(product.price)}** calculated relative to item insurance.
              </p>
            </div>

            <div className="p-4 bg-neutral-950/40 border border-neutral-900 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-gold">
                <ShieldCheck size={14} />
                <span className="font-mono font-bold uppercase tracking-wider text-[10px]">Committed Warranty</span>
              </div>
              <p className="text-[11px] font-sans leading-relaxed text-neutral-400">
                Backed by our certified **1-Year Manufacturer Warranty** guarding internal mechanical movements, sapphire alignment, and calibration.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Policy documentation: India Logistics and 1 Year technical Warranty details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-neutral-900/60 pt-16">
        {/* Logistics Detail Box */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 text-white">
            <div className="w-1.5 h-1.5 bg-gold rounded-full" />
            <h3 className="text-lg font-serif font-bold tracking-wide">Shipping & Logistics Information</h3>
          </div>
          <div className="bg-neutral-950/30 p-6 border border-neutral-900/80 rounded-2xl text-xs space-y-4 text-neutral-400 font-sans leading-relaxed">
            <p>
              Pingaksh serves the domestic Indian market exclusively with a focus on iconic watch styles. We take severe precautions to ensure your luxury-inspired statement timepiece traverses regional limits with the absolute highest standard of care and trackable protection.
            </p>
            <ul className="list-disc pl-5 space-y-2 font-mono text-[11px] text-neutral-300">
              <li><strong>Domestic Scope:</strong> Delivery operations are inside <strong>India</strong> only. All major cities, metro jurisdictions, and remote states with verified pincodes are covered securely.</li>
              <li><strong>Dynamic Rate Allocation:</strong> Custom shipping charges apply dynamically according to the price metrics and material weight of the purchased item:
                <ul className="list-circle pl-5 mt-1 space-y-1">
                  <li>Value up to ₹12,000: Ground Carrier safe delivery - <strong>₹250 flat fee</strong></li>
                  <li>Value ₹12,000 to ₹22,000: Expedited Express Air delivery - <strong>₹350 flat fee</strong></li>
                  <li>Value above ₹22,000: Bespoke Premium Protected Speed Cargo - <strong>₹450 flat fee</strong></li>
                </ul>
              </li>
              <li><strong>Sealed Presentation:</strong> Shipped in vacuum-sealed moisture-proof high tension containers enclosing our signature leather Presentation Box.</li>
            </ul>
          </div>
        </div>

        {/* Technical Warranty Box */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 text-white">
            <div className="w-1.5 h-1.5 bg-gold rounded-full" />
            <h3 className="text-lg font-serif font-bold tracking-wide">1-Year Manufacturer Warranty Statement</h3>
          </div>
          <div className="bg-neutral-950/30 p-6 border border-neutral-900/80 rounded-2xl text-xs space-y-4 text-neutral-400 font-sans leading-relaxed">
            <p>
              Your Pingaksh luxury-inspired statement timepiece serves as a testament to precision style and beautiful engineering. It has undergone multiple rounds of calibrated inspection under dry pressurized testing parameters.
            </p>
            <ul className="list-disc pl-5 space-y-2 font-mono text-[11px] text-neutral-300">
              <li><strong>Warranty Cover Duration:</strong> Active technical warranty of <strong>1 Year</strong> following the dynamic checkout date from our servers.</li>
              <li><strong>Secured coverage:</strong>
                <ul className="list-circle pl-5 mt-1 space-y-1">
                  <li>Anomalous quartz crystal oscillator/automatic counterweight timing failures (&gt;15s deviation)</li>
                  <li>Physical hand alignments, internal indices slippages, and crown operation cracks</li>
                  <li>Gasket/O-Ring waterproofing seal failures under certified Atmosphere depth specifications</li>
                </ul>
              </li>
              <li><strong>Exclusions:</strong> Wear-and-tear of leather straps, deliberate user core drops, and servicing performed by uncertified local repair centers.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Review Section */}
      <div className="border-t border-neutral-900/60 pt-16 space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h3 className="text-2xl font-serif font-bold text-white tracking-snug">Client Reflections</h3>
            <p className="text-neutral-400 text-xs">Meticulous verified feedback from our style-conscious client base.</p>
          </div>
          <div className="flex items-center gap-4 bg-neutral-950 p-4 border border-neutral-900 rounded-2xl">
            <div className="text-3xl font-serif font-bold text-gold">{avgRating}</div>
            <div className="space-y-0.5">
              <div className="flex gap-0.5 text-gold">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    size={13} 
                    className={cn(star <= Math.round(Number(avgRating)) ? "fill-gold text-gold" : "text-neutral-800")} 
                  />
                ))}
              </div>
              <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest">Aggregate Rating Score</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Reviews list (7cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="divide-y divide-neutral-900/80 text-sm">
              {localReviews.length === 0 ? (
                <p className="py-6 text-neutral-500 text-xs italic">No reviews have been written for this timepiece. Be the first to express client thoughts.</p>
              ) : (
                localReviews.map((rev) => (
                  <div key={rev.id} className="py-6 first:pt-0 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-serif font-bold text-white text-sm">{rev.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star 
                                key={star} 
                                size={11} 
                                className={cn(star <= rev.rating ? "fill-gold text-gold" : "text-neutral-800")} 
                              />
                            ))}
                          </div>
                          {rev.verified && (
                            <span className="text-[9px] font-mono bg-white/10 text-white px-2 py-0.5 rounded-xs select-none uppercase tracking-widest text-[8px] font-bold">Verified</span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-neutral-500">{rev.date}</span>
                    </div>
                    <p className="text-neutral-400 font-light text-xs leading-relaxed">{rev.comment}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Form to leave a review (5cols) */}
          <div className="lg:col-span-5 bg-neutral-950/40 p-6 md:p-8 border border-neutral-900 rounded-2xl space-y-6">
            <div className="space-y-1">
              <h4 className="text-base font-serif font-bold text-white">Record Your Acquisition Thoughts</h4>
              <p className="text-neutral-500 text-[11px] leading-relaxed">Share your calibrated experience with the Pingaksh watchmaking community.</p>
            </div>

            {revSuccess && (
              <div className="p-4 bg-emerald-950/40 border border-emerald-900/60 rounded-xl flex items-center gap-3 text-emerald-400 text-xs">
                <CheckCircle2 size={16} />
                <span>Your reflection has been authenticated and appended to reviews.</span>
              </div>
            )}

            <form onSubmit={handleAddReview} className="space-y-4 text-xs font-mono">
              <div className="space-y-1.5">
                <label className="text-neutral-400 text-[10px] tracking-wider uppercase">Name / Signature</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Vikram S." 
                  value={revName}
                  onChange={(e) => setRevName(e.target.value)}
                  className="w-full bg-black/50 border border-neutral-900 rounded px-4 py-3 placeholder:text-neutral-700 text-white focus:outline-none focus:border-gold/50 text-xs tracking-wide"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-neutral-400 text-[10px] tracking-wider uppercase block">Calibre Rating</label>
                <div className="flex gap-1.5 py-1">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      type="button"
                      key={score}
                      onClick={() => setRevRating(score)}
                      className="text-neutral-600 hover:text-gold hover:scale-110 active:scale-95 transition-all p-0.5 cursor-pointer"
                    >
                      <Star 
                        size={20} 
                        className={cn("transition-colors", score <= revRating ? "fill-gold text-gold" : "text-neutral-800")} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-neutral-400 text-[10px] tracking-wider uppercase">Comment / Experience Log</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Describe timing precision, aesthetic weight, alignment luster..." 
                  value={revComment}
                  onChange={(e) => setRevComment(e.target.value)}
                  className="w-full bg-black/50 border border-neutral-900 rounded px-4 py-3 placeholder:text-neutral-700 text-white focus:outline-none focus:border-gold/50 text-xs tracking-wide"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gold hover:bg-white text-black py-4.5 font-bold tracking-[0.2em] transition-all uppercase rounded-sm cursor-pointer"
              >
                Publish Experience Log
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Similar Products Section */}
      <div className="border-t border-neutral-900/60 pt-16 space-y-8">
        <div className="space-y-2">
          <span className="text-gold text-[9px] font-mono tracking-[0.25em] font-bold block uppercase pb-1">COMPLEMENTARY SPECIMENS</span>
          <h3 className="text-2xl font-serif font-bold text-white tracking-snug">Similar Horological Series</h3>
          <p className="text-neutral-400 text-xs">Exquisite companion models matching the same category standards.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {similarProducts.map((simWatch) => (
            <WatchCard 
              key={simWatch.id} 
              watch={simWatch} 
              onAddToCart={onAddToCart} 
              wishlist={wishlist}
              onToggleWishlist={onToggleWishlist}
              cart={cart}
              onUpdateQty={onUpdateQty}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Authentication Page ---

type AuthMode = "login" | "signup" | "forgot" | "reset";

interface AuthPageProps {
  user: CustomUser | null;
  modeOverride?: AuthMode;
}

const AuthPage = ({ user, modeOverride }: AuthPageProps) => {
  const [mode, setMode] = useState<AuthMode>(() => {
    if (modeOverride) return modeOverride;
    const isRecoveryHash = window.location.hash.includes("type=recovery") || window.location.hash.includes("recovery");
    const isRecoveryLocal = localStorage.getItem("pk_reset_mode") === "true";
    if (isRecoveryHash || isRecoveryLocal) {
      localStorage.removeItem("pk_reset_mode");
      if (window.location.hash) {
        window.history.replaceState(null, "", window.location.pathname + window.location.search);
      }
      return "reset";
    }
    return "login";
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (user && mode !== "reset") {
      if (user.email === "chanchaltailor404@gmail.com") {
        navigate("/admin");
      } else {
        navigate("/profile");
      }
    }
  }, [user, navigate, mode]);

  useEffect(() => {
    if (modeOverride) return;
    const checkReset = () => {
      const isRecoveryHash = window.location.hash.includes("type=recovery") || window.location.hash.includes("recovery");
      const isRecoveryLocal = localStorage.getItem("pk_reset_mode") === "true";
      if (isRecoveryHash || isRecoveryLocal) {
        setMode("reset");
        localStorage.removeItem("pk_reset_mode");
        if (window.location.hash) {
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
        }
      }
    };
    checkReset();
    const timer = setInterval(checkReset, 1000);
    return () => clearInterval(timer);
  }, [modeOverride]);

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: window.location.origin + "/profile"
          }
        });
        if (error) throw error;
      } else {
        const mockUser = {
          uid: "usr_mockgoogle123",
          email: "chanchaltailor404@gmail.com",
          displayName: "Exalted Lead"
        };
        localStorage.setItem("pingaksh_mock_user", JSON.stringify(mockUser));
        setSuccess("Handshaking secure local clearance...");
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (err: any) {
      console.error("Google sign in failure:", err);
      setError(err?.message || "Authentication aborted by user or network.");
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (isSupabaseConfigured && supabase) {
        if (mode === "login") {
          const { error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password
          });
          if (error) throw error;
          setSuccess("Authenticating secure profile clearance...");
        } else if (mode === "signup") {
          if (!name.trim()) {
            throw new Error("Please specify your primary signature name.");
          }
          if (!agree) {
            throw new Error("Please accept the terms of service to proceed.");
          }
          if (password.length < 6) {
            throw new Error("Security policy requires passwords of 6 or more characters.");
          }

          const { data, error } = await supabase.auth.signUp({
            email: email.trim(),
            password: password,
            options: {
              data: {
                displayName: name.trim(),
                name: name.trim()
              }
            }
          });
          if (error) throw error;

          if (data?.user) {
            try {
              // Direct save profile profile write on the database
              await saveSupabaseProfile(data.user.id, name.trim(), email.trim());
            } catch (pErr) {
              console.error("Direct profile write failed during signup:", pErr);
            }
          }

          setSuccess("Registry authorization complete! If email verification is active, please authorize your inbox link.");
        } else if (mode === "forgot") {
          const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
            redirectTo: window.location.origin + "/update-password"
          });
          if (error) throw error;
          setSuccess("A calibrated password restore link has been dispatched via Supabase to your email inbox.");
          setEmail("");
        } else if (mode === "reset") {
          if (password.length < 6) {
            throw new Error("Security policy requires passwords of 6 or more characters.");
          }
          const { error } = await supabase.auth.updateUser({
            password: password
          });
          if (error) throw error;
          setSuccess("Your account credentials have been successfully calibrated! Access credentials updated.");
          setPassword("");
          setTimeout(() => {
            if (user) {
              if (user.email === "chanchaltailor404@gmail.com") {
                navigate("/admin");
              } else {
                navigate("/profile");
              }
            } else {
              setMode("login");
            }
            setSuccess(null);
          }, 2500);
        }
      } else {
        if (mode === "login") {
          const mockUser = {
            uid: "usr_mockuser",
            email: email.trim(),
            displayName: email.trim().split("@")[0] || "Exalted Connoisseur"
          };
          localStorage.setItem("pingaksh_mock_user", JSON.stringify(mockUser));
          setSuccess("Calibrating secure gateway portal...");
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else if (mode === "signup") {
          if (!name.trim()) {
            throw new Error("Please specify your primary signature name.");
          }
          if (!agree) {
            throw new Error("Please accept the terms of service to proceed.");
          }
          if (password.length < 6) {
            throw new Error("Security policy requires passwords of 6 or more characters.");
          }
          const mockUser = {
            uid: "usr_mock_" + Math.floor(Math.random() * 9000),
            email: email.trim(),
            displayName: name.trim()
          };
          localStorage.setItem("pingaksh_mock_user", JSON.stringify(mockUser));
          setSuccess("Your account is verifiably registered! Syncing portal...");
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else if (mode === "forgot") {
          setSuccess("A calibrated password restore link has been simulated to your email inbox.");
          setEmail("");
        }
      }
    } catch (err: any) {
      console.error("Authentication error:", err);
      let errMsg = err?.message || "An anomalous error occurred inside the gateway.";
      const lowerMsg = errMsg.toLowerCase();
      
      if (lowerMsg.includes("rate limit") || lowerMsg.includes("rate_limit") || lowerMsg.includes("too many requests") || err?.status === 429) {
        errMsg = "Strict security cool-down is active. Please wait at least 60 seconds before requesting another secure verification transmission.";
      } else if (errMsg.includes("auth/user-not-found") || errMsg.includes("auth/wrong-password") || errMsg.includes("invalid-credential")) {
        errMsg = "Invalid credential combinations. Please check credentials or seek technical help.";
      } else if (errMsg.includes("auth/email-already-in-use")) {
        errMsg = "This email is already linked to another client account profile.";
      } else if (errMsg.includes("auth/invalid-email")) {
        errMsg = "Deemed invalid. Please check the structure of your email.";
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-32 pb-20 min-h-screen bg-neutral-950 flex items-center justify-center px-4 md:px-8">
      <div id="auth-card" className="w-full max-w-5xl bg-neutral-950/60 border border-neutral-900/80 rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 shadow-2xl">
        
        {/* Left Side: Visual / Aesthetic Panel */}
        <div className="hidden lg:flex lg:col-span-5 bg-neutral-900/40 relative flex-col justify-between p-12 overflow-hidden border-r border-neutral-900">
          {/* Background image blur/fades */}
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&q=80&w=800')] bg-cover bg-center opacity-25 scale-105 transition-all duration-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/60 to-transparent" />

          {/* Luxury text overlay layout */}
          <div className="relative z-10">
            <span className="text-gold text-[10px] font-mono tracking-[0.25em] font-bold block uppercase pb-1">PINGAKSH INSTRUMENTS</span>
            <h2 className="text-3xl font-serif font-bold text-white tracking-tight leading-tight mt-3">Refining Personal Time.</h2>
          </div>

          <div className="relative z-10 space-y-4">
            <p className="text-neutral-400 font-serif italic text-sm leading-relaxed font-light">
              &ldquo;A masterpiece does not merely record standard hours; it register the tempo of your absolute achievements.&rdquo;
            </p>
            <div className="w-12 h-[2px] bg-gold" />
            <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest font-bold">Bangalore Workshop Archives</p>
          </div>
        </div>

        {/* Right Side: Form Component */}
        <div className="col-span-1 lg:col-span-7 p-8 md:p-14 flex flex-col justify-center space-y-8 bg-neutral-950">
          
          {/* Header transitions */}
          <div className="space-y-2">
            <span className="text-gold text-[9px] font-mono tracking-[0.3em] font-bold block uppercase">VERIFY SECURITY ACCESS</span>
            <h1 className="text-3xl font-serif font-bold text-white tracking-tight">
              {mode === "login" && "Acquisition Sign-In"}
              {mode === "signup" && "Bespoke Portfolio Setup"}
              {mode === "forgot" && "Calibre Reset Access"}
              {mode === "reset" && "Update Calibre Password"}
            </h1>
            <p className="text-neutral-500 text-xs font-light">
              {mode === "login" && "Enter credentials to access your curated timepiece portfolio."}
              {mode === "signup" && "Begin registering for our 1-year product warranty coverage."}
              {mode === "forgot" && "Provide your email setup to receive mechanical synchronization instructions."}
              {mode === "reset" && "Enter your new high-precision credentials to secure your custom workspace."}
            </p>
          </div>

          {/* Quick Error/Success alerts */}
          {(error || success) && (
            <motion.div 
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "p-4 rounded-xl text-xs flex items-start gap-3 border font-sans",
                error 
                  ? "bg-red-950/20 border-red-900/40 text-red-400" 
                  : "bg-emerald-950/20 border-emerald-900/40 text-emerald-400"
              )}
            >
              <div className="mt-0.5">
                {error ? <X size={14} className="text-red-500 shrink-0" /> : <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />}
              </div>
              <p className="leading-relaxed">{error || success}</p>
            </motion.div>
          )}

          {/* Authentication form */}
          <form onSubmit={handleAuthSubmit} className="space-y-5 text-xs font-mono">
            {mode === "signup" && (
              <div className="space-y-1.5 animate-fade-in">
                <label className="text-neutral-400 text-[10px] tracking-wider uppercase flex items-center gap-1.5">
                  <User size={12} className="text-gold/60" /> Display Signature Name
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Anand Mahindra" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black/40 border border-neutral-900 rounded p-3.5 placeholder:text-neutral-700 text-white focus:outline-none focus:border-gold/50 text-xs tracking-wide transition-colors"
                />
              </div>
            )}

            {mode !== "reset" && (
              <div className="space-y-1.5">
                <label className="text-neutral-400 text-[10px] tracking-wider uppercase flex items-center gap-1.5 font-mono">
                  <Mail size={12} className="text-gold/60" /> Email Coordinates
                </label>
                <input 
                  type="email" 
                  required
                  placeholder="signature@domain.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-black/40 border border-neutral-900 rounded p-3.5 placeholder:text-neutral-700 text-white focus:outline-none focus:border-gold/50 text-xs tracking-wide transition-colors"
                />
              </div>
            )}

            {mode !== "forgot" && (
              <div className="space-y-1.5 animate-fade-in">
                <div className="flex justify-between items-center">
                  <label className="text-neutral-400 text-[10px] tracking-wider uppercase flex items-center gap-1.5 font-mono">
                    <Lock size={12} className="text-gold/60" /> {mode === "reset" ? "New Calibre Password" : "Calibre Password"}
                  </label>
                  {mode === "login" && (
                    <button 
                      type="button" 
                      onClick={() => { setMode("forgot"); setError(null); setSuccess(null); }}
                      className="text-gold text-[9px] hover:text-white transition-colors duration-300 tracking-wider"
                    >
                      Forgotten Key?
                    </button>
                  )}
                </div>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/40 border border-neutral-900 rounded p-3.5 placeholder:text-neutral-700 text-white focus:outline-none focus:border-gold/50 text-xs tracking-wide transition-colors"
                />
              </div>
            )}

            {mode === "signup" && (
              <div className="flex items-start gap-2.5 pt-2 animate-fade-in">
                <input 
                  type="checkbox" 
                  id="agree-rules"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="mt-0.5 rounded accent-gold text-neutral-950 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="agree-rules" className="text-neutral-500 font-sans text-[11px] leading-relaxed cursor-pointer select-none">
                  Authorize my digital signature profile and accept Pingaksh&apos;s strict privacy policies and domestic standard shipping parameters.
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gold hover:bg-white text-black py-4.5 font-bold tracking-[0.2em] transition-all uppercase rounded-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-xs flex justify-center items-center gap-2 mt-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {mode === "login" && "Access Secure Storefront"}
                  {mode === "signup" && "Establish Premium Account"}
                  {mode === "forgot" && "Send Calibration Verification Email"}
                  {mode === "reset" && "Update Calibre Password"}
                </>
              )}
            </button>
          </form>

          {/* Social Sign In Option */}
          {mode !== "forgot" && mode !== "reset" && (
            <div className="space-y-4 animate-fade-in pt-1 border-t border-neutral-900/60">
              <div className="relative flex py-1 items-center justify-center">
                <div className="flex-grow border-t border-neutral-900" />
                <span className="flex-shrink mx-4 text-neutral-600 text-[10px] tracking-widest font-mono select-none">OR SECURE INTERACTIVE LOGIN</span>
                <div className="flex-grow border-t border-neutral-900" />
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full border border-neutral-900 hover:border-gold hover:text-white text-neutral-400 py-4 text-xs font-mono font-bold tracking-[0.2em] transition-all duration-300 uppercase rounded-sm flex items-center justify-center gap-3"
              >
                <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                </svg>
                CONTINUE WITH GOOGLE INTEGRATION
              </button>
            </div>
          )}

          {/* Mode transitions */}
          <div className="pt-2 text-center text-xs text-neutral-500 font-sans">
            {mode === "login" && (
              <p>
                Not set up in our registries yet?{" "}
                <button 
                  onClick={() => { setMode("signup"); setError(null); setSuccess(null); }} 
                  className="text-gold font-bold hover:underline font-mono uppercase tracking-wider text-[11px]"
                >
                  Create Portfolio
                </button>
              </p>
            )}

            {mode === "signup" && (
              <p>
                Already possess authenticated credentials?{" "}
                <button 
                  onClick={() => { setMode("login"); setError(null); setSuccess(null); }} 
                  className="text-gold font-bold hover:underline font-mono uppercase tracking-wider text-[11px]"
                >
                  Access Coordinates
                </button>
              </p>
            )}

            {(mode === "forgot" || mode === "reset") && (
              <p>
                Recalled your credentials sequence?{" "}
                <button 
                  onClick={() => { setMode("login"); setError(null); setSuccess(null); }} 
                  className="text-gold font-bold hover:underline font-mono uppercase tracking-wider text-[11px]"
                >
                  Back to Sign In
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Client/User Profile Dashboard ---

interface ProfilePageProps {
  user: CustomUser | null;
  wishlist: string[];
  onToggleWishlist: (id: string) => void;
  onAddToCart: (watch: Watch) => void;
  watches: Watch[];
}

const ProfilePage = ({ 
  user, 
  wishlist, 
  onToggleWishlist, 
  onAddToCart,
  watches
}: ProfilePageProps) => {
  const navigate = useNavigate();
  const [copiedSerial, setCopiedSerial] = useState<string | null>(null);

  // States for Warranty Validation
  const [warrantyKey, setWarrantyKey] = useState("PGS-701552-AUTO");
  const [warrantyModel, setWarrantyModel] = useState("Aurelius Gold");
  const [warrantyLog, setWarrantyLog] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("pingaksh_warranties");
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed : [
        {
          watchingName: "Aurelius Gold",
          serialKey: "PGS-824018-GOLD",
          activationDate: "May 20, 2026",
          expiryDate: "May 20, 2027",
          status: "APPROVED"
        }
      ];
    } catch {
      return [];
    }
  });

  const [recName, setRecName] = useState("");
  const [recSerial, setRecSerial] = useState("");
  const [recSuccess, setRecSuccess] = useState(false);

  // Handle warranties registration
  const handleRegisterWarranty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recName.trim() || !recSerial.trim()) return;

    const newWarr = {
      watchingName: recName.trim(),
      serialKey: recSerial.trim().toUpperCase(),
      activationDate: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      status: "APPROVED"
    };

    const updated = [newWarr, ...warrantyLog];
    setWarrantyLog(updated);
    try {
      localStorage.setItem("pingaksh_warranties", JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }

    setRecName("");
    setRecSerial("");
    setRecSuccess(true);
    setTimeout(() => setRecSuccess(false), 4000);
  };

  // Retrieve customer orders dynamically support Supabase or localStorage fallback
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.uid) return;
    if (isSupabaseConfigured && supabase && user?.uid) {
      getSupabaseOrders(user.uid)
        .then((dbOrders) => {
          const formatted = dbOrders.map(ord => ({
            id: ord.id.substring(0, 8).toUpperCase(),
            date: ord.created_at ? new Date(ord.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "",
            total: Number(ord.total),
            items: ord.order_items?.map(it => ({
              id: it.id,
              name: it.product_name,
              price: Number(it.price),
              quantity: it.quantity,
              image: (watches.length > 0 ? watches : WATCHES).find(w => w.name === it.product_name)?.image || "https://images.unsplash.com/photo-1524592091214-8c97af1c0db4?auto=format&fit=crop&q=80&w=800"
            })) || [],
            status: ord.status
          }));
          setCustomerOrders(formatted);
        })
        .catch(err => {
          console.error("Error loading Supabase user orders:", err);
          setCustomerOrders([]);
        });
    } else {
      try {
        const saved = localStorage.getItem("pingaksh_customer_orders");
        setCustomerOrders(saved ? JSON.parse(saved) : []);
      } catch {
        setCustomerOrders([]);
      }
    }
  }, [user?.uid, watches]);

  // Redirect to login if user session is lost
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  if (!user) return null;

  const wishlistWatches = (watches.length > 0 ? watches : WATCHES).filter(w => wishlist.includes(w.id));

  const handleCopy = (txt: string) => {
    navigator.clipboard.writeText(txt);
    setCopiedSerial(txt);
    setTimeout(() => setCopiedSerial(null), 2500);
  };

  return (
    <div className="pt-32 pb-24 text-neutral-100 max-w-7xl mx-auto px-4 md:px-8 space-y-16">
      
      {/* Top Banner section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-neutral-900 pb-10">
        <div className="space-y-2">
          <span className="text-gold text-[10px] font-mono tracking-[0.3em] font-bold block uppercase">VERIFIED PORTFOLIO ACCORD</span>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-tr from-neutral-950 to-neutral-800 border border-neutral-800 flex items-center justify-center rounded-2xl shadow-xl">
              <span className="text-xl font-serif text-gold font-bold">
                {user.displayName ? user.displayName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "PK"}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-serif font-bold tracking-tight text-white leading-none">
                {user.displayName || "Exalted Collector"}
              </h1>
              <p className="text-neutral-500 text-xs mt-1 font-mono tracking-wider">{user.email}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          <div className="px-5 py-3 bg-neutral-950 border border-neutral-900 rounded-xl space-y-0.5 select-none md:text-right">
            <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest block">Collector Standing</span>
            <span className="text-white text-xs font-mono font-bold tracking-wider text-gold flex items-center gap-1.5 justify-end">
              ★ BESPOKE CONNOISSEUR
            </span>
          </div>

          <button
            onClick={async () => {
              try {
                if (isSupabaseConfigured && supabase) {
                  await supabase.auth.signOut();
                } else {
                  localStorage.removeItem("pingaksh_mock_user");
                  window.location.reload();
                }
              } catch (err) {
                console.error("Critical error while signing out from Supabase:", err);
                localStorage.removeItem("pingaksh_mock_user");
                window.location.reload();
              }
            }}
            className="border border-neutral-900 hover:border-red-900/40 hover:text-red-400 bg-transparent transition-all duration-300 p-4 rounded-xl flex items-center justify-center gap-2 group cursor-pointer"
            aria-label="Secure close session"
          >
            <LogOut size={16} className="text-neutral-500 group-hover:text-red-400 transition-colors" />
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-[10px]">Close Session</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        
        {/* Left Aspect: Orders list or Logistics Tracker & Warranties status (7cols) */}
        <div className="lg:col-span-8 space-y-12">
          
          {/* Active Logistics Shipping timeline tracker */}
          <div className="space-y-6">
            <div className="space-y-1.5">
              <span className="text-gold text-[9px] font-mono tracking-[0.25em] font-bold block uppercase">INDIAN REGIONAL SHIPPING LINES</span>
              <h3 className="text-2xl font-serif font-bold text-white tracking-snug">Active Domestic Logistics Tracking</h3>
              <p className="text-neutral-500 text-xs text-light">Meticulously tracking your high-weight horological payload inside Indian state coordinates.</p>
            </div>

            {customerOrders.length === 0 ? (
              <div className="p-8 bg-neutral-950/20 border border-neutral-900 rounded-2xl flex flex-col items-center text-center space-y-4">
                <div className="w-14 h-14 bg-neutral-900/40 rounded-full flex items-center justify-center text-neutral-600 border border-neutral-800">
                  <Truck size={24} />
                </div>
                <div className="space-y-1 max-w-sm">
                  <h4 className="text-white text-sm font-serif font-bold">No Active Ingress Shipments</h4>
                  <p className="text-neutral-500 text-[11px] leading-relaxed">No high-safety dispatches are registered under your coordinate registers. Build an order sequence inside the shop.</p>
                </div>
                <Link to="/shop" className="bg-gold hover:bg-white text-black text-[10px] font-mono font-bold tracking-[0.18em] px-6 py-3 transition-all duration-300 uppercase rounded-sm cursor-pointer mt-1">
                  Browse Active Catalogue
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {customerOrders.map((ord: any) => (
                  <div key={ord.id} className="p-6 bg-neutral-950 border border-neutral-900 rounded-2xl space-y-6">
                    {/* Order summary info */}
                    <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-neutral-900 pb-4">
                      <div className="space-y-1">
                        <span className="text-neutral-500 text-[9px] uppercase tracking-widest font-mono block">Acquisition Token / Location</span>
                        <div className="flex items-center gap-3">
                          <span className="text-white text-xs font-mono font-bold tracking-wider">{ord.id}</span>
                          <span className="text-[10px] font-mono text-gold bg-gold/10 px-2 py-0.5 border border-gold/15 rounded-xs select-none">
                            CALIBRATED & SECURE
                          </span>
                        </div>
                      </div>

                      <div className="sm:text-right space-y-1">
                        <span className="text-neutral-500 text-[9px] uppercase tracking-widest font-mono block">Final Ledger Total</span>
                        <span className="text-white text-sm font-mono font-bold text-gold">{getFormattedPrice(ord.total)}</span>
                      </div>
                    </div>

                    {/* Logistics Timeline Graph */}
                    <div className="py-2">
                      <span className="text-neutral-400 text-[9px] uppercase tracking-widest font-mono block mb-5">Dispatches Security Timeline (India Only)</span>
                      
                      {/* Vertical Timeline Nodes */}
                      <div className="relative pl-6 space-y-6">
                        {/* Connecting track line */}
                        <div className="absolute top-2 bottom-2 left-[9px] w-[1px] bg-neutral-905 bg-neutral-900" />
                        
                        {(() => {
                          const statusList = (ord.status || "").toLowerCase();
                          let activeIndex = 0; // default for calibrating/pending/etc
                          
                          if (statusList === "transit") {
                            activeIndex = 1;
                          } else if (statusList === "customs" || statusList === "custom") {
                            activeIndex = 2;
                          } else if (statusList === "fulfilled") {
                            activeIndex = 3;
                          } else if (statusList === "cancelled") {
                            activeIndex = -1;
                          }

                          const steps = [
                            {
                              label: "Production",
                              description: "Precision watch assembly, horological calibration & premium quality assurance testing at the Bangalore Cleanroom Facility.",
                              subText: "Calibration & casing verification completed with precision.",
                            },
                            {
                              label: "Handover",
                              description: "Courier pickup initialized. Custody securely transferred to our high-safety logistics partner (Blue Dart Air Express).",
                              subText: activeIndex >= 1 ? "Dispatched from terminal hub." : "Preparing transport container & protective seals.",
                            },
                            {
                              label: "Domestic Transit",
                              description: "Payload in premium cargo transit across regional borders with shock, temperature, and pressure sensors logging.",
                              subText: activeIndex >= 2 ? "In transit through domestic airspace." : "Awaiting flight route loading.",
                            },
                            {
                              label: "Final Delivery",
                              description: "Handover coordinates verified. Handcrafted wooden case presented by our personal courier agent.",
                              subText: activeIndex >= 3 ? "Successfully signed and authorized." : "Awaiting destination courier dispatch.",
                            }
                          ];

                          return steps.map((step, index) => {
                            let isCompleted = index < activeIndex;
                            let isActive = index === activeIndex;
                            let isPending = index > activeIndex;
                            
                            if (activeIndex === 3) {
                              isCompleted = true; // All completed
                              isActive = false;
                              isPending = false;
                            }

                            if (statusList === "cancelled") {
                              isCompleted = false;
                              isActive = false;
                              isPending = true;
                            }

                            return (
                              <div key={index} className="relative flex gap-4 text-xs">
                                {/* Bullet indicator */}
                                <div className="absolute -left-[22px] top-1.5 z-10 flex items-center justify-center">
                                  {isCompleted ? (
                                    <span className="w-5 h-5 rounded-full bg-gold border-2 border-neutral-950 flex items-center justify-center text-black font-extrabold text-[8px] shadow-sm shadow-gold/20">
                                      ✓
                                    </span>
                                  ) : isActive ? (
                                    <span className="w-5 h-5 rounded-full bg-neutral-950 border border-gold flex items-center justify-center text-gold font-bold text-[8px] animate-pulse">
                                      ●
                                    </span>
                                  ) : (
                                    <span className="w-5 h-5 rounded-full bg-neutral-950 border border-neutral-800 flex items-center justify-center text-neutral-600 font-medium text-[8px]">
                                      {index + 1}
                                    </span>
                                  )}
                                </div>

                                <div className="space-y-1 pl-1 select-none">
                                  <div className="flex items-center gap-2">
                                    <h4 className={`font-serif font-bold text-sm tracking-wide ${isCompleted ? 'text-white' : isActive ? 'text-gold' : 'text-neutral-500'}`}>
                                      {step.label}
                                    </h4>
                                    {isActive && (
                                      <span className="text-[7.5px] font-mono uppercase bg-gold/10 border border-gold/20 text-gold px-1.5 py-0.5 rounded-xs animate-pulse">
                                        ACTIVE STAGE
                                      </span>
                                    )}
                                    {isCompleted && (
                                      <span className="text-[7.5px] font-mono text-neutral-500 uppercase">
                                        COMPLETED
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-neutral-400 font-sans leading-relaxed text-[11px] max-w-xl">
                                    {step.description}
                                  </p>
                                  <p className="text-neutral-500 font-mono text-[9px] leading-tight flex items-center gap-1">
                                    <span className="text-gold/40">↳</span> {step.subText}
                                  </p>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>

                    {/* Order Timepieces list */}
                    <div className="space-y-3 pt-4 border-t border-neutral-900/40">
                      <h5 className="text-neutral-400 text-[9.5px] uppercase tracking-wider font-mono">Affiliated Specimen Specifications</h5>
                      <div className="grid grid-cols-1 divide-y divide-neutral-950">
                        {ord.items && ord.items.map((it: any) => (
                          <div key={it.id} className="py-3 flex justify-between items-center gap-4 text-xs">
                            <div className="flex items-center gap-3">
                              {it.image && (
                                <img src={it.image} alt="wristwatch micro" className="w-8 h-10 object-cover bg-black rounded border border-neutral-900 shrink-0" referrerPolicy="no-referrer" />
                              )}
                              <div className="space-y-0.5">
                                <span className="font-serif text-white font-bold block">{it.name}</span>
                                <span className="text-neutral-500 font-mono text-[9px] block">QUANTITY: {it.quantity} SPECIMENS</span>
                              </div>
                            </div>
                            <span className="text-gold font-mono font-bold">{getFormattedPrice(it.price * it.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active 1 Year Technical Warranty logs */}
          <div className="space-y-6">
            <div className="space-y-1.5">
              <span className="text-gold text-[9px] font-mono tracking-[0.25em] font-bold block uppercase">1-YEAR MANUFACTURER COVER SERVICE</span>
              <h3 className="text-2xl font-serif font-bold text-white tracking-snug">Active Calibre Protection Registries</h3>
              <p className="text-neutral-500 text-xs font-light">Verify and authorize warranty certifications for hand-calibrated mechanical models in India.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Form to append model warranty */}
              <div className="bg-neutral-950 p-6 border border-neutral-900 rounded-2xl space-y-4">
                <div className="space-y-1">
                  <h4 className="text-white text-sm font-serif font-bold">Register Active Specimen</h4>
                  <p className="text-neutral-500 text-[10px] leading-relaxed">Enter serial numbers from your physical card tag to verify 1-Year coverage limits.</p>
                </div>

                {recSuccess && (
                  <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-lg text-emerald-400 text-[10px]">
                    Timepiece warranty registry authorized successfully.
                  </div>
                )}

                <form onSubmit={handleRegisterWarranty} className="space-y-3.5 text-xs font-mono">
                  <div className="space-y-1.5">
                    <label className="text-neutral-400 text-[9px] uppercase tracking-wider block">Specimen Model Name</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Aurelius Gold" 
                      value={recName}
                      onChange={(e) => setRecName(e.target.value)}
                      className="w-full bg-black/40 border border-neutral-900 rounded px-3.5 py-2.5 placeholder:text-neutral-700 text-white focus:outline-none focus:border-gold/35 text-[11px]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-neutral-400 text-[9px] uppercase tracking-wider block font-mono">Serial Verification Key</label>
                    <input 
                      type="text" 
                      required
                      placeholder="PGS-XXXXXX-XXXX" 
                      value={recSerial}
                      onChange={(e) => setRecSerial(e.target.value)}
                      className="w-full bg-black/40 border border-neutral-900 rounded px-3.5 py-2.5 placeholder:text-neutral-700 text-white focus:outline-none focus:border-gold/35 text-[11px]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gold hover:bg-white text-black py-3 font-bold tracking-widest text-[9.5px] uppercase transition-all duration-300 rounded-sm cursor-pointer"
                  >
                    Authenticate Service Coverage
                  </button>
                </form>
              </div>

              {/* Verified warranty documents layout */}
              <div className="space-y-4">
                <span className="text-neutral-400 text-[9px] uppercase tracking-wider font-mono block">Registered Certifications</span>
                
                <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                  {warrantyLog.length === 0 ? (
                    <p className="text-neutral-600 text-[11px] italic pt-4">No watches currently verified under warranty registries.</p>
                  ) : (
                    warrantyLog.map((warr, idx) => (
                      <div key={idx} className="p-4 bg-neutral-950/40 border border-neutral-900 rounded-xl relative overflow-hidden flex flex-col justify-between gap-3 text-[11px] font-mono">
                        {/* Status absolute label */}
                        <span className="absolute top-4 right-4 bg-emerald-900/10 text-emerald-400 border border-emerald-900/20 text-[8px] font-bold px-2 py-0.5 rounded-sm">
                          {warr.status}
                        </span>

                        <div className="space-y-1">
                          <h5 className="font-serif text-white font-bold text-xs">{warr.watchingName}</h5>
                          <button 
                            onClick={() => handleCopy(warr.serialKey)}
                            className="text-[9px] text-neutral-500 hover:text-gold transition-colors block text-left"
                            title="Click to copy serial key"
                          >
                            KEY: <strong className="text-neutral-400 underline decoration-dotted">{warr.serialKey}</strong>
                            {copiedSerial === warr.serialKey && (
                              <span className="text-emerald-400 font-bold ml-1.5 text-[8px] select-none">(COPIED)</span>
                            )}
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-t border-neutral-900/40 pt-2 text-[9px] text-neutral-500">
                          <div>
                            <span className="block uppercase text-[8px]">Activated On</span>
                            <span className="text-neutral-400 font-bold">{warr.activationDate}</span>
                          </div>
                          <div>
                            <span className="block uppercase text-[8px]">Expires On (1-Yr Limit)</span>
                            <span className="text-neutral-400 font-bold">{warr.expiryDate}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Aspect: Verified Wishlist Side panel (4cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="space-y-1.5">
            <span className="text-gold text-[9px] font-mono tracking-[0.25em] font-bold block uppercase">VERIFU ARCHIVAL FAOVORITES</span>
            <h3 className="text-2xl font-serif font-bold text-white tracking-snug">My Wishlist Portfolio</h3>
            <p className="text-neutral-500 text-xs font-light">Your curated registry of elite designs waiting verification.</p>
          </div>

          <div className="bg-neutral-900/10 border border-neutral-900 p-6 rounded-2xl space-y-4">
            {wishlistWatches.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <Heart size={24} className="text-neutral-700 mx-auto" />
                <p className="text-neutral-500 text-xs font-sans leading-relaxed max-w-xs mx-auto">No timepieces have been favorited into your wishlist. Explore our catalogue to secure selections.</p>
                <Link to="/shop" className="inline-block text-gold text-[10px] tracking-wider hover:text-white transition-colors uppercase font-mono">
                  Explore Watches &rarr;
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-neutral-900/50">
                {wishlistWatches.map((w) => (
                  <div key={w.id} className="py-4.5 flex gap-4 first:pt-0 last:pb-0 font-sans">
                    <div className="w-14 h-18 bg-neutral-950 overflow-hidden rounded border border-neutral-800 shrink-0 select-none">
                      <img src={w.image} alt={w.name} className="w-full h-full object-cover grayscale opacity-70 hover:opacity-100 hover:grayscale-0 transition-all duration-300" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="space-y-0.5">
                        <Link to={`/product/${w.id}`} className="font-serif text-white hover:text-gold font-bold text-xs leading-none transition-colors">
                          {w.name}
                        </Link>
                        <p className="text-gold font-mono text-[11px] font-bold">{getFormattedPrice(w.price)}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => onAddToCart(w)}
                          className="bg-gold text-black px-3 py-1 font-mono text-[9px] font-bold tracking-wider hover:bg-white transition-all uppercase rounded-xs cursor-pointer"
                        >
                          Acquire
                        </button>
                        <button
                          onClick={() => onToggleWishlist(w.id)}
                          className="text-neutral-500 hover:text-red-400 text-[10px] font-mono hover:scale-105 transition-all text-neutral-500"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [watches, setWatches] = useState<Watch[]>([]);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem("pingaksh_cart");
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("pingaksh_cart", JSON.stringify(cart));
    } catch (err) {
      console.error("Failed to save cart to localStorage", err);
    }
  }, [cart]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<CustomUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [showLoader, setShowLoader] = useState(true);
  const [loaderTimeoutDone, setLoaderTimeoutDone] = useState(false);
  const [cloudCartFetched, setCloudCartFetched] = useState(false);

  useEffect(() => {
    if (isAuthReady && loaderTimeoutDone) {
      setShowLoader(false);
    }
  }, [isAuthReady, loaderTimeoutDone]);

  useEffect(() => {
    // Fail-safe protection: force isAuthReady to true after absolute maximum duration of 4 seconds
    const fallbackTimer = setTimeout(() => {
      if (!isAuthReady) {
        console.warn("[Auth Fail-Safe] Forcing isAuthReady to true due to session loading bottleneck.");
        setIsAuthReady(true);
      }
    }, 4000);
    return () => clearTimeout(fallbackTimer);
  }, [isAuthReady]);

  const [selectedWatch, setSelectedWatch] = useState<Watch | null>(null);
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("pingaksh_wishlist");
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const toggleWishlist = async (id: string) => {
    const isAdding = !wishlist.includes(id);
    
    // Smooth, optimistic local UI state change for instant reaction
    setWishlist(prev => {
      const updated = prev.includes(id) 
        ? prev.filter(item => item !== id) 
        : [...prev, id];
      localStorage.setItem("pingaksh_wishlist", JSON.stringify(updated));
      return updated;
    });

    if (isSupabaseConfigured && supabase && user) {
      try {
        await toggleSupabaseWishlistItem(user.uid, id, isAdding);
      } catch (err) {
        console.error("Failed to sync wishlist change to Supabase:", err);
      }
    }
  };

  useEffect(() => {
    // 1. Initial connection verification for active configurations
    const testConnection = async () => {
      if (isSupabaseConfigured && supabase) {
        try {
          const { error } = await supabase.from("products").select("id").limit(1);
          if (error) throw error;
          console.log("Supabase connection calibrated successfully.");
        } catch (err) {
          console.error("Supabase initial handshake failed:", err);
        }
      }
    };
    testConnection();

    // 2. Auth State Listening & Dynamic Database Seeding
    let unsubscribeAuth: (() => void) | (() => Promise<void>) | null = null;
    let unsubscribeWatches: (() => void) | null = null;

    if (isSupabaseConfigured && supabase) {
      // Helper function with a fallback timer to cancel hanging promises
      const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> => {
        return Promise.race([
          promise,
          new Promise<T>((resolve) => setTimeout(() => {
            console.warn(`[Supabase Resiliency] Async call exceeded ${timeoutMs}ms. Returning fallback.`);
            resolve(fallback);
          }, timeoutMs))
        ]);
      };

      const handleSessionChange = async (session: any) => {
        try {
          if (session?.user) {
            console.log("[Auth Session Change] Logged-in user detected:", session.user.id);
            const userMeta = session.user.user_metadata || {};
            const initialName = userMeta.displayName || userMeta.name || userMeta.full_name || session.user.email?.split("@")[0] || "Exalted Collector";
            const initialRole = "customer";

            // Optimize: Update user state instantly to reflect authentic identity without waiting for slow DB reads
            setUser({
              uid: session.user.id,
              email: session.user.email || null,
              displayName: initialName,
              role: initialRole
            } as any);

            // CRITICAL: Unlock main app loading state instantly! This avoids infinite spinner screen entirely.
            setIsAuthReady(true);

            // Execute cloud-syncing operations in a completely non-blocking, asynchronous scope
            (async () => {
              try {
                console.log("[Auth Background] Querying user profile from DB...");
                const profilePromise = getSupabaseProfile(session.user.id);
                // Fail-safe limit profile fetch to 1.5 seconds maximum
                const profile = await withTimeout(profilePromise, 1500, null);

                let finalName = initialName;
                let finalRole = initialRole;

                if (profile) {
                  finalName = profile.name || finalName;
                  finalRole = profile.role || finalRole;

                  setUser({
                    uid: session.user.id,
                    email: session.user.email || null,
                    displayName: finalName,
                    role: finalRole
                  } as any);
                  console.log("[Auth Background] Profile successfully updated from database:", profile);
                } else {
                  console.log("[Auth Background] Profile record not present. Creating self-healing record...");
                  // Timeout profile saving after 2 seconds to avoid any queue congestion
                  const savePromise = saveSupabaseProfile(session.user.id, initialName, session.user.email || "");
                  await withTimeout(savePromise, 2000, null);
                }
              } catch (profileErr) {
                console.error("[Auth Background Exception] User profile loading background routine failed:", profileErr);
              }

              try {
                console.log("[Auth Background] Loading user wishlist from DB...");
                const wishlistPromise = getSupabaseWishlist(session.user.id);
                // Fail-safe limit wishlist fetch to 2.5 seconds maximum
                const dbWishlist = await withTimeout(wishlistPromise, 2500, []);

                if (dbWishlist && Array.isArray(dbWishlist)) {
                  setWishlist(dbWishlist);
                  localStorage.setItem("pingaksh_wishlist", JSON.stringify(dbWishlist));
                  console.log("[Auth Background] Wishlist resolved and set successfully:", dbWishlist);
                } else {
                  console.warn("[Auth Background] Invalid or empty wishlist response received. Reverting to empty array.");
                  setWishlist([]);
                }
              } catch (wishlistErr) {
                console.error("[Auth Background Exception] Failed loading user wishlist from database:", wishlistErr);
              }
            })();

          } else {
            console.log("[Auth Session Change] Guest user detected or logged out.");
            setUser(null);
            setCloudCartFetched(false);
            setCart([]);
            setWishlist([]);
            localStorage.removeItem("pingaksh_wishlist");
            setIsAuthReady(true);
          }
        } catch (err) {
          console.error("[Session Process Error] Failed inside handleSessionChange:", err);
          setIsAuthReady(true);
        }
      };

      // Get initial session with a safe timeout pattern to ensure instantaneous app responsiveness
      const fetchInitialSession = async () => {
        try {
          console.log("[Auth Init] Checking current active authentication session...");
          const getSessionPromise = supabase.auth.getSession().then(({ data }) => data.session);
          // Set a strict 1.5-second timeout on initial session fetch
          const session = await withTimeout(getSessionPromise, 1500, null);
          await handleSessionChange(session);
        } catch (err) {
          console.error("[Auth Init Exception] Failed to query initial session from Supabase on start:", err);
          setIsAuthReady(true);
        }
      };
      fetchInitialSession();

      // Supabase Authentication listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        try {
          console.log("[Auth Event] Received Supabase authentication event:", event);
          if (event === "PASSWORD_RECOVERY") {
            localStorage.setItem("pk_reset_mode", "true");
            if (window.location.pathname !== "/update-password") {
              window.location.href = "/update-password";
            }
          }
          await handleSessionChange(session);
        } catch (err) {
          console.error("[Auth Listener Exception] Error inside onAuthStateChange callback helper:", err);
          setIsAuthReady(true);
        }
      });
      
      unsubscribeAuth = () => {
        subscription.unsubscribe();
      };

      // Load products initially & subscribe to changes in real-time via PostgreSQL replication
      const loadSupabaseProducts = async (isBackground = false) => {
        if (!isBackground) {
          setIsProductsLoading(true);
        }
        try {
          const dbProducts = await getSupabaseProducts();
          if (dbProducts && dbProducts.length > 0) {
            setWatches(dbProducts as Watch[]);
          } else {
            // Table might be empty or query returned empty. Seed initial static WATCHES catalog safely.
            try {
              console.log("[Supabase Seeding] Seeding initial watches database...");
              for (const item of WATCHES) {
                const { error: insertErr } = await supabase.from("products").insert({
                  name: item.name,
                  price: item.price,
                  image: item.image,
                  category: item.category,
                  description: item.description
                });
                if (insertErr) {
                  console.warn("[Supabase Seeding] Product seed insert item warn:", insertErr.message);
                }
              }
              const synced = await getSupabaseProducts();
              if (synced && synced.length > 0) {
                setWatches(synced as Watch[]);
              } else {
                setWatches(WATCHES);
              }
            } catch (seedErr) {
              console.error("[Supabase Seeding Exception] Failed to seed products table:", seedErr);
              setWatches(WATCHES);
            }
          }
        } catch (err) {
          console.error("Supabase products load failed. Falling back to local catalog:", err);
          setWatches(WATCHES); // Local static catalog fallback
        } finally {
          setIsProductsLoading(false);
        }
      };
      loadSupabaseProducts();

      // Real-time Database Channel Subscription
      const productsChannel = supabase
        .channel("realtime-watches-changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "products" },
          () => {
            loadSupabaseProducts(true);
          }
        )
        .subscribe();

      unsubscribeWatches = () => {
        supabase.removeChannel(productsChannel);
      };
    } else {
      // Local development fallback
      setWatches(WATCHES);
      setIsAuthReady(true);
      setIsProductsLoading(false);
      
      const localUser = localStorage.getItem("pingaksh_mock_user");
      if (localUser) {
        try {
          setUser(JSON.parse(localUser));
        } catch {
          setUser(null);
        }
      }
    }

    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubscribeWatches) unsubscribeWatches();
    };
  }, []);

  // 3. Deep Sync User Cart items to Supabase cloud database
  useEffect(() => {
    if (isSupabaseConfigured && supabase && user?.uid && cloudCartFetched) {
      const syncCloudCart = async () => {
        try {
          await syncSupabaseCart(
            user.uid,
            cart.map(i => ({ product_id: i.id, quantity: i.quantity }))
          );
        } catch (err) {
          console.error("Cloud cart consolidation failed", err);
        }
      };
      syncCloudCart();
    }
  }, [cart, user?.uid, cloudCartFetched]);

  // 4. Fetch/consolidate Cloud cart upon authentication
  useEffect(() => {
    if (isSupabaseConfigured && supabase && user?.uid && watches.length > 0 && !cloudCartFetched) {
      const fetchCloudCart = async () => {
        try {
          const dbCart = await getSupabaseCart(user.uid);
          if (dbCart && dbCart.length > 0) {
            const resolvedCart = dbCart.map(item => {
              const matchedWatch = watches.find(w => w.id === item.product_id);
              if (matchedWatch) {
                return { ...matchedWatch, quantity: item.quantity };
              }
              return null;
            }).filter(Boolean) as CartItem[];
            if (resolvedCart.length > 0) {
              setCart(resolvedCart);
            }
          }
        } catch (err) {
          console.error("Failed fetching user database cart from Supabase", err);
        } finally {
          setCloudCartFetched(true);
        }
      };
      fetchCloudCart();
    }
  }, [user?.uid, watches.length, cloudCartFetched]);

  const addToCart = (watch: Watch) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === watch.id);
      if (existing) {
        return prev.map(item => 
          item.id === watch.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...watch, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  return (
    <AnimatePresence mode="wait">
      {(!isAuthReady || showLoader) ? (
        <PremiumLoader key="loader" onComplete={() => setLoaderTimeoutDone(true)} />
      ) : (
        <div key="app">
          <Router>
            <div className="min-h-screen bg-neutral-950 font-sans text-neutral-100 selection:bg-gold selection:text-black">
        <Navbar 
          cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)} 
          onCartClick={() => setIsCartOpen(true)} 
          user={user}
          onSearchClick={() => setIsSearchOpen(true)}
          onMenuClick={() => setIsMenuOpen(true)}
        />
        
        <CartDrawer 
          isOpen={isCartOpen} 
          onClose={() => setIsCartOpen(false)} 
          items={cart}
          onUpdateQty={updateQty}
          onRemove={removeFromCart}
          onCheckout={() => {
            setIsCartOpen(false);
            window.location.href = "/checkout";
          }}
        />

        <SearchOverlay 
          isOpen={isSearchOpen} 
          onClose={() => setIsSearchOpen(false)} 
          watches={watches}
          onAddToCart={addToCart}
        />

        <MobileMenu 
          isOpen={isMenuOpen} 
          onClose={() => setIsMenuOpen(false)} 
          user={user}
        />

        <WatchDetailModal 
          watch={selectedWatch} 
          onClose={() => setSelectedWatch(null)} 
          onAddToCart={addToCart} 
          wishlist={wishlist}
          onToggleWishlist={toggleWishlist}
          cart={cart}
          onUpdateQty={updateQty}
        />

        <WatchAssistant 
          watches={watches}
          onAddToCart={addToCart}
          onViewDetails={setSelectedWatch}
        />

        <Routes>
          <Route path="/" element={<Home onAddToCart={addToCart} watches={watches} onViewDetails={setSelectedWatch} wishlist={wishlist} onToggleWishlist={toggleWishlist} cart={cart} onUpdateQty={updateQty} isProductsLoading={isProductsLoading} />} />
          <Route path="/shop" element={<Shop onAddToCart={addToCart} watches={watches} onViewDetails={setSelectedWatch} wishlist={wishlist} onToggleWishlist={toggleWishlist} cart={cart} onUpdateQty={updateQty} />} />
          <Route path="/product/:id" element={<ProductPage onAddToCart={addToCart} watches={watches} wishlist={wishlist} onToggleWishlist={toggleWishlist} cart={cart} onUpdateQty={updateQty} />} />
          <Route 
            path="/checkout" 
            element={
              <Checkout 
                items={cart} 
                user={user}
                onSuccess={() => {
                  setCart([]);
                }} 
              />
            } 
          />
          <Route path="/success" element={<Success />} />
          <Route path="/login" element={<AuthPage user={user} />} />
          <Route path="/update-password" element={<AuthPage user={user} modeOverride="reset" />} />
          <Route 
            path="/profile" 
            element={
              <ProfilePage 
                user={user} 
                wishlist={wishlist} 
                onToggleWishlist={toggleWishlist} 
                onAddToCart={addToCart} 
                watches={watches} 
              />
            } 
          />
          <Route path="/admin" element={<AdminDashboard user={user} />} />
          <Route path="/about" element={
            <div className="pt-32 pb-24 px-6 text-center max-w-2xl mx-auto space-y-8">
              <h1 className="text-4xl font-serif font-bold">Our Story</h1>
              <p className="text-gray-500 leading-relaxed text-lg font-light">
                Pingaksh was born out of a desire to bridge the gap between iconic luxury layouts and accessible elegance. 
                We craft high-quality, luxury-inspired statement timepieces shaped after legendary historic layouts, ensuring every client experiences remarkable posture and character on the wrist without the standard industry markups.
              </p>
              <img 
                src="https://images.unsplash.com/photo-1509048191080-d2984bad6ad5?auto=format&fit=crop&q=80&w=1200" 
                alt="Watchmaking" 
                className="w-full h-[500px] object-cover grayscale rounded-lg shadow-2xl"
                referrerPolicy="no-referrer"
              />
              <p className="text-gray-500 leading-relaxed text-lg">
                Every watch in our collection is meticulously inspected and crafted using premium materials, 
                ensuring that your Pingaksh timepiece lasts for generations.
              </p>
            </div>
          } />
          
          <Route path="/shipping" element={
            <InfoPage 
              title="Shipping Policy" 
              content={
                <div className="space-y-6 text-neutral-300">
                  <p>We provide complimentary secure express air delivery exclusively inside India on all high-caliber purchases. Standard delivery is completely covered with end-to-end transit insurance.</p>
                  <h3 className="text-xl font-medium text-gold font-serif mt-6">Delivery Coverage & Parameters</h3>
                  <ul className="list-disc pl-6 space-y-2 text-neutral-400">
                    <li>Shipping availability: <strong className="text-white">India coordinates only (Domestic)</strong></li>
                    <li>Estimated delivery time: <strong className="text-white">4–7 business days</strong></li>
                    <li>Transit courier: Blue Dart / Delhivery Secure Air Premium</li>
                  </ul>
                  <p className="text-neutral-450 text-sm italic">All timepieces are securely packaged inside our signature premium shockproof presentation cases and shipped with full insurance coverage against flight or logistic incidents.</p>
                </div>
              } 
            />
          } />
          
          <Route path="/returns" element={
            <InfoPage 
              title="Returns & Exchanges" 
              content={
                <div className="space-y-6 text-neutral-300">
                  <p>We take immense pride in the craftsmanship of our luxury-inspired timepieces. If you are not completely satisfied with your purchase, we offer a 30-day premium return policy.</p>
                  <h3 className="text-xl font-medium text-gold font-serif mt-6">Acceptance Guidelines</h3>
                  <ul className="list-disc pl-6 space-y-2 text-neutral-400">
                    <li>Watch must be in pristine, completely unworn condition.</li>
                    <li>All mechanical casing seals, protective stickers, and tags must remain perfectly intact.</li>
                    <li>The original black luxury presentation case and accompanying certificate files must be included.</li>
                  </ul>
                  <p>To initiate a secure return return process, contact our technical support division at <span className="text-gold font-bold">support@pingaksh.luxury</span> within 30 days of receiving your package.</p>
                </div>
              } 
            />
          } />

          <Route path="/warranty" element={
            <InfoPage 
              title="Warranty & Care" 
              content={
                <div className="space-y-6 text-neutral-300">
                  <p>Your Pingaksh timepiece is certified by an official 2-year technical warranty starting on your purchase confirmation date.</p>
                  <h3 className="text-xl font-medium text-gold font-serif mt-6">Included Coverages</h3>
                  <p className="text-neutral-400">The warranty spans structural manufacturing issues, including internal movement calibrator faults, alignment complications, and hands/dial abnormalities.</p>
                  <h3 className="text-xl font-medium text-gold font-serif mt-6">Atelier Care Guidelines</h3>
                  <p className="text-neutral-400">Avoid exposure to extreme thermal jumps, intense magnetic alignments (e.g., speaker coils), and chemical agents. We recommend mechanism servicing once every 3 years.</p>
                </div>
              } 
            />
          } />

          <Route path="/contact" element={<ContactPage />} />

          <Route path="/faq" element={<FAQ />} />
        </Routes>

        <Footer />
      </div>
    </Router>
    </div>
    )}
    </AnimatePresence>
  );
}

const ContactPage = () => {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.message) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccess("Dossier dispatched. Our luxury concierge team is reviewing your transmission and will respond within 24 business hours.");
      setFormData({ name: "", email: "", message: "" });
    }, 1200);
  };

  return (
    <div className="pt-40 pb-24 px-6 min-h-screen bg-neutral-950 text-white">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
        <div className="lg:col-span-5 space-y-10">
          <div className="space-y-3">
            <span className="text-gold text-xs font-mono tracking-[0.3em] uppercase block">Connoisseur Concierge</span>
            <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight">Contact Us</h1>
            <p className="text-neutral-400 text-sm leading-relaxed max-w-sm font-light">
              Our Jaipur-based mechanical headquarters and concierge lines are calibrated to serve you. Reach our master builders and watch selection experts here.
            </p>
          </div>
          <div className="space-y-6 pt-4 border-t border-neutral-900/80">
            <div>
              <h4 className="text-[10px] font-mono tracking-widest text-gold uppercase mb-1">Corporate & Concierge Lines</h4>
              <p className="text-base text-neutral-200">concierge@pingaksh.luxury</p>
            </div>
            <div>
              <h4 className="text-[10px] font-mono tracking-widest text-gold uppercase mb-1">Warranty & Technical Labs</h4>
              <p className="text-base text-neutral-200">support@pingaksh.luxury</p>
            </div>
            <div>
              <h4 className="text-[10px] font-mono tracking-widest text-gold uppercase mb-1">Jaipur Head Atelier</h4>
              <p className="text-base text-neutral-200">101 Heritage Plaza, Jaipur, Rajasthan, India</p>
            </div>
          </div>
        </div>
        <div className="lg:col-span-7 bg-neutral-900/10 border border-neutral-900/80 p-8 md:p-12 rounded-3xl backdrop-blur-md">
          {success ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12 space-y-4"
            >
              <div className="w-16 h-16 bg-gold/10 text-gold rounded-full flex items-center justify-center mx-auto border border-gold/30">
                <Check size={28} />
              </div>
              <h3 className="text-xl font-serif font-bold text-white">Transmission Received</h3>
              <p className="text-neutral-400 text-sm max-w-sm mx-auto leading-relaxed">{success}</p>
              <button 
                onClick={() => setSuccess(null)}
                className="mt-6 text-xs text-gold font-mono tracking-widest hover:underline uppercase"
              >
                Send New Transmission
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase">Primary Name</label>
                <input 
                  type="text" 
                  placeholder="e.g., Vikram Sharma" 
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="bg-neutral-950/80 border border-neutral-900 text-sm w-full p-4 rounded-xl focus:border-gold outline-none text-white transition-colors" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase">Secure Email Coordinates *</label>
                <input 
                  type="email" 
                  required
                  placeholder="name@address.com" 
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="bg-neutral-950/80 border border-neutral-900 text-sm w-full p-4 rounded-xl focus:border-gold outline-none text-white transition-colors" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono tracking-wider text-neutral-400 uppercase">Custom Message *</label>
                <textarea 
                  required
                  rows={5} 
                  placeholder="Inquire about custom case finishes, dial complications, or secure express domestic delivery arrangements..." 
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  className="bg-neutral-950/80 border border-neutral-900 text-sm w-full p-4 rounded-xl focus:border-gold outline-none text-white transition-colors resize-none"
                />
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-gold text-black py-4 rounded-xl font-bold tracking-widest text-xs hover:bg-white hover:text-black transition-all uppercase flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Dispatched Transmission..." : "Dispatch Secure Message"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs = [
    {
      q: "Do you ship across India?",
      a: "Yes, we ship exclusively inside India coordinates. Free secure express air shipping is calibrated for all orders. Delivery takes 4–7 business days with active transit tracking."
    },
    {
      q: "What does the Pingaksh product warranty cover?",
      a: "Every timepiece is certified with an official 2-year warranty from the date of acquisition. It covers manufacturing defects including mechanical movement calibration and dial anomalies."
    },
    {
      q: "What is your return policy?",
      a: "Returns of pristine unworn pieces with casing seals and tags intact are supported within 30 days of receipt. Send us an email at support@pingaksh.luxury to coordinate secure return dispatch."
    },
    {
      q: "How can I track my active order?",
      a: "Once logistic pipelines acquire your shipment, you will receive an email confirmation containing secure tracking link credentials to inspect delivery timeline progress."
    },
    {
      q: "How should I clean the leather strap?",
      a: "Use a dry or slightly damp premium microfiber cloth. Avoid strong chemical solvents, alignments near intense magnetic forces, or submersion, guarding the exquisite natural animal skin finish."
    }
  ];

  return (
    <div className="pt-48 pb-28 px-6 min-h-screen bg-black">
      <div className="max-w-3xl mx-auto space-y-16">
        <div className="text-center space-y-4">
          <span className="text-gold text-xs font-mono tracking-[0.3em] uppercase block">Assistance Center</span>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white tracking-tight">Frequently Asked Questions</h1>
          <p className="text-neutral-400 text-sm max-w-lg mx-auto">Everything you need to know about your Pingaksh timepiece registration and ownership experience.</p>
        </div>
        
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-neutral-900 bg-neutral-950/40 rounded-xl overflow-hidden transition-all duration-300 hover:border-gold/20">
              <button 
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-neutral-900/30 transition-colors"
              >
                <span className="font-serif font-semibold text-white text-base md:text-lg">{faq.q}</span>
                {openIndex === i ? <ChevronUp size={18} className="text-gold" /> : <ChevronDown size={18} className="text-neutral-500" />}
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 pt-0 text-neutral-400 font-light text-sm md:text-base leading-relaxed border-t border-neutral-950/80 mt-2">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
        
        <div className="pt-12 border-t border-neutral-900 text-center">
          <p className="text-neutral-500 mb-6">Still have questions?</p>
          <Link to="/contact" className="inline-block border border-gold text-gold px-10 py-4 font-bold tracking-widest hover:bg-gold hover:text-black transition-colors text-xs">
            CONTACT CONCIERGE
          </Link>
        </div>
      </div>
    </div>
  );
};

// --- Admin Dashboard Component ---

const AdminDashboard = ({ user }: { user: CustomUser | null }) => {
  const [watches, setWatches] = useState<Watch[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    price: 0,
    category: "Classic" as Watch["category"],
    image: "",
    description: ""
  });

  const isAdmin = user?.email === "chanchaltailor404@gmail.com";
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!isAdmin) return;

    if (isSupabaseConfigured && supabase) {
      const loadAdminProducts = async () => {
        try {
          const dbProducts = await getSupabaseProducts();
          setWatches(dbProducts as Watch[]);
        } catch (err) {
          console.error("Failed loading products for admin:", err);
        }
      };
      loadAdminProducts();

      // Realtime listener
      const channel = supabase
        .channel("admin-realtime-products")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "products" },
          () => {
            loadAdminProducts();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setWatches(WATCHES);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    if (isSupabaseConfigured && supabase) {
      const loadOrders = async () => {
        try {
          const dbOrders = await getSupabaseAllOrders();
          setOrders(dbOrders);
        } catch (err) {
          console.error("Error loading admin orders from Supabase:", err);
        }
      };
      loadOrders();

      const ordersChannel = supabase
        .channel("admin-realtime-orders")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "orders" },
          () => {
            loadOrders();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(ordersChannel);
      };
    }
  }, [isAdmin]);

  const handleUpdateStatus = async (orderId: string, status: any) => {
    try {
      if (isSupabaseConfigured && supabase) {
        await updateSupabaseOrderStatus(orderId, status);
        const dbOrders = await getSupabaseAllOrders();
        setOrders(dbOrders);
      }
    } catch (err) {
      console.error("Error updating order status:", err);
    }
  };

  const handleLogin = async () => {
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin + "/admin"
          }
        });
      } else {
        const mockUser = {
          uid: "usr_mockgoogle123",
          email: "chanchaltailor404@gmail.com",
          displayName: "Exalted Lead"
        };
        localStorage.setItem("pingaksh_mock_user", JSON.stringify(mockUser));
        window.location.reload();
      }
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  const handleLogout = async () => {
    try {
      if (isSupabaseConfigured && supabase) {
        await supabase.auth.signOut();
      } else {
        localStorage.removeItem("pingaksh_mock_user");
        window.location.reload();
      }
    } catch (err) {
      console.error("Critical error while signing out in admin dashboard:", err);
      localStorage.removeItem("pingaksh_mock_user");
      window.location.reload();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isSupabaseConfigured && supabase) {
        if (editingId) {
          const { error } = await supabase
            .from("products")
            .update(formData)
            .eq("id", editingId);
          if (error) throw error;
          setEditingId(null);
        } else {
          const { error } = await supabase
            .from("products")
            .insert([formData]);
          if (error) throw error;
          setIsAdding(false);
        }
      } else {
        if (editingId) {
          setWatches(prev => prev.map(w => w.id === editingId ? { ...w, ...formData } : w));
          setEditingId(null);
        } else {
          const newId = "wtch_local_" + Math.floor(Math.random() * 10000);
          setWatches(prev => [...prev, { id: newId, ...formData }]);
          setIsAdding(false);
        }
      }
      setFormData({ name: "", price: 0, category: "Classic", image: "", description: "" });
    } catch (err) {
      console.error("Operation failed:", err);
      alert("Permission denied or error occurred.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this watch?")) return;
    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase
          .from("products")
          .delete()
          .eq("id", id);
        if (error) throw error;
      } else {
        setWatches(prev => prev.filter(w => w.id !== id));
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  if (!user) {
    return (
      <div className="pt-40 pb-24 px-6 text-center">
        <div className="max-w-md mx-auto space-y-6">
          <h1 className="text-3xl font-serif font-bold">Seller Login</h1>
          <p className="text-gray-500">Please sign in with your Google account to manage your watches.</p>
          <button 
            onClick={handleLogin}
            className="w-full bg-black text-white py-4 font-bold tracking-widest hover:bg-gold transition-colors flex items-center justify-center gap-3"
          >
            <User size={20} /> SIGN IN WITH GOOGLE
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="pt-40 pb-24 px-6 text-center">
        <div className="max-w-md mx-auto space-y-6">
          <h1 className="text-3xl font-serif font-bold text-red-500">Access Denied</h1>
          <p className="text-gray-500">You do not have permission to access the seller dashboard.</p>
          <button onClick={handleLogout} className="text-gold font-bold hover:underline">LOGOUT</button>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24 px-6">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-serif font-bold">Seller Dashboard</h1>
            <p className="text-gray-500 mt-2">Manage your luxury watch collection.</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={async () => {
                if (!confirm("Seed initial watches?")) return;
                const mockWatches = [
                  { name: "Aurelius Gold", price: 299, category: "Luxury", image: "https://images.unsplash.com/photo-1524592091214-8c97af1c0db4?auto=format&fit=crop&q=80&w=800", description: "A timeless masterpiece with 18k gold plating and sapphire glass." },
                  { name: "Midnight Chrono", price: 189, category: "Sport", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800", description: "Sleek black finish with precision chronograph movement." },
                  { name: "Nordic Silver", price: 149, category: "Minimalist", image: "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&q=80&w=800", description: "Pure Scandinavian design for the modern minimalist." },
                  { name: "Heritage Classic", price: 259, category: "Classic", image: "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&q=80&w=800", description: "Vintage inspired design with premium leather strap." },
                  { name: "Oceanic Diver", price: 349, category: "Sport", image: "https://images.unsplash.com/photo-1614164185128-e4ec99c436d7?auto=format&fit=crop&q=80&w=800", description: "Water resistant up to 200m, perfect for the adventurous." },
                  { name: "Stellar Rose", price: 219, category: "Luxury", image: "https://images.unsplash.com/photo-1533139502658-0198f920d8e8?auto=format&fit=crop&q=80&w=800", description: "Elegant rose gold finish with delicate detailing." }
                ];
                for (const w of mockWatches) {
                  try {
                    if (isSupabaseConfigured && supabase) {
                      const { error } = await supabase.from("products").insert([w]);
                      if (error) throw error;
                    } else {
                      const newId = "wtch_local_" + Math.floor(Math.random() * 10000);
                      setWatches(prev => [...prev, { id: newId, ...w }]);
                    }
                  } catch (dbErr) {
                    console.error("Supabase seed error: ", dbErr);
                  }
                }
              }}
              className="border border-gold text-gold px-4 py-3 font-bold text-xs tracking-widest hover:bg-gold hover:text-black transition-all"
            >
              SEED DATA
            </button>
            <button 
              onClick={() => setIsAdding(!isAdding)}
              className="bg-gold text-black px-6 py-3 font-bold text-sm tracking-widest hover:bg-black hover:text-white transition-all flex items-center gap-2"
            >
              <Plus size={18} /> {isAdding ? "CANCEL" : "ADD WATCH"}
            </button>
            <button onClick={handleLogout} className="p-3 border border-gray-200 hover:bg-gray-50 transition-colors">
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {isAdding || editingId ? (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-50 p-8 border border-gray-100"
          >
            <h2 className="text-xl font-serif font-bold mb-8">{editingId ? "Edit Watch" : "Add New Watch"}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <input 
                  required
                  placeholder="Watch Name"
                  className="w-full p-3 border border-gray-200 bg-white"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
                <input 
                  required
                  type="number"
                  placeholder="Price (₹)"
                  className="w-full p-3 border border-gray-200 bg-white"
                  value={formData.price || ""}
                  onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                />
                <select 
                  className="w-full p-3 border border-gray-200 bg-white"
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value as Watch["category"]})}
                >
                  <option value="Classic">Classic</option>
                  <option value="Sport">Sport</option>
                  <option value="Minimalist">Minimalist</option>
                  <option value="Luxury">Luxury</option>
                </select>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-gray-500 uppercase tracking-widest mb-1.5 font-bold">Image Source</label>
                  <input 
                    required
                    placeholder="Image URL"
                    className="w-full p-3 border border-gray-200 bg-white"
                    value={formData.image}
                    onChange={e => setFormData({...formData, image: e.target.value})}
                  />
                </div>
                
                {/* Local file uploader supporting clicking or drag-and-drop */}
                <div 
                  className="border border-dashed border-gray-300 rounded-lg p-4 bg-gray-50/50 hover:bg-gray-100 transition-all text-center relative pointer-events-auto cursor-pointer flex flex-col justify-center items-center h-24"
                >
                  <input 
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (loadEvent) => {
                          if (loadEvent.target?.result) {
                            setFormData({...formData, image: loadEvent.target.result as string});
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <div className="text-gray-500 space-y-1">
                    <p className="text-[11px] font-mono font-semibold text-neutral-700">Drag & Drop or Click to Upload Local Image</p>
                    <p className="text-[9px] text-neutral-400 font-sans">Supports raw files seamlessly</p>
                  </div>
                  {formData.image && formData.image.startsWith("data:") && (
                    <span className="absolute bottom-1 right-2 text-[8px] font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Local Image Loaded ✔</span>
                  )}
                </div>

                {/* Preset presets to populate watch images quickly */}
                <div className="space-y-1">
                  <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider font-semibold">Or use a real luxury watch image preset:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { name: "Gold Chrono", url: "https://images.unsplash.com/photo-1524592091214-8c97af1c0db4?auto=format&fit=crop&q=80&w=800" },
                      { name: "Sleek Dark", url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800" },
                      { name: "Minimalist", url: "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&q=80&w=800" },
                      { name: "Rose Classic", url: "https://images.unsplash.com/photo-1533139502658-0198f920d8e8?auto=format&fit=crop&q=80&w=800" }
                    ].map((preset) => (
                      <button
                        type="button"
                        key={preset.name}
                        onClick={() => setFormData({...formData, image: preset.url})}
                        className="text-[9px] font-mono bg-white border border-gray-200 rounded px-2 py-1 text-gray-600 hover:border-gold hover:text-gold transition-colors"
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea 
                  placeholder="Description"
                  className="w-full p-3 border border-gray-200 bg-white h-[90px]"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div className="md:col-span-2">
                <button className="w-full bg-black text-white py-4 font-bold tracking-widest hover:bg-gold transition-colors">
                  {editingId ? "UPDATE WATCH" : "SAVE WATCH"}
                </button>
              </div>
            </form>
          </motion.div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {watches.map(watch => (
            <div key={watch.id} className="bg-white border border-gray-100 p-4 flex gap-4 group">
              <div className="w-24 h-24 bg-gray-50 overflow-hidden shrink-0">
                <img src={watch.image} alt={watch.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm">{watch.name}</h3>
                  <p className="text-xs text-gray-500 uppercase tracking-widest">{watch.category}</p>
                  <p className="font-bold text-gold mt-1">{getFormattedPrice(watch.price)}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setEditingId(watch.id);
                      setFormData({
                        name: watch.name,
                        price: watch.price,
                        category: watch.category,
                        image: watch.image,
                        description: watch.description || ""
                      });
                    }}
                    className="p-2 text-gray-400 hover:text-black transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(watch.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {isSupabaseConfigured && orders.length > 0 && (
          <div className="space-y-6 pt-12 border-t border-neutral-900">
            <div>
              <h2 className="text-2xl font-serif font-bold text-white">Logistics & Shipments</h2>
              <p className="text-gray-500 mt-2">Manage customer watch orders and calibrate transit phases.</p>
            </div>
            
            <div className="overflow-x-auto bg-neutral-950/40 border border-neutral-900 rounded-2xl p-6">
              <table className="w-full text-left border-collapse text-sm text-neutral-300">
                <thead>
                  <tr className="border-b border-neutral-850 text-neutral-400 font-mono text-xs uppercase tracking-wider">
                    <th className="py-4 px-4">Order ID</th>
                    <th className="py-4 px-4">Customer</th>
                    <th className="py-4 px-4">Total</th>
                    <th className="py-4 px-4">Transit Status</th>
                    <th className="py-4 px-4">Calibrate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900/40 font-sans">
                  {orders.map((ord: any) => (
                    <tr key={ord.id} className="hover:bg-neutral-950/20">
                      <td className="py-4 px-4 font-mono font-bold text-xs text-gold">
                        {ord.id.substring(0, 8).toUpperCase()}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-semibold text-white">{ord.customer_email}</div>
                        <div className="text-xs text-neutral-500 font-mono">{ord.created_at ? new Date(ord.created_at).toLocaleDateString() : ""}</div>
                      </td>
                      <td className="py-4 px-4 font-bold text-white font-mono">
                        {getFormattedPrice(ord.total)}
                      </td>
                      <td className="py-4 px-4 font-mono text-xs uppercase">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                          ord.status === "fulfilled" ? "bg-green-950 text-green-300 border border-green-900/40" :
                          ord.status === "cancelled" ? "bg-red-950 text-red-300 border border-red-900/40" :
                          ord.status === "calibrating" ? "bg-amber-950 text-amber-300 border border-amber-900/40" :
                          "bg-neutral-900 text-neutral-300 border border-neutral-800"
                        }`}>
                          {ord.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <select
                          value={ord.status}
                          onChange={(e) => handleUpdateStatus(ord.id, e.target.value as any)}
                          className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-gold"
                        >
                          <option value="calibrating">Calibrating</option>
                          <option value="transit">Transit</option>
                          <option value="customs">Customs</option>
                          <option value="fulfilled">Fulfilled</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
