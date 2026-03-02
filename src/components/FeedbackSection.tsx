import { useLanguage } from "@/contexts/LanguageContext";
import { Star } from "lucide-react";

const feedbacks = [
  {
    name: "Ravi Kumar",
    location: "Mandya, Karnataka",
    text: "AgroAssist helped me choose the right crop for my soil. My income increased by 40% this season!",
    rating: 5,
  },
  {
    name: "Lakshmi Devi",
    location: "Belgaum, Karnataka",
    text: "The disease detection feature saved my entire tomato crop. I got the solution within minutes!",
    rating: 5,
  },
  {
    name: "Suresh Patil",
    location: "Dharwad, Karnataka",
    text: "Selling directly to customers through the marketplace has eliminated the middleman completely.",
    rating: 4,
  },
];

const FeedbackSection = () => {
  const { t } = useLanguage();

  return (
    <section id="about" className="py-20 bg-muted/30">
      <div className="container">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-heading font-black text-foreground">
            {t("farmerFeedback")}
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {feedbacks.map((fb, i) => (
            <div
              key={i}
              className="bg-card p-8 rounded-2xl border border-border shadow-card hover:shadow-card-hover transition-all duration-300"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star
                    key={j}
                    className={`h-4 w-4 ${j < fb.rating ? "fill-accent text-accent" : "text-border"}`}
                  />
                ))}
              </div>
              <p className="text-foreground leading-relaxed mb-6">"{fb.text}"</p>
              <div>
                <div className="font-heading font-bold text-foreground">{fb.name}</div>
                <div className="text-sm text-muted-foreground">{fb.location}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeedbackSection;
