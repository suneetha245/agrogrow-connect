import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Package, ShoppingBag, Bug, TrendingUp, Clock, CheckCircle2, AlertTriangle, BarChart3 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";

interface Stats {
  totalProducts: number;
  availableProducts: number;
  pendingOrders: number;
  confirmedOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  totalRevenue: number;
  recentScans: { id: string; disease_name: string; severity: string | null; created_at: string; detected: boolean }[];
  recentOrders: { id: string; status: string; total_price: number; created_at: string; product_name: string }[];
}

const DashboardOverview = ({ onNavigate }: { onNavigate: (tab: string) => void }) => {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchStats();
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;
    setLoading(true);

    const [productsRes, ordersRes, scansRes] = await Promise.all([
      supabase.from("products").select("id, available").eq("farmer_id", user.id),
      supabase.from("orders").select("id, status, total_price, created_at, products(name)").eq("farmer_id", user.id).order("created_at", { ascending: false }).limit(5),
      supabase.from("disease_detections").select("id, disease_name, severity, created_at, detected").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
    ]);

    const products = productsRes.data || [];
    const orders = ordersRes.data || [];
    const scans = scansRes.data || [];

    // Fetch all orders for revenue/status counts
    const { data: allOrders } = await supabase.from("orders").select("status, total_price").eq("farmer_id", user.id);
    const all = allOrders || [];

    setStats({
      totalProducts: products.length,
      availableProducts: products.filter((p) => p.available).length,
      pendingOrders: all.filter((o) => o.status === "pending").length,
      confirmedOrders: all.filter((o) => o.status === "confirmed").length,
      shippedOrders: all.filter((o) => o.status === "shipped").length,
      deliveredOrders: all.filter((o) => o.status === "delivered").length,
      totalRevenue: all.filter((o) => o.status === "delivered").reduce((sum, o) => sum + Number(o.total_price), 0),
      recentScans: scans,
      recentOrders: orders.map((o: any) => ({
        id: o.id,
        status: o.status,
        total_price: o.total_price,
        created_at: o.created_at,
        product_name: o.products?.name || "Product",
      })),
    });
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    { label: "Total Products", value: stats.totalProducts, sub: `${stats.availableProducts} available`, icon: ShoppingBag, color: "text-emerald-600 bg-emerald-100" },
    { label: "Pending Orders", value: stats.pendingOrders, sub: `${stats.confirmedOrders} confirmed`, icon: Clock, color: "text-amber-600 bg-amber-100" },
    { label: "Delivered", value: stats.deliveredOrders, sub: `${stats.shippedOrders} in transit`, icon: CheckCircle2, color: "text-blue-600 bg-blue-100" },
    { label: "Revenue", value: `₹${stats.totalRevenue.toLocaleString()}`, sub: "from delivered orders", icon: TrendingUp, color: "text-purple-600 bg-purple-100" },
  ];

  const statusColor: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    confirmed: "bg-blue-100 text-blue-800",
    shipped: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-black text-foreground">
          Welcome back, {profile?.full_name?.split(" ")[0] || "Farmer"} 👋
        </h2>
        <p className="text-muted-foreground text-sm mt-1">Here's an overview of your farm activity</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((card) => (
          <div key={card.label} className="bg-card border border-border rounded-xl p-4 space-y-2">
            <div className={`inline-flex items-center justify-center h-9 w-9 rounded-lg ${card.color}`}>
              <card.icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-heading font-black text-foreground">{card.value}</p>
            <p className="text-xs font-medium text-foreground">{card.label}</p>
            <p className="text-xs text-muted-foreground">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Recent Orders */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-foreground flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" /> Recent Orders
            </h3>
            <button onClick={() => onNavigate("orders")} className="text-xs text-primary font-medium hover:underline">
              View all →
            </button>
          </div>
          {stats.recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No orders yet</p>
          ) : (
            <div className="space-y-2">
              {stats.recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground truncate">{order.product_name}</p>
                    <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">₹{order.total_price}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[order.status] || "bg-muted text-muted-foreground"}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Disease Scans */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-foreground flex items-center gap-2">
              <Bug className="h-4 w-4 text-primary" /> Recent Scans
            </h3>
            <button onClick={() => onNavigate("disease")} className="text-xs text-primary font-medium hover:underline">
              View all →
            </button>
          </div>
          {stats.recentScans.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No scans yet</p>
          ) : (
            <div className="space-y-2">
              {stats.recentScans.map((scan) => (
                <div key={scan.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div className="flex items-center gap-2">
                    {scan.detected ? (
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">{scan.disease_name}</p>
                      <p className="text-xs text-muted-foreground">{new Date(scan.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {scan.severity && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      scan.severity === "High" ? "bg-red-100 text-red-800" :
                      scan.severity === "Medium" ? "bg-amber-100 text-amber-800" :
                      "bg-green-100 text-green-800"
                    }`}>
                      {scan.severity}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
