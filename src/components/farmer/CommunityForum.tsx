import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Users, MessageCircle, Send, Plus, Trash2, ChevronDown, ChevronUp,
  Sprout, Bug, TrendingUp, HelpCircle, Lightbulb, ImagePlus, X, Heart,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Post {
  id: string;
  user_id: string;
  author_name: string;
  title: string;
  content: string;
  category: string;
  likes: number;
  image_url: string | null;
  created_at: string;
}

interface Reply {
  id: string;
  post_id: string;
  user_id: string;
  author_name: string;
  content: string;
  created_at: string;
}

const categories = [
  { id: "general", label: "General", icon: MessageCircle, color: "bg-blue-100 text-blue-800" },
  { id: "crops", label: "Crops & Seeds", icon: Sprout, color: "bg-emerald-100 text-emerald-800" },
  { id: "disease", label: "Pest & Disease", icon: Bug, color: "bg-red-100 text-red-800" },
  { id: "market", label: "Market Prices", icon: TrendingUp, color: "bg-purple-100 text-purple-800" },
  { id: "help", label: "Help Needed", icon: HelpCircle, color: "bg-amber-100 text-amber-800" },
  { id: "tips", label: "Tips & Tricks", icon: Lightbulb, color: "bg-teal-100 text-teal-800" },
];

