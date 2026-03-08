import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Package, CheckCircle2, Truck, MapPin, Clock, RefreshCw } from "lucide-react";

interface Order {
  id: string;
  status: string;
  quantity: number;
  total_price: number;
  payment_method: string | null;
  created_at: string;
  shipping_date: string | null;
  delivered_at: string | null;
  customer_name?: string;
  customer_district?: string;
  product_name?: string;
  product_image?: string | null;
}

const STATUS_FLOW: Record<string, string> = {
  pending: "confirmed",
  confirmed: "shipped",
  shipped: "delivered",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Package }> = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-800", icon: Clock },
  confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-800", icon: CheckCircle2 },
  shipped: { label: "Shipped", color: "bg-purple-100 text-purple-800", icon: Truck },
  delivered: { label: "Delivered", color: "bg-green-100 text-green-800", icon: MapPin },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800", icon: Package },
};

const OrderManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    if (user) fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("*, products(name, image_url)")
      .eq("farmer_id", user.id)
      .order("created_at", { ascending: false });

    if (data) {
      // Enrich with customer info
      const customerIds = [...new Set(data.map((o) => o.customer_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, district")
        .in("user_id", customerIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      const enriched: Order[] = data.map((o: any) => ({
        id: o.id,
        status: o.status,
        quantity: o.quantity,
        total_price: o.total_price,
        payment_method: o.payment_method,
        created_at: o.created_at,
        shipping_date: o.shipping_date,
        delivered_at: o.delivered_at,
        customer_name: profileMap.get(o.customer_id)?.full_name || "Customer",
        customer_district: profileMap.get(o.customer_id)?.district || undefined,
        product_name: o.products?.name || "Product",
        product_image: o.products?.image_url || null,
      }));
      setOrders(enriched);
    }
    setLoading(false);
  };

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    const updateData: any = { status: newStatus };
    if (newStatus === "shipped") updateData.shipping_date = new Date().toISOString();
    if (newStatus === "delivered") updateData.delivered_at = new Date().toISOString();

    const { error } = await supabase.from("orders").update(updateData).eq("id", orderId);
    setUpdatingId(null);

    if (error) {
      toast({ title: "Error", description: "Failed to update order", variant: "destructive" });
    } else {
      toast({ title: "Order updated", description: `Status changed to ${newStatus}` });
      fetchOrders();
    }
  };

  const filteredOrders = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const actionLabel: Record<string, string> = {
    pending: "Confirm Order",
    confirmed: "Mark Shipped",
    shipped: "Mark Delivered",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-black text-foreground">Orders 📦</h2>
          <p className="text-muted-foreground text-sm mt-1">{orders.length} total orders</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchOrders} className="gap-1">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {["all", "pending", "confirmed", "shipped", "delivered"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              filter === s
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/50"
            }`}
          >
            {s === "all" ? "All" : STATUS_CONFIG[s]?.label || s}
            {s === "all"
              ? ` (${orders.length})`
              : ` (${orders.filter((o) => o.status === s).length})`}
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center">
          <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground font-medium">No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const nextStatus = STATUS_FLOW[order.status];
            const StatusIcon = config.icon;

            return (
              <div key={order.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-14 w-14 rounded-lg bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                    {order.product_image ? (
                      <img src={order.product_image} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <Package className="h-6 w-6 text-muted-foreground/40" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-heading font-bold text-foreground truncate">{order.product_name}</h3>
                      <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${config.color}`}>
                        <StatusIcon className="h-3 w-3" />
                        {config.label}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {order.customer_name}
                      {order.customer_district && ` · ${order.customer_district}`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Qty: {order.quantity} · ₹{order.total_price} · {order.payment_method === "cod" ? "COD" : "Online"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {nextStatus && (
                  <Button
                    size="sm"
                    className="w-full"
                    disabled={updatingId === order.id}
                    onClick={() => updateStatus(order.id, nextStatus)}
                  >
                    {updatingId === order.id ? "Updating..." : actionLabel[order.status]}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrderManagement;
