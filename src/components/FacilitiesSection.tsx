import { useLanguage } from "@/contexts/LanguageContext";
import { Sprout, Bug, Landmark, Users, ShoppingBag } from "lucide-react";

const FacilitiesSection = () => {
  const { t } = useLanguage();

  const facilities = [
    {
      icon: Sprout,
      title: t("cropRecommendation"),
      desc: t("cropRecommendationDesc"),
      color: "from-primary/10 to-primary/5",
      iconBg: "bg-primary/15 text-primary",
    },
    {
      icon: Bug,
      title: t("diseaseDetection"),
      desc: t("diseaseDetectionDesc"),
      color: "from-destructive/10 to-destructive/5",
      iconBg: "bg-destructive/15 text-destructive",
    },
    {
      icon: Landmark,
      title: t("governmentFacilities"),
      desc: t("governmentFacilitiesDesc"),
      color: "from-accent/20 to-accent/5",
      iconBg: "bg-accent/30 text-accent-foreground",
    },
    {
      icon: Users,
      title: t("community"),
      desc: t("communityDesc"),
      color: "from-secondary to-secondary/50",
      iconBg: "bg-secondary text-secondary-foreground",
    },
    {
      icon: ShoppingBag,
      title: t("marketplace"),
      desc: t("marketplaceDesc"),
      color: "from-primary/10 to-accent/10",
      iconBg: "bg-primary/15 text-primary",
    },
  ];

  return (
    <section id="facilities" className="py-20 bg-muted/30">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">
            {t("facilities")}
          </span>
          <h2 className="text-3xl sm:text-4xl font-heading font-black text-foreground mt-2">
            {t("facilitiesTitle")}
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">{t("facilitiesSubtitle")}</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {facilities.map((f, i) => (
            <div
              key={i}
              className={`group relative p-8 rounded-2xl bg-gradient-to-br ${f.color} border border-border/50 hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1`}
            >
              <div className={`inline-flex p-3 rounded-xl ${f.iconBg} mb-5`}>
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-heading font-bold text-foreground mb-3">{f.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FacilitiesSection;
