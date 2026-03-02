import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, UserPlus, Sprout, ShoppingBag, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

type UserType = "farmer" | "customer";

const Register = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [userType, setUserType] = useState<UserType>("farmer");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    district: "",
    state: "",
    pincode: "",
    password: "",
    confirmPassword: "",
    farmSize: "",
    cropTypes: "",
  });

  const updateField = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.phone) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    if (userType === "customer" && form.password !== form.confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast({
        title: userType === "farmer"
          ? "Registration submitted! Your account will be reviewed by admin."
          : "Account created successfully!",
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4 py-8">
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>

      <div className="w-full max-w-lg">
        <div className="bg-card rounded-2xl shadow-card border border-border p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <img src={logo} alt="AgroAssist" className="h-14 w-14 rounded-xl" />
            </div>
            <h1 className="text-2xl font-heading font-black text-foreground">{t("registerTitle")}</h1>
            <p className="text-muted-foreground">{t("registerSubtitle")}</p>
          </div>

          {/* User Type Toggle */}
          <div className="flex rounded-xl border border-border overflow-hidden">
            <button
              type="button"
              onClick={() => setUserType("farmer")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-heading font-bold transition-colors ${
                userType === "farmer"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sprout className="h-4 w-4" />
              {t("registerAsFarmer")}
            </button>
            <button
              type="button"
              onClick={() => setUserType("customer")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-heading font-bold transition-colors ${
                userType === "customer"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              {t("registerAsCustomer")}
            </button>
          </div>

          {/* Farmer notice */}
          {userType === "farmer" && (
            <div className="flex gap-3 p-4 rounded-xl bg-accent/20 border border-accent/30">
              <AlertCircle className="h-5 w-5 text-accent-foreground flex-shrink-0 mt-0.5" />
              <p className="text-sm text-accent-foreground">{t("farmerNote")}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label className="font-medium">{t("fullName")} *</Label>
                <Input value={form.fullName} onChange={(e) => updateField("fullName", e.target.value)} className="h-11" />
              </div>
              <div className="space-y-2">
                <Label className="font-medium">{t("email")} *</Label>
                <Input type="email" value={form.email} onChange={(e) => updateField("email", e.target.value)} className="h-11" />
              </div>
              <div className="space-y-2">
                <Label className="font-medium">{t("phone")} *</Label>
                <Input type="tel" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} className="h-11" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="font-medium">{t("address")}</Label>
                <Textarea value={form.address} onChange={(e) => updateField("address", e.target.value)} rows={2} />
              </div>
              <div className="space-y-2">
                <Label className="font-medium">{t("district")}</Label>
                <Input value={form.district} onChange={(e) => updateField("district", e.target.value)} className="h-11" />
              </div>
              <div className="space-y-2">
                <Label className="font-medium">{t("state")}</Label>
                <Input value={form.state} onChange={(e) => updateField("state", e.target.value)} className="h-11" />
              </div>
              <div className="space-y-2">
                <Label className="font-medium">{t("pincode")}</Label>
                <Input value={form.pincode} onChange={(e) => updateField("pincode", e.target.value)} className="h-11" />
              </div>

              {userType === "farmer" && (
                <>
                  <div className="space-y-2">
                    <Label className="font-medium">{t("farmSize")}</Label>
                    <Input value={form.farmSize} onChange={(e) => updateField("farmSize", e.target.value)} className="h-11" />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label className="font-medium">{t("cropTypes")}</Label>
                    <Input value={form.cropTypes} onChange={(e) => updateField("cropTypes", e.target.value)} placeholder="Rice, Sugarcane, Ragi..." className="h-11" />
                  </div>
                </>
              )}

              {userType === "customer" && (
                <>
                  <div className="space-y-2">
                    <Label className="font-medium">{t("password")} *</Label>
                    <Input type="password" value={form.password} onChange={(e) => updateField("password", e.target.value)} className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medium">{t("confirmPassword")} *</Label>
                    <Input type="password" value={form.confirmPassword} onChange={(e) => updateField("confirmPassword", e.target.value)} className="h-11" />
                  </div>
                </>
              )}
            </div>

            <Button type="submit" className="w-full h-12 font-heading font-bold text-base gap-2" disabled={loading}>
              <UserPlus className="h-4 w-4" />
              {loading ? "..." : t("register")}
            </Button>
          </form>

          {/* Link */}
          <div className="text-center text-sm">
            <p className="text-muted-foreground">
              {t("haveAccount")}{" "}
              <Link to="/login" className="text-primary font-semibold hover:underline">{t("login")}</Link>
            </p>
          </div>
        </div>

        <div className="mt-4 text-center">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" />
            {t("backToHome")}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
