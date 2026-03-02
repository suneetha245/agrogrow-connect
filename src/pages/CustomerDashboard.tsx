import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ShoppingCart, User, LogOut, Package, Phone } from "lucide-react";
import logo from "@/assets/logo.png";

const sampleProducts = [
  { id: 1, name: "Fresh Tomatoes", farmer: "Ravi Kumar", price: 40, unit: "kg", qty: "50 kg", daysLeft: 2 },
  { id: 2, name: "Organic Rice", farmer: "Lakshmi Devi", price: 80, unit: "kg", qty: "200 kg", daysLeft: 5 },
  { id: 3, name: "Fresh Mangoes", farmer: "Suresh Patil", price: 120, unit: "dozen", qty: "100 dozen", daysLeft: 3 },
  { id: 4, name: "Green Chillies", farmer: "Anand G.", price: 60, unit: "kg", qty: "30 kg", daysLeft: 1 },
  { id: 5, name: "Coconuts", farmer: "Manjunath", price: 25, unit: "piece", qty: "500 pieces", daysLeft: 7 },
  { id: 6, name: "Ragi Flour", farmer: "Kavitha", price: 90, unit: "kg", qty: "100 kg", daysLeft: 10 },
];

const CustomerDashboard = () => {
  const { t } = useLanguage();
  const [activeView, setActiveView] = useState<"shop" | "orders" | "cart">("shop");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} alt="AgroAssist" className="h-8 w-8 rounded-lg" />
            <span className="font-heading font-extrabold text-primary">AgroAssist</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <Button
              variant={activeView === "cart" ? "default" : "ghost"}
              size="sm"
              className="gap-1"
              onClick={() => setActiveView("cart")}
            >
              <ShoppingCart className="h-4 w-4" />
              <span className="hidden sm:inline">{t("cart")}</span>
            </Button>
            <Button
              variant={activeView === "orders" ? "default" : "ghost"}
              size="sm"
              className="gap-1"
              onClick={() => setActiveView("orders")}
            >
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">{t("myOrders")}</span>
            </Button>
            <Button variant="ghost" size="sm" className="gap-1">
              <User className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="gap-1 text-destructive">
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
              <p className="text-sm text-muted-foreground">{sampleProducts.length} products available</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sampleProducts.map((product) => (
                <div key={product.id} className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-card-hover transition-all">
                  <div className="h-36 bg-secondary flex items-center justify-center">
                    <ShoppingBag className="h-12 w-12 text-muted-foreground/40" />
                  </div>
                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="font-heading font-bold text-foreground">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">by {product.farmer}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-heading font-black text-primary">₹{product.price}/{product.unit}</span>
                      <span className="text-xs text-muted-foreground">{product.qty} available</span>
                    </div>
                    {product.daysLeft <= 3 && (
                      <div className="text-xs font-medium text-destructive bg-destructive/10 px-2 py-1 rounded-md inline-block">
                        ⚠ Only {product.daysLeft} day{product.daysLeft > 1 ? "s" : ""} left!
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 font-heading font-bold gap-1">
                        <ShoppingCart className="h-3.5 w-3.5" /> Add to Cart
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1">
                        <Phone className="h-3.5 w-3.5" /> Call
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeView === "cart" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-heading font-black text-foreground">{t("cart")}</h2>
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">Your cart is empty</p>
              <Button onClick={() => setActiveView("shop")} className="mt-4 font-heading font-bold">
                Browse Products
              </Button>
            </div>
          </div>
        )}

        {activeView === "orders" && (
          <div className="space-y-6">
            <h2 className="text-2xl font-heading font-black text-foreground">{t("myOrders")}</h2>
            <div className="bg-card border border-border rounded-xl p-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">No orders yet</p>
              <Button onClick={() => setActiveView("shop")} className="mt-4 font-heading font-bold">
                Start Shopping
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Bottom nav for mobile */}
      <nav className="sm:hidden sticky bottom-0 border-t border-border bg-card">
        <div className="flex justify-around py-2">
          {[
            { id: "shop" as const, icon: ShoppingBag, label: t("marketplace") },
            { id: "cart" as const, icon: ShoppingCart, label: t("cart") },
            { id: "orders" as const, icon: Package, label: t("myOrders") },
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
