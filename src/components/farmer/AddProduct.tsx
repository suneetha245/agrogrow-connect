import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Trash2, ImagePlus, Package, Loader2 } from "lucide-react";

interface Product {
  id: string;
  name: string;
  quantity: string;
  price: number;
  unit: string | null;
  category: string | null;
  description: string | null;
  freshness_days: number | null;
  image_url: string | null;
  available: boolean | null;
  created_at: string;
}

const categories = ["Vegetables", "Fruits", "Grains", "Pulses", "Spices", "Dairy", "Other"];
const units = ["kg", "quintal", "ton", "dozen", "piece", "litre"];

const AddProduct = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "", quantity: "", price: "", unit: "kg", category: "Vegetables",
    description: "", freshnessDays: "",
  });

  useEffect(() => {
    if (user) fetchProducts();
  }, [user]);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("farmer_id", user!.id)
      .order("created_at", { ascending: false });
    if (data) setProducts(data);
    setLoading(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image must be under 5MB", variant: "destructive" });
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !user) return null;
    const ext = imageFile.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, imageFile);
    if (error) {
      console.error("Upload error:", error);
      return null;
    }
    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleSubmit = async () => {
    if (!form.name || !form.quantity || !form.price || !user) return;
    setAdding(true);

    let imageUrl: string | null = null;
    if (imageFile) {
      imageUrl = await uploadImage();
    }

    const { error } = await supabase.from("products").insert({
      farmer_id: user.id,
      name: form.name,
      quantity: form.quantity,
      price: parseFloat(form.price),
      unit: form.unit,
      category: form.category,
      description: form.description || null,
      freshness_days: form.freshnessDays ? parseInt(form.freshnessDays) : null,
      image_url: imageUrl,
    });

    setAdding(false);
    if (error) {
      toast({ title: "Failed to add product", variant: "destructive" });
    } else {
      toast({ title: "Product added successfully!" });
      setForm({ name: "", quantity: "", price: "", unit: "kg", category: "Vegetables", description: "", freshnessDays: "" });
      setImageFile(null);
      setImagePreview(null);
      fetchProducts();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (!error) {
      setProducts((p) => p.filter((x) => x.id !== id));
      toast({ title: "Product removed" });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-heading font-black text-foreground">{t("addProduct")}</h2>
        <p className="text-muted-foreground mt-1">List your produce for customers to buy directly.</p>
      </div>

      {/* Add Product Form */}
      <div className="max-w-lg space-y-4 p-6 rounded-xl border border-border bg-card">
        <div className="grid grid-cols-2 gap-3">
          <Input placeholder="Product Name *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="col-span-2 h-11" />
          <Input placeholder="Quantity *" value={form.quantity} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} className="h-11" />
          <Input placeholder="Price (₹) *" type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} className="h-11" />
          <Select value={form.unit} onValueChange={(v) => setForm((f) => ({ ...f, unit: v }))}>
            <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
            <SelectContent>
              {units.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
            <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
            <SelectContent>
              {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Input placeholder="Freshness (days)" type="number" value={form.freshnessDays} onChange={(e) => setForm((f) => ({ ...f, freshnessDays: e.target.value }))} className="h-11" />
        <Textarea placeholder="Description (optional)" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} />

        {/* Image Upload */}
        <div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          {imagePreview ? (
            <div className="relative w-full h-40 rounded-lg overflow-hidden border border-border">
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              <button onClick={() => { setImageFile(null); setImagePreview(null); }}
                className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button onClick={() => fileInputRef.current?.click()}
              className="w-full h-28 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors">
              <ImagePlus className="h-6 w-6" />
              <span className="text-sm font-medium">Add product photo</span>
            </button>
          )}
        </div>

        <Button className="w-full h-12 font-heading font-bold" onClick={handleSubmit} disabled={adding || !form.name || !form.quantity || !form.price}>
          {adding ? <><Loader2 className="h-4 w-4 animate-spin" /> Adding...</> : <><PlusCircle className="h-4 w-4" /> Add Product</>}
        </Button>
      </div>

      {/* My Products List */}
      <div>
        <h3 className="text-lg font-heading font-bold text-foreground mb-4">My Products ({products.length})</h3>
        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No products yet. Add your first product above!</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => (
              <div key={p.id} className="rounded-xl border border-border bg-card overflow-hidden">
                {p.image_url && (
                  <img src={p.image_url} alt={p.name} className="w-full h-36 object-cover" />
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <h4 className="font-heading font-bold text-foreground">{p.name}</h4>
                    <button onClick={() => handleDelete(p.id)} className="text-destructive hover:text-destructive/80">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-primary font-bold mt-1">₹{p.price}/{p.unit || "kg"}</p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">{p.quantity}</Badge>
                    {p.category && <Badge variant="secondary" className="text-xs">{p.category}</Badge>}
                    {p.freshness_days && <Badge variant="outline" className="text-xs">🟢 {p.freshness_days}d fresh</Badge>}
                  </div>
                  {p.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{p.description}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddProduct;
