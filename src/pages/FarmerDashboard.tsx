import { useState } from "react";
import NotificationBell from "@/components/NotificationBell";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import LanguageSelector from "@/components/LanguageSelector";
import { Button } from "@/components/ui/button";
import CropRecommendation from "@/components/farmer/CropRecommendation";
import AddProduct from "@/components/farmer/AddProduct";
import DiseaseDetection from "@/components/farmer/DiseaseDetection";
import OrderManagement from "@/components/farmer/OrderManagement";
import { Sprout, Bug, Landmark, Users, PlusCircle, LogOut, Package } from "lucide-react";
import logo from "@/assets/logo.png";

const tabs = [
  { id: "crop", icon: Sprout, labelKey: "cropRecommendation" },
  { id: "disease", icon: Bug, labelKey: "diseaseDetection" },
  { id: "orders", icon: Package, labelKey: "orders" },
  { id: "govt", icon: Landmark, labelKey: "governmentFacilities" },
  { id: "community", icon: Users, labelKey: "community" },
  { id: "addProduct", icon: PlusCircle, labelKey: "addProduct" },
] as const;

const FarmerDashboard = () => {
  const { t } = useLanguage();
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("crop");

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "crop":
        return <CropRecommendation />;
      case "disease":
        return <DiseaseDetection />;
      case "orders":
        return <OrderManagement />;
      case "govt":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-heading font-black text-foreground">{t("governmentFacilities")}</h2>
            <div className="space-y-4">
              {[
                { name: "PM-KISAN", desc: "₹6,000 per year income support", link: "https://pmkisan.gov.in/" },
                { name: "Fasal Bima Yojana", desc: "Crop insurance for farmers", link: "https://pmfby.gov.in/" },
                { name: "Kisan Credit Card", desc: "Easy farm credit at low interest", link: "https://www.nabard.org/" },
                { name: "Soil Health Card", desc: "Free soil testing & recommendations", link: "https://soilhealth.dac.gov.in/" },
              ].map((scheme) => (
                <div key={scheme.name} className="p-5 rounded-xl border border-border bg-card flex justify-between items-center">
                  <div>
                    <h3 className="font-heading font-bold text-foreground">{scheme.name}</h3>
                    <p className="text-sm text-muted-foreground">{scheme.desc}</p>
                  </div>
                  <a href={scheme.link} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="font-heading font-bold">Apply</Button>
                  </a>
                </div>
              ))}
            </div>
          </div>
        );
      case "community":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-heading font-black text-foreground">{t("community")}</h2>
            <p className="text-muted-foreground">{t("communityDesc")}</p>
            <div className="bg-card border border-border rounded-xl p-6 min-h-[300px] flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4" />
                <p className="font-medium">Community chat coming soon!</p>
              </div>
            </div>
          </div>
        );
      case "addProduct":
        return <AddProduct />;
      default:
        return null;
    }
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
            <NotificationBell />
            <LanguageSelector />
            <span className="text-sm font-medium text-foreground hidden sm:inline">{profile?.full_name}</span>
            <Button variant="ghost" size="sm" className="gap-1 text-destructive" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">{t("logout")}</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container py-6 pb-20">{renderContent()}</main>

      <nav className="sticky bottom-0 border-t border-border bg-card">
        <div className="container flex justify-around py-2">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === tab.id ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}>
              <tab.icon className="h-5 w-5" />
              <span className="max-w-[70px] truncate">{t(tab.labelKey)}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default FarmerDashboard;
