import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Tractor } from "lucide-react";

const FarmerProfile = () => {
  const { user, profile, refreshUserData } = useAuth();
  const { toast } = useToast();

  const [form, setForm] = useState({
    full_name: "", phone: "", address: "", district: "", state: "", pincode: "",
  });
  const [farmForm, setFarmForm] = useState({ farm_size: "", crop_types: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        address: profile.address || "",
        district: profile.district || "",
        state: profile.state || "",
        pincode: profile.pincode || "",
      });
    }
  }, [profile]);

  useEffect(() => {
    if (user) fetchFarmerDetails();
  }, [user]);

  const fetchFarmerDetails = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("farmer_details")
      .select("farm_size, crop_types")
      .eq("user_id", user.id)
      .single();
    if (data) {
      setFarmForm({ farm_size: data.farm_size || "", crop_types: data.crop_types || "" });
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const [profileRes, farmerRes] = await Promise.all([
      supabase.from("profiles").update({
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        district: form.district.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
      }).eq("user_id", user.id),
      supabase.from("farmer_details").update({
        farm_size: farmForm.farm_size.trim(),
        crop_types: farmForm.crop_types.trim(),
      }).eq("user_id", user.id),
    ]);

    setSaving(false);
    if (profileRes.error || farmerRes.error) {
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    } else {
      toast({ title: "Profile updated", description: "Your details have been saved" });
      refreshUserData();
    }
  };

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <h2 className="text-2xl font-heading font-black text-foreground">My Profile 👤</h2>
      <p className="text-muted-foreground text-sm">Update your personal and farm details</p>

      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Full Name</label>
          <Input value={form.full_name} onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Email</label>
          <Input value={profile?.email || ""} disabled className="opacity-60" />
          <p className="text-xs text-muted-foreground">Email cannot be changed</p>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Phone</label>
          <Input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" />
        </div>

        <hr className="border-border" />
        <h3 className="font-heading font-bold text-foreground flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" /> Address
        </h3>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Address</label>
          <Input value={form.address} onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Village, area" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">District</label>
            <Input value={form.district} onChange={(e) => setForm(f => ({ ...f, district: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">State</label>
            <Input value={form.state} onChange={(e) => setForm(f => ({ ...f, state: e.target.value }))} />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Pincode</label>
          <Input value={form.pincode} onChange={(e) => setForm(f => ({ ...f, pincode: e.target.value }))} placeholder="6-digit pincode" maxLength={6} />
        </div>

        <hr className="border-border" />
        <h3 className="font-heading font-bold text-foreground flex items-center gap-2">
          <Tractor className="h-4 w-4 text-primary" /> Farm Details
        </h3>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Farm Size</label>
          <Input value={farmForm.farm_size} onChange={(e) => setFarmForm(f => ({ ...f, farm_size: e.target.value }))} placeholder="e.g. 5 acres" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Crop Types</label>
          <Input value={farmForm.crop_types} onChange={(e) => setFarmForm(f => ({ ...f, crop_types: e.target.value }))} placeholder="e.g. Rice, Wheat, Sugarcane" />
        </div>

        <Button onClick={handleSave} disabled={saving || !form.full_name.trim()} className="w-full mt-2">
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
};

export default FarmerProfile;