const CommunityForum = () => {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const [posts, setPosts] = useState<Post[]>([]);
  const [replies, setReplies] = useState<Record<string, Reply[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());

  // New post state
  const [newPostOpen, setNewPostOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("general");
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lightbox state
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();

    const channel = supabase
      .channel("community-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "community_posts" }, () => fetchPosts())
      .on("postgres_changes", { event: "*", schema: "public", table: "community_replies" }, () => {
        if (expandedPost) fetchReplies(expandedPost);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("community_posts")
      .select("*")
      .order("created_at", { ascending: false });
    setPosts((data as Post[]) || []);
    setLoading(false);
    // Fetch likes after posts
    fetchAllLikes(data?.map((p: any) => p.id) || []);
  };

  const fetchAllLikes = async (postIds: string[]) => {
    if (postIds.length === 0) return;
    const { data: allLikes } = await supabase
      .from("community_likes")
      .select("post_id, user_id")
      .in("post_id", postIds);
    
    const counts: Record<string, number> = {};
    const liked = new Set<string>();
    (allLikes || []).forEach((l: any) => {
      counts[l.post_id] = (counts[l.post_id] || 0) + 1;
      if (l.user_id === user?.id) liked.add(l.post_id);
    });
    setLikeCounts(counts);
    setUserLikes(liked);
  };

  const fetchReplies = async (postId: string) => {
    const { data } = await supabase
      .from("community_replies")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    setReplies((prev) => ({ ...prev, [postId]: data || [] }));
  };

  const handleExpand = (postId: string) => {
    if (expandedPost === postId) {
      setExpandedPost(null);
    } else {
      setExpandedPost(postId);
      if (!replies[postId]) fetchReplies(postId);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || !user) return null;
    const ext = imageFile.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("community-images").upload(path, imageFile);
    if (error) {
      toast.error("Image upload failed");
      return null;
    }
    const { data } = supabase.storage.from("community-images").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleCreatePost = async () => {
    if (!user || !newTitle.trim() || !newContent.trim()) return;
    setSubmitting(true);

    let imageUrl: string | null = null;
    if (imageFile) {
      imageUrl = await uploadImage();
      if (imageFile && !imageUrl) {
        setSubmitting(false);
        return;
      }
    }

    const { error } = await supabase.from("community_posts").insert({
      user_id: user.id,
      author_name: profile?.full_name || "Farmer",
      title: newTitle.trim(),
      content: newContent.trim(),
      category: newCategory,
      image_url: imageUrl,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Failed to create post");
    } else {
      toast.success("Post created!");
      setNewTitle("");
      setNewContent("");
      setNewCategory("general");
      clearImage();
      setNewPostOpen(false);
      fetchPosts();
    }
  };

  const handleReply = async (postId: string) => {
    const text = replyText[postId]?.trim();
    if (!user || !text) return;
    const { error } = await supabase.from("community_replies").insert({
      post_id: postId,
      user_id: user.id,
      author_name: profile?.full_name || "Farmer",
      content: text,
    });
    if (error) {
      toast.error("Failed to reply");
    } else {
      setReplyText((prev) => ({ ...prev, [postId]: "" }));
      fetchReplies(postId);
    }
  };

  const handleDeletePost = async (postId: string) => {
    const { error } = await supabase.from("community_posts").delete().eq("id", postId);
    if (!error) {
      toast.success("Post deleted");
      fetchPosts();
    }
  };

  const handleToggleLike = async (postId: string) => {
    if (!user) return;
    const alreadyLiked = userLikes.has(postId);
    // Optimistic update
    setUserLikes((prev) => {
      const next = new Set(prev);
      alreadyLiked ? next.delete(postId) : next.add(postId);
      return next;
    });
    setLikeCounts((prev) => ({
      ...prev,
      [postId]: (prev[postId] || 0) + (alreadyLiked ? -1 : 1),
    }));

    if (alreadyLiked) {
      await supabase.from("community_likes").delete().eq("post_id", postId).eq("user_id", user.id);
    } else {
      await supabase.from("community_likes").insert({ post_id: postId, user_id: user.id });
    }
  };

  const handleDeleteReply = async (replyId: string, postId: string) => {
    const { error } = await supabase.from("community_replies").delete().eq("id", replyId);
    if (!error) fetchReplies(postId);
  };

  const filteredPosts = selectedCategory === "all" ? posts : posts.filter((p) => p.category === selectedCategory);
  const getCategoryMeta = (cat: string) => categories.find((c) => c.id === cat) || categories[0];

  return (
    <div className="space-y-6">
      {/* Image Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button className="absolute top-4 right-4 text-white hover:text-white/80" onClick={() => setLightboxUrl(null)}>
            <X className="h-8 w-8" />
          </button>
          <img src={lightboxUrl} alt="Full view" className="max-w-full max-h-[90vh] rounded-xl object-contain" />
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-heading font-black text-foreground flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> {t("community")}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Connect with fellow farmers, share photos, tips, and ask questions
          </p>
        </div>
        <Dialog open={newPostOpen} onOpenChange={(open) => { setNewPostOpen(open); if (!open) clearImage(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> New Post
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading">Create a Post</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Category</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setNewCategory(cat.id)}
                      className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                        newCategory === cat.id
                          ? cat.color + " border-transparent"
                          : "bg-card text-muted-foreground border-border hover:border-foreground/20"
                      }`}
                    >
                      <cat.icon className="h-3.5 w-3.5" />
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Title</label>
                <Input
                  placeholder="What's on your mind?"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Details</label>
                <Textarea
                  placeholder="Share more details, ask a question, or describe your situation..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Photo (optional)</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelect}
                />
                {imagePreview ? (
                  <div className="relative inline-block">
                    <img src={imagePreview} alt="Preview" className="h-32 w-auto rounded-lg object-cover border border-border" />
                    <button
                      onClick={clearImage}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors text-sm"
                  >
                    <ImagePlus className="h-5 w-5" />
                    Add a photo of your farm or crop
                  </button>
                )}
              </div>

              <Button onClick={handleCreatePost} disabled={submitting || !newTitle.trim() || !newContent.trim()} className="w-full">
                {submitting ? "Posting..." : "Post to Community"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
            selectedCategory === "all"
              ? "bg-primary text-primary-foreground border-transparent"
              : "bg-card text-muted-foreground border-border hover:border-foreground/20"
          }`}
        >
          All Posts
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`shrink-0 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              selectedCategory === cat.id
                ? cat.color + " border-transparent"
                : "bg-card text-muted-foreground border-border hover:border-foreground/20"
            }`}
          >
            <cat.icon className="h-3.5 w-3.5" />
            {cat.label}
          </button>
        ))}
      </div>

      {/* Posts */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : filteredPosts.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground font-medium">No posts yet. Be the first to start a conversation!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPosts.map((post) => {
            const catMeta = getCategoryMeta(post.category);
            const isExpanded = expandedPost === post.id;
            const postReplies = replies[post.id] || [];

            return (
              <div key={post.id} className="bg-card border border-border rounded-xl overflow-hidden">
                {/* Post Image */}
                {post.image_url && (
                  <button
                    onClick={() => setLightboxUrl(post.image_url)}
                    className="w-full block"
                  >
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="w-full h-48 sm:h-64 object-cover hover:opacity-95 transition-opacity"
                    />
                  </button>
                )}

                {/* Post Header */}
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${catMeta.color}`}>
                          <catMeta.icon className="h-3 w-3" />
                          {catMeta.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <h3 className="font-heading font-bold text-foreground text-base">{post.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{post.content}</p>
                      <p className="text-xs text-muted-foreground mt-2 font-medium">— {post.author_name}</p>
                    </div>
                    {post.user_id === user?.id && (
                      <button onClick={() => handleDeletePost(post.id)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Like & Reply Buttons */}
                  <div className="mt-3 flex items-center gap-4">
                    <button
                      onClick={() => handleToggleLike(post.id)}
                      className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                        userLikes.has(post.id)
                          ? "text-red-500"
                          : "text-muted-foreground hover:text-red-500"
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${userLikes.has(post.id) ? "fill-red-500" : ""}`} />
                      {likeCounts[post.id] || 0}
                    </button>
                    <button
                      onClick={() => handleExpand(post.id)}
                      className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      {isExpanded ? "Hide replies" : `Replies${postReplies.length > 0 ? ` (${postReplies.length})` : ""}`}
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Replies Section */}
                {isExpanded && (
                  <div className="border-t border-border bg-muted/30">
                    {postReplies.length > 0 && (
                      <div className="divide-y divide-border">
                        {postReplies.map((reply) => (
                          <div key={reply.id} className="px-4 sm:px-5 py-3 flex items-start gap-3">
                            <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                              <span className="text-xs font-bold text-primary">
                                {reply.author_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-foreground">{reply.author_name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                                </span>
                              </div>
                              <p className="text-sm text-foreground/80 mt-0.5">{reply.content}</p>
                            </div>
                            {reply.user_id === user?.id && (
                              <button onClick={() => handleDeleteReply(reply.id, post.id)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reply Input */}
                    <div className="px-4 sm:px-5 py-3 flex gap-2">
                      <Input
                        placeholder="Write a reply..."
                        value={replyText[post.id] || ""}
                        onChange={(e) => setReplyText((prev) => ({ ...prev, [post.id]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleReply(post.id); } }}
                        className="flex-1"
                      />
                      <Button
                        size="icon"
                        onClick={() => handleReply(post.id)}
                        disabled={!replyText[post.id]?.trim()}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CommunityForum;
