import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Check, X, LogOut, Shield, Users, Package, LayoutDashboard,
  TrendingUp, ShoppingBag, Sprout, Search, RefreshCw, BarChart3,
  Clock, CheckCircle2, Truck, MapPin, Trash2, UserCog, CalendarIcon
} from "lucide-react";
import logo from "@/assets/logo.png";

interface PendingFarmer {
  user_id: string;
  farm_size: string | null;
  crop_types: string | null;
  created_at: string;
  profile?: { full_name: string; email: string; phone: string | null; district: string | null; state: string | null };
}

interface UserRow {
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  district: string | null;
  state: string | null;
  created_at: string;
  role: string;
}

interface PlatformStats {
  totalUsers: number;
  totalFarmers: number;
  totalCustomers: number;
  pendingApprovals: number;
  totalProducts: number;
  totalOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  totalRevenue: number;
  recentOrders: { id: string; status: string; total_price: number; created_at: string; product_name: string; customer_name: string }[];
}

type Tab = "overview" | "approvals" | "users" | "orders" | "analytics";

const AdminDashboard = () => {
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);

  // Data
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [pendingFarmers, setPendingFarmers] = useState<PendingFarmer[]>([]);
  const [allUsers, setAllUsers] = useState<UserRow[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [orderFilter, setOrderFilter] = useState("all");
  const [managingUserId, setManagingUserId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [orderPaymentFilter, setOrderPaymentFilter] = useState("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  useEffect(() => {
    loadAll();

    // Realtime: new farmer registrations
    const farmerChannel = supabase
      .channel('admin-farmer-registrations')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'farmer_details' }, (payload) => {
        toast({ title: "🌾 New Farmer Registration", description: "A new farmer has registered and is pending approval." });
        fetchPendingFarmers();
        fetchStats();
      })
      .subscribe();

    // Realtime: new orders
    const orderChannel = supabase
      .channel('admin-new-orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        toast({ title: "📦 New Order Placed", description: `A new order worth ₹${payload.new.total_price} has been placed.` });
        fetchAllOrders();
        fetchStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(farmerChannel);
      supabase.removeChannel(orderChannel);
    };
  }, []);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchPendingFarmers(), fetchAllUsers(), fetchAllOrders()]);
    setLoading(false);
  };

  const fetchStats = async () => {
    const [profilesRes, productsRes, ordersRes, pendingRes] = await Promise.all([
      supabase.from("profiles").select("user_id"),
      supabase.from("products").select("id"),
      supabase.from("orders").select("id, status, total_price, created_at, customer_id, products(name)").order("created_at", { ascending: false }),
      supabase.from("farmer_details").select("user_id").eq("approval_status", "pending"),
    ]);

    const { data: roles } = await supabase.from("user_roles").select("role");
    const orders = ordersRes.data || [];

    // Get customer names for recent orders
    const customerIds = [...new Set(orders.slice(0, 5).map(o => o.customer_id))];
    const { data: customerProfiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", customerIds);
    const customerMap = new Map(customerProfiles?.map(p => [p.user_id, p.full_name]) || []);

    setStats({
      totalUsers: profilesRes.data?.length || 0,
      totalFarmers: roles?.filter(r => r.role === "farmer").length || 0,
      totalCustomers: roles?.filter(r => r.role === "customer").length || 0,
      pendingApprovals: pendingRes.data?.length || 0,
      totalProducts: productsRes.data?.length || 0,
      totalOrders: orders.length,
      pendingOrders: orders.filter(o => o.status === "pending").length,
      deliveredOrders: orders.filter(o => o.status === "delivered").length,
      totalRevenue: orders.filter(o => o.status === "delivered").reduce((s, o) => s + Number(o.total_price), 0),
      recentOrders: orders.slice(0, 5).map((o: any) => ({
        id: o.id, status: o.status, total_price: o.total_price, created_at: o.created_at,
        product_name: o.products?.name || "Product",
        customer_name: customerMap.get(o.customer_id) || "Customer",
      })),
    });
  };

  const fetchPendingFarmers = async () => {
    const { data: farmers } = await supabase.from("farmer_details").select("*").eq("approval_status", "pending");
    if (farmers) {
      const userIds = farmers.map(f => f.user_id);
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, email, phone, district, state").in("user_id", userIds);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      setPendingFarmers(farmers.map(f => ({ ...f, profile: profileMap.get(f.user_id) || undefined })));
    }
  };

  const fetchAllUsers = async () => {
    const { data: profiles } = await supabase.from("profiles").select("*");
    if (profiles) {
      const { data: roles } = await supabase.from("user_roles").select("user_id, role");
      const roleMap = new Map(roles?.map(r => [r.user_id, r.role]) || []);
      setAllUsers(profiles.map(p => ({ ...p, role: roleMap.get(p.user_id) || "unknown" })));
    }
  };

  const fetchAllOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*, products(name, image_url)")
      .order("created_at", { ascending: false });
    if (data) {
      const customerIds = [...new Set(data.map(o => o.customer_id))];
      const farmerIds = [...new Set(data.map(o => o.farmer_id))];
      const allIds = [...new Set([...customerIds, ...farmerIds])];
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", allIds);
      const nameMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
      setAllOrders(data.map((o: any) => ({
        ...o,
        customer_name: nameMap.get(o.customer_id) || "Customer",
        farmer_name: nameMap.get(o.farmer_id) || "Farmer",
        product_name: o.products?.name || "Product",
        product_image: o.products?.image_url || null,
      })));
    }
  };

  const handleApproval = async (userId: string, status: "approved" | "rejected") => {
    const { error } = await supabase.from("farmer_details")
      .update({ approval_status: status, approved_at: new Date().toISOString() })
      .eq("user_id", userId);
    if (error) { toast({ title: "Error", variant: "destructive" }); return; }

    await supabase.from("notifications").insert({
      user_id: userId,
      title: status === "approved" ? "Account Approved! 🎉" : "Account Not Approved",
      message: status === "approved"
        ? "Your farmer account has been approved. You now have full access."
        : "Your farmer registration was not approved. Please contact support.",
    });
    toast({ title: `Farmer ${status}!` });
    fetchPendingFarmers();
    fetchStats();
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    setManagingUserId(userId);
    const { data, error } = await supabase.functions.invoke("admin-manage-user", {
      body: { action: "change_role", user_id: userId, new_role: newRole },
    });
    setManagingUserId(null);
    if (error || data?.error) {
      toast({ title: "Error", description: data?.error || "Failed to change role", variant: "destructive" });
    } else {
      toast({ title: "Role updated", description: `User role changed to ${newRole}` });
      fetchAllUsers();
      fetchStats();
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setManagingUserId(userId);
    const { data, error } = await supabase.functions.invoke("admin-manage-user", {
      body: { action: "delete_user", user_id: userId },
    });
    setManagingUserId(null);
    setConfirmDelete(null);
    if (error || data?.error) {
      toast({ title: "Error", description: data?.error || "Failed to delete user", variant: "destructive" });
    } else {
      toast({ title: "User deleted", description: "User has been removed from the platform" });
      fetchAllUsers();
      fetchStats();
    }
  };

  const filteredUsers = allUsers.filter(u => {
    const matchesSearch = u.full_name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const filteredOrders = allOrders.filter(o => {
    const matchesStatus = orderFilter === "all" || o.status === orderFilter;
    const matchesPayment = orderPaymentFilter === "all" || o.payment_method === orderPaymentFilter;
    const matchesSearch = orderSearch === "" ||
      o.product_name?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.customer_name?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.farmer_name?.toLowerCase().includes(orderSearch.toLowerCase());
    const orderDate = new Date(o.created_at);
    const matchesDateFrom = !dateFrom || orderDate >= dateFrom;
    const matchesDateTo = !dateTo || orderDate <= new Date(dateTo.getTime() + 86400000);
    return matchesStatus && matchesPayment && matchesSearch && matchesDateFrom && matchesDateTo;
  });

  const statusColor: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800", confirmed: "bg-blue-100 text-blue-800",
    shipped: "bg-purple-100 text-purple-800", delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  const navItems: { id: Tab; icon: typeof LayoutDashboard; label: string }[] = [
    { id: "overview", icon: LayoutDashboard, label: "Overview" },
    { id: "approvals", icon: CheckCircle2, label: `Approvals (${pendingFarmers.length})` },
    { id: "users", icon: Users, label: "Users" },
    { id: "orders", icon: Package, label: "Orders" },
    { id: "analytics", icon: BarChart3, label: "Analytics" },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} alt="AgroAssist" className="h-8 w-8 rounded-lg" />
            <span className="font-heading font-extrabold text-primary">Admin Panel</span>
            <Shield className="h-4 w-4 text-primary" />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadAll} className="gap-1 hidden sm:inline-flex">
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
            <Button variant="ghost" size="sm" className="gap-1 text-destructive" onClick={signOut}>
              <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container py-6 pb-24 space-y-6">
        {/* Desktop Nav Tabs */}
        <div className="hidden sm:flex gap-2 flex-wrap">
          {navItems.map(item => (
            <Button key={item.id} variant={activeTab === item.id ? "default" : "outline"} size="sm"
              onClick={() => setActiveTab(item.id)} className="gap-2">
              <item.icon className="h-4 w-4" /> {item.label}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : (
          <>
            {/* ===== OVERVIEW ===== */}
            {activeTab === "overview" && stats && (
              <div className="space-y-6">
                <h2 className="text-2xl font-heading font-black text-foreground">Platform Overview 📊</h2>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { label: "Total Users", value: stats.totalUsers, sub: `${stats.totalFarmers} farmers · ${stats.totalCustomers} customers`, icon: Users, color: "text-blue-600 bg-blue-100" },
                    { label: "Pending Approvals", value: stats.pendingApprovals, sub: "farmers awaiting review", icon: Clock, color: "text-amber-600 bg-amber-100" },
                    { label: "Total Products", value: stats.totalProducts, sub: "listed on marketplace", icon: ShoppingBag, color: "text-emerald-600 bg-emerald-100" },
                    { label: "Revenue", value: `₹${stats.totalRevenue.toLocaleString()}`, sub: `${stats.totalOrders} orders · ${stats.deliveredOrders} delivered`, icon: TrendingUp, color: "text-purple-600 bg-purple-100" },
                  ].map(card => (
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

                {/* Quick actions */}
                <div className="grid sm:grid-cols-2 gap-3">
                  {stats.pendingApprovals > 0 && (
                    <button onClick={() => setActiveTab("approvals")}
                      className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-left hover:bg-amber-100 transition-colors">
                      <p className="font-heading font-bold text-amber-800">{stats.pendingApprovals} Farmers Pending Approval</p>
                      <p className="text-sm text-amber-600 mt-1">Review and approve farmer registrations →</p>
                    </button>
                  )}
                  {stats.pendingOrders > 0 && (
                    <button onClick={() => setActiveTab("orders")}
                      className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-left hover:bg-blue-100 transition-colors">
                      <p className="font-heading font-bold text-blue-800">{stats.pendingOrders} Pending Orders</p>
                      <p className="text-sm text-blue-600 mt-1">View all platform orders →</p>
                    </button>
                  )}
                </div>

                {/* Recent Orders */}
                {stats.recentOrders.length > 0 && (
                  <div className="bg-card border border-border rounded-xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-heading font-bold text-foreground">Recent Orders</h3>
                      <button onClick={() => setActiveTab("orders")} className="text-xs text-primary font-medium hover:underline">View all →</button>
                    </div>
                    <div className="space-y-2">
                      {stats.recentOrders.map(order => (
                        <div key={order.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                          <div>
                            <p className="text-sm font-medium text-foreground">{order.product_name}</p>
                            <p className="text-xs text-muted-foreground">{order.customer_name} · {new Date(order.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-foreground">₹{order.total_price}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[order.status] || "bg-muted text-muted-foreground"}`}>{order.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ===== APPROVALS ===== */}
            {activeTab === "approvals" && (
              <div className="space-y-4">
                <h2 className="text-2xl font-heading font-black text-foreground">Farmer Approvals ✅</h2>
                {pendingFarmers.length === 0 ? (
                  <div className="bg-card border border-border rounded-xl p-10 text-center">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
                    <p className="font-medium text-foreground">All caught up!</p>
                    <p className="text-sm text-muted-foreground mt-1">No pending farmer registrations</p>
                  </div>
                ) : (
                  pendingFarmers.map(farmer => (
                    <div key={farmer.user_id} className="bg-card border border-border rounded-xl p-5 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-heading font-bold text-lg text-foreground">{farmer.profile?.full_name || "Unknown"}</h3>
                          <p className="text-sm text-muted-foreground">{farmer.profile?.email}</p>
                        </div>
                        <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-medium">Pending</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                        <div><span className="text-muted-foreground">Phone:</span> <span className="text-foreground">{farmer.profile?.phone || "N/A"}</span></div>
                        <div><span className="text-muted-foreground">District:</span> <span className="text-foreground">{farmer.profile?.district || "N/A"}</span></div>
                        <div><span className="text-muted-foreground">State:</span> <span className="text-foreground">{farmer.profile?.state || "N/A"}</span></div>
                        <div><span className="text-muted-foreground">Farm Size:</span> <span className="text-foreground">{farmer.farm_size || "N/A"}</span></div>
                        <div><span className="text-muted-foreground">Crops:</span> <span className="text-foreground">{farmer.crop_types || "N/A"}</span></div>
                        <div><span className="text-muted-foreground">Registered:</span> <span className="text-foreground">{new Date(farmer.created_at).toLocaleDateString()}</span></div>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <Button size="sm" className="gap-1" onClick={() => handleApproval(farmer.user_id, "approved")}>
                          <Check className="h-4 w-4" /> Approve
                        </Button>
                        <Button size="sm" variant="destructive" className="gap-1" onClick={() => handleApproval(farmer.user_id, "rejected")}>
                          <X className="h-4 w-4" /> Reject
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ===== USERS ===== */}
            {activeTab === "users" && (
              <div className="space-y-4">
                <h2 className="text-2xl font-heading font-black text-foreground">User Management 👥</h2>
                <div className="flex gap-3 flex-wrap">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search by name or email..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="pl-9" />
                  </div>
                  <div className="flex gap-2">
                    {["all", "farmer", "customer", "admin"].map(r => (
                      <button key={r} onClick={() => setRoleFilter(r)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                          roleFilter === r ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/50"
                        }`}>
                        {r === "all" ? "All" : r.charAt(0).toUpperCase() + r.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">{filteredUsers.length} users found</p>

                <div className="bg-card border border-border rounded-xl overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b border-border">
                      <tr>
                        <th className="text-left p-3 font-heading font-bold text-foreground">Name</th>
                        <th className="text-left p-3 font-heading font-bold text-foreground hidden sm:table-cell">Email</th>
                        <th className="text-left p-3 font-heading font-bold text-foreground">Role</th>
                        <th className="text-left p-3 font-heading font-bold text-foreground hidden md:table-cell">Location</th>
                        <th className="text-left p-3 font-heading font-bold text-foreground hidden md:table-cell">Joined</th>
                        <th className="text-right p-3 font-heading font-bold text-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(user => (
                        <tr key={user.user_id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="p-3">
                            <p className="font-medium text-foreground">{user.full_name}</p>
                            <p className="text-xs text-muted-foreground sm:hidden">{user.email}</p>
                          </td>
                          <td className="p-3 text-muted-foreground hidden sm:table-cell">{user.email}</td>
                          <td className="p-3">
                            <Select
                              value={user.role}
                              onValueChange={(val) => handleChangeRole(user.user_id, val)}
                              disabled={managingUserId === user.user_id}
                            >
                              <SelectTrigger className="w-28 h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="farmer">Farmer</SelectItem>
                                <SelectItem value="customer">Customer</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-3 text-muted-foreground hidden md:table-cell">{[user.district, user.state].filter(Boolean).join(", ") || "—"}</td>
                          <td className="p-3 text-muted-foreground hidden md:table-cell">{new Date(user.created_at).toLocaleDateString()}</td>
                          <td className="p-3 text-right">
                            {confirmDelete === user.user_id ? (
                              <div className="flex items-center justify-end gap-1">
                                <Button size="sm" variant="destructive" className="h-7 text-xs gap-1"
                                  disabled={managingUserId === user.user_id}
                                  onClick={() => handleDeleteUser(user.user_id)}>
                                  {managingUserId === user.user_id ? "..." : "Confirm"}
                                </Button>
                                <Button size="sm" variant="outline" className="h-7 text-xs"
                                  onClick={() => setConfirmDelete(null)}>
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                                onClick={() => setConfirmDelete(user.user_id)}>
                                <Trash2 className="h-3 w-3" /> Delete
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ===== ORDERS ===== */}
            {activeTab === "orders" && (
              <div className="space-y-4">
                <h2 className="text-2xl font-heading font-black text-foreground">All Orders 📦</h2>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search by product, customer, or farmer..." value={orderSearch}
                    onChange={e => setOrderSearch(e.target.value)} className="pl-9" />
                </div>

                {/* Status filters */}
                <div className="flex gap-2 flex-wrap">
                  {["all", "pending", "confirmed", "shipped", "delivered"].map(s => (
                    <button key={s} onClick={() => setOrderFilter(s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        orderFilter === s ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/50"
                      }`}>
                      {s === "all" ? `All (${allOrders.length})` : `${s.charAt(0).toUpperCase() + s.slice(1)} (${allOrders.filter(o => o.status === s).length})`}
                    </button>
                  ))}
                </div>

                {/* Date range & payment filters */}
                <div className="flex gap-3 flex-wrap items-end">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">From</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className={cn("w-36 justify-start text-left font-normal h-9", !dateFrom && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-3 w-3" />
                          {dateFrom ? format(dateFrom, "dd MMM yyyy") : "Start date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className={cn("p-3 pointer-events-auto")} />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">To</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className={cn("w-36 justify-start text-left font-normal h-9", !dateTo && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-3 w-3" />
                          {dateTo ? format(dateTo, "dd MMM yyyy") : "End date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className={cn("p-3 pointer-events-auto")} />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Payment</label>
                    <Select value={orderPaymentFilter} onValueChange={setOrderPaymentFilter}>
                      <SelectTrigger className="w-32 h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="cod">COD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {(dateFrom || dateTo || orderPaymentFilter !== "all" || orderSearch) && (
                    <Button variant="ghost" size="sm" className="h-9 text-xs gap-1"
                      onClick={() => { setDateFrom(undefined); setDateTo(undefined); setOrderPaymentFilter("all"); setOrderSearch(""); }}>
                      <X className="h-3 w-3" /> Clear
                    </Button>
                  )}
                </div>

                <p className="text-sm text-muted-foreground">{filteredOrders.length} orders found</p>
                  <div className="bg-card border border-border rounded-xl p-10 text-center">
                    <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                    <p className="text-muted-foreground font-medium">No orders found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredOrders.map(order => (
                      <div key={order.id} className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
                        <div className="h-12 w-12 rounded-lg bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                          {order.product_image ? (
                            <img src={order.product_image} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <Package className="h-5 w-5 text-muted-foreground/40" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-heading font-bold text-foreground text-sm truncate">{order.product_name}</h3>
                            <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[order.status] || "bg-muted text-muted-foreground"}`}>{order.status}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            <span className="text-foreground font-medium">{order.customer_name}</span> → <span className="text-foreground font-medium">{order.farmer_name}</span>
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Qty: {order.quantity} · ₹{order.total_price} · {order.payment_method === "cod" ? "COD" : "Online"} · {new Date(order.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ===== ANALYTICS ===== */}
            {activeTab === "analytics" && stats && (
              <div className="space-y-6">
                <h2 className="text-2xl font-heading font-black text-foreground">Analytics 📈</h2>

                {/* Order breakdown */}
                <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                  <h3 className="font-heading font-bold text-foreground">Order Status Breakdown</h3>
                  <div className="space-y-3">
                    {[
                      { label: "Pending", count: allOrders.filter(o => o.status === "pending").length, color: "bg-amber-500" },
                      { label: "Confirmed", count: allOrders.filter(o => o.status === "confirmed").length, color: "bg-blue-500" },
                      { label: "Shipped", count: allOrders.filter(o => o.status === "shipped").length, color: "bg-purple-500" },
                      { label: "Delivered", count: allOrders.filter(o => o.status === "delivered").length, color: "bg-green-500" },
                    ].map(item => {
                      const pct = allOrders.length > 0 ? (item.count / allOrders.length) * 100 : 0;
                      return (
                        <div key={item.label} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-foreground font-medium">{item.label}</span>
                            <span className="text-muted-foreground">{item.count} ({pct.toFixed(0)}%)</span>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${item.color}`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* User breakdown */}
                <div className="grid sm:grid-cols-3 gap-3">
                  {[
                    { label: "Farmers", count: stats.totalFarmers, icon: Sprout, color: "text-green-600 bg-green-100" },
                    { label: "Customers", count: stats.totalCustomers, icon: Users, color: "text-blue-600 bg-blue-100" },
                    { label: "Products Listed", count: stats.totalProducts, icon: ShoppingBag, color: "text-emerald-600 bg-emerald-100" },
                  ].map(card => (
                    <div key={card.label} className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
                      <div className={`inline-flex items-center justify-center h-12 w-12 rounded-xl ${card.color}`}>
                        <card.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-2xl font-heading font-black text-foreground">{card.count}</p>
                        <p className="text-sm text-muted-foreground">{card.label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Revenue summary */}
                <div className="bg-card border border-border rounded-xl p-5 space-y-2">
                  <h3 className="font-heading font-bold text-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" /> Revenue Summary
                  </h3>
                  <p className="text-3xl font-heading font-black text-foreground">₹{stats.totalRevenue.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">From {stats.deliveredOrders} delivered orders out of {stats.totalOrders} total</p>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="sm:hidden sticky bottom-0 border-t border-border bg-card">
        <div className="flex justify-around py-2">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 px-2 py-2 text-xs font-medium ${
                activeTab === item.id ? "text-primary" : "text-muted-foreground"
              }`}>
              <item.icon className="h-5 w-5" />
              <span className="max-w-[60px] truncate">{item.id === "approvals" ? `(${pendingFarmers.length})` : item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default AdminDashboard;
