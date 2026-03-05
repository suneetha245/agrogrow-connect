import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import LanguageSelector from "@/components/LanguageSelector";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ShoppingBag, ShoppingCart, User, LogOut, Package, Phone } from "lucide-react";
import logo from "@/assets/logo.png";

const CustomerDashboard = () => {
  const { t } = useLanguage();
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeView, setActiveView] = useState<"shop" | "orders" | "cart">("shop");
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    fetchProducts();
    if (user) fetchOrders();
  }, [user]);

  const fetchProducts = async () => {
    const { data } = await supabase.from("products").select("*").eq("available", true);
    if (data) setProducts(data);
  };

  const fetchOrders = async () => {
    if (!user) return;
    const { data } = await supabase.from("orders").select("*, products(name, price, unit)").eq("customer_id", user.id);
    if (data) setOrders(data);
  };

  const addToCart = (product: any) => {
    setCart((prev) => {
      const exists = prev.find((p) => p.id === product.id);
      if (exists) return prev;
      return [...prev, { ...product, cartQty: 1 }];
    });
    toast({ title: `${product.name} added to cart` });
  };

  const placeOrder = async () => {
    if (!user || cart.length === 0) return;
    for (const item of cart) {
      await supabase.from("orders").insert({
        customer_id: user.id,
        product_id: item.id,
        farmer_id: item.farmer_id,
        quantity: item.cartQty,
        total_price: item.price * item.cartQty,
        payment_method: "online",
      });
    }
    setCart([]);
    toast({ title: "Order placed successfully!" });
    fetchOrders();
    setActiveView("orders");
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} alt="AgroAssist" className="h-8 w-8 rounded-lg" />
            <span className="font-heading font-extrabold text-primary">AgroAssist</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <Button variant={activeView === "cart" ? "default" : "ghost"} size="sm" className="gap-1" onClick={() => setActiveView("cart")}>
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">{t("cart")} ({cart.length})</span>
            </Button>
            <Button variant={activeView === "orders" ? "default" : "ghost"} size="sm" className="gap-1" onClick={() => setActiveView("orders")}>
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">{t("myOrders")}</span>
            </Button>
            <span className="text-sm font-medium text-foreground hidden sm:inline">{profile?.full_name}</span>
            <Button variant="ghost" size="sm" className="gap-1 text-destructive" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container py-6">
        {activeView === "shop" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-heading font-black text-foreground">{t("marketplace")}</h2>
              <p className="text-sm text-muted-foreground">{products.length} products available</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <div key={product.id} className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-card-hover transition-all">
                  <div className="h-36 bg-secondary flex items-center justify-center">
                    <ShoppingBag className="h-12 w-12 text-muted-foreground/40" />
                  </div>
                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="font-heading font-bold text-foreground">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">{product.quantity} available</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-heading font-black text-primary">₹{product.price}/{product.unit || "kg"}</span>
                    </div>
                    {product.freshness_days && product.freshness_days <= 3 && (
                      <div className="text-xs font-medium text-destructive bg-destructive/10 px-2 py-1 rounded-md inline-block">
                        ⚠ {product.freshness_days} day{product.freshness_days > 1 ? "s" : ""} freshness left!
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 font-heading font-bold gap-1" onClick={() => addToCart(product)}>
                        <ShoppingCart className="h-3.5 w-3.5" /> Add to Cart
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {products.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">No products available yet</div>
              )}
            </div>
          </div>
        )}

        {activeView === "cart" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-heading font-black text-foreground">{t("cart")}</h2>
            {cart.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-12 text-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">Your cart is empty</p>
                <Button onClick={() => setActiveView("shop")} className="mt-4 font-heading font-bold">Browse Products</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.id} className="bg-card border border-border rounded-xl p-4 flex justify-between items-center">
                    <div>
                      <h3 className="font-heading font-bold">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">₹{item.price}/{item.unit || "kg"}</p>
                    </div>
                    <Button variant="destructive" size="sm" onClick={() => setCart(c => c.filter(ci => ci.id !== item.id))}>Remove</Button>
                  </div>
                ))}
                <div className="bg-card border border-border rounded-xl p-4 flex justify-between items-center">
                  <span className="font-heading font-bold text-lg">Total: ₹{cart.reduce((s, i) => s + i.price * i.cartQty, 0)}</span>
                  <Button className="font-heading font-bold" onClick={placeOrder}>Place Order</Button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeView === "orders" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-heading font-black text-foreground">{t("myOrders")}</h2>
            {orders.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground font-medium">No orders yet</p>
                <Button onClick={() => setActiveView("shop")} className="mt-4 font-heading font-bold">Start Shopping</Button>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="bg-card border border-border rounded-xl p-4 space-y-2">
                  <div className="flex justify-between">
                    <h3 className="font-heading font-bold">{(order as any).products?.name || "Product"}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      order.status === "delivered" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                    }`}>{order.status}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Qty: {order.quantity} · ₹{order.total_price}</p>
                  <p className="text-xs text-muted-foreground">Ordered: {new Date(order.created_at).toLocaleDateString()}</p>
                </div>
              ))
            )}
          </div>
        )}
      </main>

      <nav className="sm:hidden sticky bottom-0 border-t border-border bg-card">
        <div className="flex justify-around py-2">
          {[
            { id: "shop" as const, icon: ShoppingBag, label: t("marketplace") },
            { id: "cart" as const, icon: ShoppingCart, label: t("cart") },
            { id: "orders" as const, icon: Package, label: t("myOrders") },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveView(tab.id)}
              className={`flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium ${
                activeView === tab.id ? "text-primary" : "text-muted-foreground"
              }`}>
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
