import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import { Star } from "lucide-react";

interface Feedback {
  id: string;
  farmer_name: string;
  location: string | null;
  rating: number;
  comment: string;
  created_at: string;
}

const defaultFeedbacks = [
  {
    id: "default-1",
    farmer_name: "Ravi Kumar",
    location: "Mandya, Karnataka",
    comment: "AgroAssist helped me choose the right crop for my soil. My income increased by 40% this season!",
    rating: 5,
    created_at: "",
  },
  {
    id: "default-2",
    farmer_name: "Lakshmi Devi",
    location: "Belgaum, Karnataka",
    comment: "The disease detection feature saved my entire tomato crop. I got the solution within minutes!",
    rating: 5,
    created_at: "",
  },
  {
    id: "default-3",
    farmer_name: "Suresh Patil",
    location: "Dharwad, Karnataka",
    comment: "Selling directly to customers through the marketplace has eliminated the middleman completely.",
    rating: 4,
    created_at: "",
  },
];

const FeedbackSection = () => {
  const { t } = useLanguage();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>(defaultFeedbacks);

  useEffect(() => {
    fetchFeedbacks();

    const channel = supabase
      .channel("feedback-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "feedback" }, () => {
        fetchFeedbacks();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchFeedbacks = async () => {
    const { data } = await supabase
      .from("feedback")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);
    if (data && data.length > 0) {
      setFeedbacks(data);
    }
  };

  return (
    <section id="about" className="py-20 bg-muted/30">
      <div className="container">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-heading font-black text-foreground">
            {t("farmerFeedback")}
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {feedbacks.slice(0, 6).map((fb) => (
            <div
              key={fb.id}
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
              <p className="text-foreground leading-relaxed mb-6">"{fb.comment}"</p>
              <div>
                <div className="font-heading font-bold text-foreground">{fb.farmer_name}</div>
                {fb.location && <div className="text-sm text-muted-foreground">{fb.location}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeedbackSection;
