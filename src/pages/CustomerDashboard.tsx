import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import LanguageSelector from "@/components/LanguageSelector";
import NotificationBell from "@/components/NotificationBell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  ShoppingBag, ShoppingCart, LogOut, Package, Search, Plus, Minus,
  Trash2, MapPin, Leaf, Clock, CreditCard, Banknote, CheckCircle2, ArrowLeft, User, Star
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import logo from "@/assets/logo.png";

interface Product {
  id: string;
  name: string;
  price: number;
  quantity: string;
  unit: string | null;
  category: string | null;
  description: string | null;
  image_url: string | null;
  freshness_days: number | null;
  farmer_id: string;
  available: boolean | null;
  farmer_name?: string;
  farmer_district?: string;
}

interface CartItem extends Product {
  cartQty: number;
}

interface Order {
  id: string;
  status: string;
  quantity: number;
  total_price: number;
  payment_method: string | null;
  created_at: string;
  products?: { name: string; price: number; unit: string | null; image_url: string | null } | null;
  product_id: string;
}

interface Review {
  id: string;
  product_id: string;
  order_id: string;
  customer_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

const CATEGORIES = ["All", "Vegetables", "Fruits", "Grains", "Spices", "Dairy", "Other"];

const CustomerDashboard = () => {
  const { t } = useLanguage();
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeView, setActiveView] = useState<"shop" | "orders" | "cart" | "checkout" | "profile">("shop");
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cod">("online");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    district: "",
    state: "",
    pincode: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        address: profile.address || "",
        district: profile.district || "",
        state: profile.state || "",
        pincode: profile.pincode || "",
      });
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: profileForm.full_name.trim(),
        phone: profileForm.phone.trim(),
        address: profileForm.address.trim(),
        district: profileForm.district.trim(),
        state: profileForm.state.trim(),
        pincode: profileForm.pincode.trim(),
      })
      .eq("user_id", user.id);

    setSavingProfile(false);
    if (error) {
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    } else {
      toast({ title: "Profile updated", description: "Your details have been saved" });
    }
  };

  useEffect(() => {
    fetchProducts();
    if (user) fetchOrders();
  }, [user]);

  const fetchProducts = async () => {
    const { data: prods } = await supabase
      .from("products")
      .select("*")
      .eq("available", true);

    if (prods) {
      // Enrich with farmer info
      const farmerIds = [...new Set(prods.map((p) => p.farmer_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, district")
        .in("user_id", farmerIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);
      const enriched = prods.map((p) => ({
        ...p,
        farmer_name: profileMap.get(p.farmer_id)?.full_name || "Farmer",
        farmer_district: profileMap.get(p.farmer_id)?.district || undefined,
      }));
      setProducts(enriched);
    }
  };

  const fetchOrders = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("orders")
      .select("*, products(name, price, unit, image_url)")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setOrders(data as unknown as Order[]);
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "All" || p.category === category;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const exists = prev.find((p) => p.id === product.id);
      if (exists) {
        return prev.map((p) => p.id === product.id ? { ...p, cartQty: p.cartQty + 1 } : p);
      }
      return [...prev, { ...product, cartQty: 1 }];
    });
    toast({ title: `${product.name} added to cart` });
  };

  const updateCartQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((p) => (p.id === id ? { ...p, cartQty: Math.max(0, p.cartQty + delta) } : p))
        .filter((p) => p.cartQty > 0)
    );
  };

  const cartTotal = cart.reduce((s, i) => s + i.price * i.cartQty, 0);

  const placeOrder = async () => {
    if (!user || cart.length === 0) return;
    setPlacingOrder(true);

    try {
      for (const item of cart) {
        const { error } = await supabase.from("orders").insert({
          customer_id: user.id,
          product_id: item.id,
          farmer_id: item.farmer_id,
          quantity: item.cartQty,
          total_price: item.price * item.cartQty,
          payment_method: paymentMethod,
        });
        if (error) throw error;
      }
      setCart([]);
      setOrderSuccess(true);
      fetchOrders();
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to place order. Please try again.", variant: "destructive" });
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      shipped: "bg-purple-100 text-purple-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return styles[status] || "bg-muted text-muted-foreground";
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} alt="AgroAssist" className="h-8 w-8 rounded-lg" />
            <span className="font-heading font-extrabold text-primary">AgroAssist</span>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <LanguageSelector />
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex gap-1" onClick={() => setActiveView("profile")}>
              <User className="h-4 w-4" />
              <span className="text-sm font-medium text-foreground">{profile?.full_name}</span>
            </Button>
            <Button variant="ghost" size="sm" className="gap-1 text-destructive" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container py-6 pb-24">
        {/* ========== SHOP VIEW ========== */}
        {activeView === "shop" && (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-heading font-black text-foreground">Fresh from Farm 🌾</h2>
              <p className="text-muted-foreground text-sm mt-1">Buy directly from local farmers at the best prices</p>
            </div>

            {/* Search & Filter */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <p className="text-sm text-muted-foreground">{filteredProducts.length} products found</p>

            {/* Product Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-card-hover transition-all group">
                  <div className="h-40 bg-secondary flex items-center justify-center overflow-hidden">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <Leaf className="h-12 w-12 text-muted-foreground/30" />
                    )}
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <div className="flex items-start justify-between">
                        <h3 className="font-heading font-bold text-foreground">{product.name}</h3>
                        {product.category && (
                          <span className="text-xs bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">{product.category}</span>
                        )}
                      </div>
                      {product.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>{product.farmer_name}</span>
                      {product.farmer_district && (
                        <>
                          <MapPin className="h-3 w-3" />
                          <span>{product.farmer_district}</span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-lg font-heading font-black text-primary">₹{product.price}<span className="text-xs font-normal text-muted-foreground">/{product.unit || "kg"}</span></span>
                      <span className="text-xs text-muted-foreground">{product.quantity} available</span>
                    </div>

                    {product.freshness_days != null && product.freshness_days <= 3 && (
                      <div className="flex items-center gap-1 text-xs font-medium text-destructive bg-destructive/10 px-2 py-1 rounded-md">
                        <Clock className="h-3 w-3" />
                        {product.freshness_days} day{product.freshness_days > 1 ? "s" : ""} freshness left!
                      </div>
                    )}

                    <Button size="sm" className="w-full font-heading font-bold gap-2" onClick={() => addToCart(product)}>
                      <ShoppingCart className="h-4 w-4" /> Add to Cart
                    </Button>
                  </div>
                </div>
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  <Leaf className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">No products found</p>
                  <p className="text-sm mt-1">Try changing your search or filter</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========== CART VIEW ========== */}
        {activeView === "cart" && (
          <div className="space-y-5">
            <h2 className="text-2xl font-heading font-black text-foreground">Your Cart</h2>
            {cart.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-12 text-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">Your cart is empty</p>
                <Button onClick={() => setActiveView("shop")} className="mt-4 font-heading font-bold">Browse Products</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                    <div className="h-16 w-16 rounded-lg bg-secondary overflow-hidden shrink-0">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Leaf className="h-6 w-6 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading font-bold text-sm truncate">{item.name}</h3>
                      <p className="text-xs text-muted-foreground">₹{item.price}/{item.unit || "kg"}</p>
                      <p className="text-xs text-muted-foreground">by {item.farmer_name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateCartQty(item.id, -1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="font-heading font-bold text-sm w-6 text-center">{item.cartQty}</span>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateCartQty(item.id, 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-heading font-bold text-primary">₹{item.price * item.cartQty}</p>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => setCart((c) => c.filter((ci) => ci.id !== item.id))}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}

                <div className="bg-card border border-border rounded-xl p-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Items ({cart.reduce((s, i) => s + i.cartQty, 0)})</span>
                    <span className="font-heading font-bold">₹{cartTotal}</span>
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between items-center">
                    <span className="font-heading font-bold text-lg">Total</span>
                    <span className="font-heading font-black text-xl text-primary">₹{cartTotal}</span>
                  </div>
                  <Button className="w-full font-heading font-bold" size="lg" onClick={() => { setActiveView("checkout"); setOrderSuccess(false); }}>
                    Proceed to Checkout
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========== CHECKOUT VIEW ========== */}
        {activeView === "checkout" && (
          <div className="space-y-5 max-w-lg mx-auto">
            {orderSuccess ? (
              <div className="bg-card border border-primary/30 rounded-xl p-8 text-center space-y-4">
                <CheckCircle2 className="h-16 w-16 text-primary mx-auto" />
                <h2 className="text-2xl font-heading font-black text-foreground">Order Placed! 🎉</h2>
                <p className="text-muted-foreground">Your order has been placed successfully. The farmer will prepare your fresh produce.</p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => { setActiveView("orders"); setOrderSuccess(false); }} className="font-heading font-bold">
                    View Orders
                  </Button>
                  <Button variant="outline" onClick={() => { setActiveView("shop"); setOrderSuccess(false); }} className="font-heading font-bold">
                    Continue Shopping
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="gap-2" onClick={() => setActiveView("cart")}>
                  <ArrowLeft className="h-4 w-4" /> Back to Cart
                </Button>
                <h2 className="text-2xl font-heading font-black text-foreground">Checkout</h2>

                {/* Order Summary */}
                <div className="bg-card border border-border rounded-xl p-5 space-y-3">
                  <h3 className="font-heading font-bold">Order Summary</h3>
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{item.name} × {item.cartQty}</span>
                      <span className="font-medium">₹{item.price * item.cartQty}</span>
                    </div>
                  ))}
                  <div className="border-t border-border pt-3 flex justify-between">
                    <span className="font-heading font-bold">Total</span>
                    <span className="font-heading font-black text-primary">₹{cartTotal}</span>
                  </div>
                </div>

                {/* Delivery Address */}
                <div className="bg-card border border-border rounded-xl p-5 space-y-2">
                  <h3 className="font-heading font-bold flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Delivery Address
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {profile?.address || "No address set"}{profile?.district ? `, ${profile.district}` : ""}{profile?.state ? `, ${profile.state}` : ""}{profile?.pincode ? ` - ${profile.pincode}` : ""}
                  </p>
                </div>

                {/* Payment Method */}
                <div className="bg-card border border-border rounded-xl p-5 space-y-3">
                  <h3 className="font-heading font-bold">Payment Method</h3>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setPaymentMethod("online")}
                      className={`flex-1 p-4 rounded-xl border-2 transition-colors text-center ${
                        paymentMethod === "online" ? "border-primary bg-primary/5" : "border-border"
                      }`}
                    >
                      <CreditCard className={`h-6 w-6 mx-auto mb-2 ${paymentMethod === "online" ? "text-primary" : "text-muted-foreground"}`} />
                      <p className="font-heading font-bold text-sm">Online Payment</p>
                      <p className="text-xs text-muted-foreground">UPI / Card</p>
                    </button>
                    <button
                      onClick={() => setPaymentMethod("cod")}
                      className={`flex-1 p-4 rounded-xl border-2 transition-colors text-center ${
                        paymentMethod === "cod" ? "border-primary bg-primary/5" : "border-border"
                      }`}
                    >
                      <Banknote className={`h-6 w-6 mx-auto mb-2 ${paymentMethod === "cod" ? "text-primary" : "text-muted-foreground"}`} />
                      <p className="font-heading font-bold text-sm">Cash on Delivery</p>
                      <p className="text-xs text-muted-foreground">Pay when delivered</p>
                    </button>
                  </div>
                </div>

                <Button
                  className="w-full font-heading font-bold"
                  size="lg"
                  onClick={placeOrder}
                  disabled={placingOrder}
                >
                  {placingOrder ? "Placing Order..." : `Pay ₹${cartTotal}`}
                </Button>
              </>
            )}
          </div>
        )}

        {/* ========== ORDERS VIEW ========== */}
        {activeView === "orders" && (
          <div className="space-y-5">
            <h2 className="text-2xl font-heading font-black text-foreground">My Orders</h2>
            {orders.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">No orders yet</p>
                <Button onClick={() => setActiveView("shop")} className="mt-4 font-heading font-bold">Start Shopping</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div key={order.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                    <div className="h-14 w-14 rounded-lg bg-secondary overflow-hidden shrink-0 flex items-center justify-center">
                      {order.products?.image_url ? (
                        <img src={order.products.image_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <Package className="h-6 w-6 text-muted-foreground/30" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-heading font-bold text-sm truncate">{order.products?.name || "Product"}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Qty: {order.quantity} · ₹{order.total_price} · {order.payment_method === "cod" ? "Cash on Delivery" : "Online"}
                      </p>
                      <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========== PROFILE VIEW ========== */}
        {activeView === "profile" && (
          <div className="space-y-5 max-w-lg mx-auto">
            <h2 className="text-2xl font-heading font-black text-foreground">My Profile 👤</h2>
            <p className="text-muted-foreground text-sm">Update your personal details and delivery address</p>

            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Full Name</label>
                <Input value={profileForm.full_name} onChange={(e) => setProfileForm(f => ({ ...f, full_name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email</label>
                <Input value={profileForm.email} disabled className="opacity-60" />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Phone</label>
                <Input value={profileForm.phone} onChange={(e) => setProfileForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" />
              </div>

              <hr className="border-border" />
              <h3 className="font-heading font-bold text-foreground flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Delivery Address</h3>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Address</label>
                <Input value={profileForm.address} onChange={(e) => setProfileForm(f => ({ ...f, address: e.target.value }))} placeholder="House no, street, area" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">District</label>
                  <Input value={profileForm.district} onChange={(e) => setProfileForm(f => ({ ...f, district: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">State</label>
                  <Input value={profileForm.state} onChange={(e) => setProfileForm(f => ({ ...f, state: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Pincode</label>
                <Input value={profileForm.pincode} onChange={(e) => setProfileForm(f => ({ ...f, pincode: e.target.value }))} placeholder="6-digit pincode" maxLength={6} />
              </div>

              <Button onClick={handleSaveProfile} disabled={savingProfile || !profileForm.full_name.trim()} className="w-full mt-2">
                {savingProfile ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Nav - Mobile */}
      <nav className="sm:hidden sticky bottom-0 border-t border-border bg-card">
        <div className="flex justify-around py-2">
          {[
            { id: "shop" as const, icon: ShoppingBag, label: "Shop" },
            { id: "cart" as const, icon: ShoppingCart, label: `Cart (${cart.length})` },
            { id: "orders" as const, icon: Package, label: "Orders" },
            { id: "profile" as const, icon: User, label: "Profile" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium ${
                activeView === tab.id ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <tab.icon className="h-5 w-5" />
              {tab.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default CustomerDashboard;
