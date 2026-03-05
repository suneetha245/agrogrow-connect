import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Check, X, LogOut, Shield, Users, Package } from "lucide-react";
import logo from "@/assets/logo.png";

interface PendingFarmer {
  user_id: string;
  farm_size: string | null;
  crop_types: string | null;
  created_at: string;
  profile?: {
    full_name: string;
    email: string;
    phone: string | null;
    district: string | null;
    state: string | null;
  };
}

const AdminDashboard = () => {
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [pendingFarmers, setPendingFarmers] = useState<PendingFarmer[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"pending" | "users">("pending");
  const [loading, setLoading] = useState(true);

  const fetchPendingFarmers = async () => {
    const { data: farmers } = await supabase
      .from("farmer_details")
      .select("*")
      .eq("approval_status", "pending");

    if (farmers) {
      const enriched = await Promise.all(
        farmers.map(async (f) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, email, phone, district, state")
            .eq("user_id", f.user_id)
            .single();
          return { ...f, profile: profile || undefined };
        })
      );
      setPendingFarmers(enriched);
    }
    setLoading(false);
  };

  const fetchAllUsers = async () => {
    const { data: profiles } = await supabase.from("profiles").select("*");
    if (profiles) {
      const enriched = await Promise.all(
        profiles.map(async (p) => {
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", p.user_id)
            .single();
          return { ...p, role: roleData?.role || "unknown" };
        })
      );
      setAllUsers(enriched);
    }
  };

  useEffect(() => {
    fetchPendingFarmers();
    fetchAllUsers();
  }, []);

  const handleApproval = async (userId: string, status: "approved" | "rejected") => {
    const { error } = await supabase
      .from("farmer_details")
      .update({ approval_status: status, approved_at: new Date().toISOString() })
      .eq("user_id", userId);

    if (error) {
      toast({ title: "Error updating status", variant: "destructive" });
      return;
    }

    toast({ title: `Farmer ${status} successfully!` });
    fetchPendingFarmers();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logo} alt="AgroAssist" className="h-8 w-8 rounded-lg" />
            <span className="font-heading font-extrabold text-primary">Admin Panel</span>
            <Shield className="h-4 w-4 text-primary" />
          </div>
          <Button variant="ghost" size="sm" className="gap-1 text-destructive" onClick={signOut}>
            <LogOut className="h-4 w-4" /> Logout
          </Button>
        </div>
      </header>

      <div className="container py-6 space-y-6">
        <div className="flex gap-2">
          <Button variant={activeTab === "pending" ? "default" : "outline"} onClick={() => setActiveTab("pending")} className="gap-2">
            <Users className="h-4 w-4" /> Pending Approvals ({pendingFarmers.length})
          </Button>
          <Button variant={activeTab === "users" ? "default" : "outline"} onClick={() => setActiveTab("users")} className="gap-2">
            <Package className="h-4 w-4" /> All Users ({allUsers.length})
          </Button>
        </div>

        {activeTab === "pending" && (
          <div className="space-y-4">
            <h2 className="text-xl font-heading font-bold">Pending Farmer Registrations</h2>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : pendingFarmers.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
                No pending registrations
              </div>
            ) : (
              pendingFarmers.map((farmer) => (
                <div key={farmer.user_id} className="bg-card border border-border rounded-xl p-6 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-heading font-bold text-lg">{farmer.profile?.full_name || "Unknown"}</h3>
                      <p className="text-sm text-muted-foreground">{farmer.profile?.email}</p>
                    </div>
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">Pending</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Phone:</span> {farmer.profile?.phone || "N/A"}</div>
                    <div><span className="text-muted-foreground">District:</span> {farmer.profile?.district || "N/A"}</div>
                    <div><span className="text-muted-foreground">State:</span> {farmer.profile?.state || "N/A"}</div>
                    <div><span className="text-muted-foreground">Farm Size:</span> {farmer.farm_size || "N/A"}</div>
                    <div className="col-span-2"><span className="text-muted-foreground">Crops:</span> {farmer.crop_types || "N/A"}</div>
                    <div><span className="text-muted-foreground">Registered:</span> {new Date(farmer.created_at).toLocaleDateString()}</div>
                  </div>
                  <div className="flex gap-2 pt-2">
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

        {activeTab === "users" && (
          <div className="space-y-4">
            <h2 className="text-xl font-heading font-bold">All Users</h2>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left p-3 font-heading font-bold">Name</th>
                    <th className="text-left p-3 font-heading font-bold">Email</th>
                    <th className="text-left p-3 font-heading font-bold">Role</th>
                    <th className="text-left p-3 font-heading font-bold">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map((user) => (
                    <tr key={user.user_id} className="border-b border-border last:border-0">
                      <td className="p-3">{user.full_name}</td>
                      <td className="p-3 text-muted-foreground">{user.email}</td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          user.role === "admin" ? "bg-purple-100 text-purple-800" :
                          user.role === "farmer" ? "bg-green-100 text-green-800" :
                          "bg-blue-100 text-blue-800"
                        }`}>{user.role}</span>
                      </td>
                      <td className="p-3 text-muted-foreground">{new Date(user.created_at).toLocaleDateString()}</td>
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

export default AdminDashboard;
