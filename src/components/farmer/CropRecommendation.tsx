import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sprout, TrendingUp, Droplets, Sun, Snowflake, CloudRain } from "lucide-react";

import riceImg from "@/assets/crops/rice.jpg";
import sugarcaneImg from "@/assets/crops/sugarcane.jpg";
import ragiImg from "@/assets/crops/ragi.jpg";
import tomatoImg from "@/assets/crops/tomato.jpg";
import coconutImg from "@/assets/crops/coconut.jpg";
import mangoImg from "@/assets/crops/mango.jpg";
import wheatImg from "@/assets/crops/wheat.jpg";
import mustardImg from "@/assets/crops/mustard.jpg";
import groundnutImg from "@/assets/crops/groundnut.jpg";
import turmericImg from "@/assets/crops/turmeric.jpg";
import cottonImg from "@/assets/crops/cotton.jpg";
import chickpeaImg from "@/assets/crops/chickpea.jpg";

type Season = "all" | "kharif" | "rabi" | "zaid";
type SoilType = "all" | "alluvial" | "black" | "red" | "laterite" | "sandy";

interface CropData {
  name: string;
  image: string;
  season: Season[];
  soilTypes: SoilType[];
  profitLevel: "high" | "medium" | "low";
  waterNeed: "high" | "medium" | "low";
  growingDays: string;
  avgPricePerQuintal: string;
  tips: string;
}

const cropData: CropData[] = [
  { name: "Rice (Paddy)", image: riceImg, season: ["kharif"], soilTypes: ["alluvial", "black"], profitLevel: "high", waterNeed: "high", growingDays: "120-150", avgPricePerQuintal: "₹2,040", tips: "Best with standing water. Use SRI method for 30% more yield." },
  { name: "Sugarcane", image: sugarcaneImg, season: ["kharif", "zaid"], soilTypes: ["alluvial", "black"], profitLevel: "high", waterNeed: "high", growingDays: "270-365", avgPricePerQuintal: "₹315/ton", tips: "Plant in February-March. Intercrop with pulses for extra income." },
  { name: "Ragi (Finger Millet)", image: ragiImg, season: ["kharif"], soilTypes: ["red", "laterite", "sandy"], profitLevel: "medium", waterNeed: "low", growingDays: "90-120", avgPricePerQuintal: "₹3,578", tips: "Drought-resistant. Great for dry regions. High nutritional demand in market." },
  { name: "Tomato", image: tomatoImg, season: ["kharif", "rabi"], soilTypes: ["alluvial", "red", "black"], profitLevel: "high", waterNeed: "medium", growingDays: "60-90", avgPricePerQuintal: "₹1,500-4,000", tips: "Use drip irrigation. Stake plants for better yield. High price volatility." },
  { name: "Coconut", image: coconutImg, season: ["kharif", "zaid"], soilTypes: ["laterite", "red", "sandy"], profitLevel: "high", waterNeed: "medium", growingDays: "365+ (perennial)", avgPricePerQuintal: "₹25-35/nut", tips: "Long-term investment. Intercrop with banana or pepper for early returns." },
  { name: "Mango", image: mangoImg, season: ["zaid"], soilTypes: ["alluvial", "red", "laterite"], profitLevel: "high", waterNeed: "low", growingDays: "365+ (perennial)", avgPricePerQuintal: "₹3,000-8,000", tips: "Alphonso and Kesar varieties fetch premium prices. Requires 5 years to fruit." },
  { name: "Wheat", image: wheatImg, season: ["rabi"], soilTypes: ["alluvial", "black"], profitLevel: "medium", waterNeed: "medium", growingDays: "110-130", avgPricePerQuintal: "₹2,275", tips: "Sow in November. Use HD-2967 or PBW-343 varieties for best results." },
  { name: "Mustard", image: mustardImg, season: ["rabi"], soilTypes: ["alluvial", "sandy"], profitLevel: "medium", waterNeed: "low", growingDays: "110-140", avgPricePerQuintal: "₹5,450", tips: "Low investment crop. Good rotation with wheat. Oil extraction adds value." },
  { name: "Groundnut", image: groundnutImg, season: ["kharif", "rabi"], soilTypes: ["red", "sandy", "laterite"], profitLevel: "medium", waterNeed: "low", growingDays: "100-130", avgPricePerQuintal: "₹5,550", tips: "Sandy loam is ideal. Good for intercropping with maize." },
  { name: "Turmeric", image: turmericImg, season: ["kharif"], soilTypes: ["alluvial", "red", "black"], profitLevel: "high", waterNeed: "medium", growingDays: "240-270", avgPricePerQuintal: "₹7,000-12,000", tips: "Erode and Salem varieties are popular. Requires shade in initial months." },
  { name: "Cotton", image: cottonImg, season: ["kharif"], soilTypes: ["black"], profitLevel: "medium", waterNeed: "medium", growingDays: "150-180", avgPricePerQuintal: "₹6,620", tips: "Black soil (regur) is ideal. Use Bt Cotton varieties for pest resistance." },
  { name: "Chickpea (Chana)", image: chickpeaImg, season: ["rabi"], soilTypes: ["alluvial", "black", "red"], profitLevel: "medium", waterNeed: "low", growingDays: "90-120", avgPricePerQuintal: "₹5,335", tips: "Excellent rotation crop. Fixes nitrogen in soil. Minimal irrigation needed." },
];

