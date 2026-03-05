import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, LogIn, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";

const Login = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Please fill all fields", variant: "destructive" });
      return;
    }
    setLoading(true);
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      setLoading(false);
      toast({ title: error.message, variant: "destructive" });
      return;
    }

    // Fetch user role to redirect
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .single();

    setLoading(false);

    if (!roleData) {
      toast({ title: "Account not found. Please register.", variant: "destructive" });
      return;
    }

    if (roleData.role === "farmer") {
      // Check approval
      const { data: farmerData } = await supabase
        .from("farmer_details")
        .select("approval_status")
        .eq("user_id", data.user.id)
        .single();

      if (farmerData?.approval_status !== "approved") {
        toast({ title: "Your farmer account is pending approval.", variant: "destructive" });
        await supabase.auth.signOut();
        return;
      }
      navigate("/farmer");
    } else if (roleData.role === "admin") {
      navigate("/admin");
    } else {
      navigate("/customer");
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <LanguageSelector />
      </div>

      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-card border border-border p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <img src={logo} alt="AgroAssist" className="h-16 w-16 rounded-xl" />
            </div>
            <h1 className="text-2xl font-heading font-black text-foreground">{t("loginTitle")}</h1>
            <p className="text-muted-foreground">{t("loginSubtitle")}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-medium">{t("email")}</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="farmer@example.com" className="h-12" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="font-medium">{t("password")}</Label>
                <a href="#" className="text-xs text-primary hover:underline">{t("forgotPassword")}</a>
              </div>
              <div className="relative">
                <Input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="h-12 pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full h-12 font-heading font-bold text-base gap-2" disabled={loading}>
              <LogIn className="h-4 w-4" />
              {loading ? "..." : t("login")}
            </Button>
          </form>

          <div className="text-center text-sm space-y-3">
            <p className="text-muted-foreground">
              {t("noAccount")}{" "}
              <Link to="/register" className="text-primary font-semibold hover:underline">{t("createAccount")}</Link>
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

export default Login;
