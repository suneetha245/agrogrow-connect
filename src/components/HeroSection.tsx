import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-farm.jpg";

const HeroSection = () => {
  const { t } = useLanguage();

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img src={heroImage} alt="Modern farming" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/60 to-foreground/30" />
      </div>

      <div className="container relative z-10 py-20">
        <div className="max-w-2xl space-y-8">
          <div className="animate-fade-up">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/20 text-primary-foreground text-sm font-semibold border border-primary/30 mb-6">
              🌱 AgroAssist
            </span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-black text-primary-foreground leading-tight animate-fade-up-delay-1">
            {t("heroTitle")}
          </h1>
          
          <p className="text-lg sm:text-xl text-primary-foreground/80 leading-relaxed animate-fade-up-delay-2 max-w-xl">
            {t("heroSubtitle")}
          </p>
          
          <div className="flex flex-wrap gap-4 animate-fade-up-delay-3">
            <Link to="/login">
              <Button size="lg" className="font-heading font-bold text-base gap-2 px-8 py-6 shadow-lg hover:shadow-xl transition-shadow">
                {t("getStarted")} <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <a href="#facilities">
              <Button size="lg" variant="outline" className="font-heading font-bold text-base gap-2 px-8 py-6 bg-primary-foreground/10 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground">
                {t("learnMore")} <ChevronDown className="h-5 w-5" />
              </Button>
            </a>
          </div>

          {/* Stats */}
          <div className="flex gap-8 pt-4 animate-fade-up-delay-3">
            {[
              { num: "10K+", label: "Farmers" },
              { num: "500+", label: "Products" },
              { num: "50+", label: "Districts" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-heading font-black text-primary-foreground">{stat.num}</div>
                <div className="text-sm text-primary-foreground/60">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