const seasonIcons: Record<string, React.ReactNode> = {
  kharif: <CloudRain className="h-3.5 w-3.5" />,
  rabi: <Snowflake className="h-3.5 w-3.5" />,
  zaid: <Sun className="h-3.5 w-3.5" />,
};

const profitColors: Record<string, string> = {
  high: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  low: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const CropRecommendation = () => {
  const { t } = useLanguage();
  const [selectedSeason, setSelectedSeason] = useState<Season>("all");
  const [selectedSoil, setSelectedSoil] = useState<SoilType>("all");

  const filteredCrops = cropData.filter((crop) => {
    const seasonMatch = selectedSeason === "all" || crop.season.includes(selectedSeason);
    const soilMatch = selectedSoil === "all" || crop.soilTypes.includes(selectedSoil);
    return seasonMatch && soilMatch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-black text-foreground">{t("cropRecommendation")}</h2>
        <p className="text-muted-foreground mt-1">{t("cropRecommendationDesc")}</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={selectedSeason} onValueChange={(v) => setSelectedSeason(v as Season)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Season" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Seasons</SelectItem>
            <SelectItem value="kharif">Kharif (Jun-Oct)</SelectItem>
            <SelectItem value="rabi">Rabi (Nov-Mar)</SelectItem>
            <SelectItem value="zaid">Zaid (Mar-Jun)</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedSoil} onValueChange={(v) => setSelectedSoil(v as SoilType)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Soil Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Soils</SelectItem>
            <SelectItem value="alluvial">Alluvial</SelectItem>
            <SelectItem value="black">Black (Regur)</SelectItem>
            <SelectItem value="red">Red Soil</SelectItem>
            <SelectItem value="laterite">Laterite</SelectItem>
            <SelectItem value="sandy">Sandy</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground">{filteredCrops.length} crops found</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCrops.map((crop) => (
          <div key={crop.name} className="rounded-xl border border-border bg-card hover:shadow-md transition-shadow overflow-hidden">
            {/* Crop Image */}
            <div className="relative h-40 overflow-hidden">
              <img
                src={crop.image}
                alt={crop.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2">
                <Badge className={profitColors[crop.profitLevel]} variant="secondary">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {crop.profitLevel} profit
                </Badge>
              </div>
            </div>

            <div className="p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Sprout className="h-5 w-5 text-primary shrink-0" />
                <h3 className="font-heading font-bold text-foreground">{crop.name}</h3>
              </div>

              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="font-medium w-16 shrink-0">Season:</span>
                  <div className="flex gap-1 flex-wrap">
                    {crop.season.map((s) => (
                      <Badge key={s} variant="outline" className="text-xs gap-1 capitalize">
                        {seasonIcons[s]} {s}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Droplets className="h-3.5 w-3.5 shrink-0" />
                  <span>Water: {crop.waterNeed}</span>
                  <span className="mx-1">·</span>
                  <span>{crop.growingDays} days</span>
                </div>
                <div className="text-foreground font-semibold">
                  Price: {crop.avgPricePerQuintal}
                </div>
                <p className="text-xs text-muted-foreground italic border-t border-border pt-2 mt-2">
                  💡 {crop.tips}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCrops.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Sprout className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="font-medium">No crops match your filters. Try different combinations.</p>
        </div>
      )}
    </div>
  );
};

export default CropRecommendation;
