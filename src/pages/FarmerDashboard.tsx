import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSelector from "@/components/LanguageSelector";
import { Button } from "@/components/ui/button";
import { Sprout, Bug, Landmark, Users, PlusCircle, User, LogOut, MessageSquare } from "lucide-react";
import logo from "@/assets/logo.png";

const tabs = [
  { id: "crop", icon: Sprout, labelKey: "cropRecommendation" },
  { id: "disease", icon: Bug, labelKey: "diseaseDetection" },
  { id: "govt", icon: Landmark, labelKey: "governmentFacilities" },
  { id: "community", icon: Users, labelKey: "community" },
  { id: "addProduct", icon: PlusCircle, labelKey: "addProduct" },
] as const;

const FarmerDashboard = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("crop");

  const renderContent = () => {
    switch (activeTab) {
      case "crop":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-heading font-black text-foreground">{t("cropRecommendation")}</h2>
            <p className="text-muted-foreground">{t("cropRecommendationDesc")}</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {["Rice", "Sugarcane", "Ragi", "Tomato", "Coconut", "Mango"].map((crop) => (
                <div key={crop} className="p-6 rounded-xl border border-border bg-card hover:shadow-card transition-shadow cursor-pointer">
                  <h3 className="font-heading font-bold text-foreground">{crop}</h3>
                  <p className="text-sm text-muted-foreground mt-1">Season: Kharif · Profit: High</p>
                  <div className="mt-3 text-xs font-medium text-primary">View Details →</div>
                </div>
              ))}
            </div>
          </div>
        );
      case "disease":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-heading font-black text-foreground">{t("diseaseDetection")}</h2>
            <p className="text-muted-foreground">{t("diseaseDetectionDesc")}</p>
            <div className="border-2 border-dashed border-border rounded-xl p-12 text-center">
              <Bug className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground font-medium">Upload a crop image to detect diseases</p>
              <Button className="mt-4 font-heading font-bold">Upload Image</Button>
            </div>
          </div>
        );
      case "govt":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-heading font-black text-foreground">{t("governmentFacilities")}</h2>
            <div className="space-y-4">
              {[
                { name: "PM-KISAN", desc: "₹6,000 per year income support", link: "#" },
                { name: "Fasal Bima Yojana", desc: "Crop insurance for farmers", link: "#" },
                { name: "Kisan Credit Card", desc: "Easy farm credit at low interest", link: "#" },
                { name: "Soil Health Card", desc: "Free soil testing & recommendations", link: "#" },
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
                <p className="text-sm mt-1">Connect with fellow farmers here.</p>
              </div>
            </div>
          </div>
        );
      case "addProduct":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-heading font-black text-foreground">{t("addProduct")}</h2>
            <div className="max-w-md space-y-4">
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
                <PlusCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Upload product image</p>
              </div>
              <input placeholder="Product Name" className="w-full h-11 px-4 border border-input rounded-lg bg-background text-foreground" />
              <input placeholder="Quantity (kg)" className="w-full h-11 px-4 border border-input rounded-lg bg-background text-foreground" />
              <input placeholder="Price (₹)" className="w-full h-11 px-4 border border-input rounded-lg bg-background text-foreground" />
              <input type="date" className="w-full h-11 px-4 border border-input rounded-lg bg-background text-foreground" />
              <Button className="w-full h-12 font-heading font-bold">Add Product</Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

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
            <Button variant="ghost" size="sm" className="gap-1">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{t("profile")}</span>
            </Button>
            <Button variant="ghost" size="sm" className="gap-1">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">{t("feedback")}</span>
            </Button>
            <Button variant="ghost" size="sm" className="gap-1 text-destructive">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">{t("logout")}</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 container py-6">
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
      <nav className="sticky bottom-0 border-t border-border bg-card">
        <div className="container flex justify-around py-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
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
