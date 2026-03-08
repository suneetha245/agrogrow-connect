import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Star, MessageSquarePlus, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

const FeedbackForm = () => {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState<any>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (user) fetchExisting();
  }, [user]);

  const fetchExisting = async () => {
    if (!user) return;
    setFetching(true);
    const { data } = await supabase
      .from("feedback")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) {
      setExistingFeedback(data);
      setRating(data.rating);
      setComment(data.comment);
      setLocation(data.location || "");
    }
    setFetching(false);
  };

  const handleSubmit = async () => {
    if (!user || !comment.trim()) return;
    setLoading(true);

    const feedbackData = {
      user_id: user.id,
      farmer_name: profile?.full_name || "Farmer",
      location: location || `${profile?.district || ""}, ${profile?.state || ""}`.replace(/^, |, $/g, ""),
      rating,
      comment: comment.trim(),
    };

    let error;
    if (existingFeedback) {
      ({ error } = await supabase.from("feedback").update(feedbackData).eq("id", existingFeedback.id));
    } else {
      ({ error } = await supabase.from("feedback").insert(feedbackData));
    }

    setLoading(false);
    if (error) {
      toast.error("Failed to submit feedback");
    } else {
      toast.success(existingFeedback ? "Feedback updated!" : "Feedback submitted!");
      setOpen(false);
      fetchExisting();
    }
  };

  const handleDelete = async () => {
    if (!existingFeedback) return;
    setLoading(true);
    const { error } = await supabase.from("feedback").delete().eq("id", existingFeedback.id);
    setLoading(false);
    if (error) {
      toast.error("Failed to delete feedback");
    } else {
      toast.success("Feedback deleted");
      setExistingFeedback(null);
      setRating(5);
      setComment("");
      setLocation("");
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          {existingFeedback ? <Pencil className="h-4 w-4" /> : <MessageSquarePlus className="h-4 w-4" />}
          <span className="hidden sm:inline">{existingFeedback ? "Edit Feedback" : "Give Feedback"}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {existingFeedback ? "Update Your Feedback" : "Share Your Feedback"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} type="button" onClick={() => setRating(star)}>
                  <Star
                    className={`h-7 w-7 transition-colors ${
                      star <= rating ? "fill-accent text-accent" : "text-border hover:text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Location (optional)</label>
            <Input
              placeholder="e.g. Mandya, Karnataka"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">Your feedback</label>
            <Textarea
              placeholder="Tell us about your experience with AgroAssist..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>
          <div className="flex gap-2 justify-end">
            {existingFeedback && (
              <Button variant="destructive" size="sm" onClick={handleDelete} disabled={loading}>
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            )}
            <Button onClick={handleSubmit} disabled={loading || !comment.trim()}>
              {loading ? "Submitting..." : existingFeedback ? "Update" : "Submit"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FeedbackForm;
