import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Bug, Upload, Camera, Loader2, AlertTriangle, CheckCircle, ShieldAlert, Leaf, History, Trash2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface DiseaseResult {
  detected: boolean;
  diseaseName: string;
  confidence?: string;
  description?: string;
  symptoms?: string[];
  causes?: string[];
  treatment?: string[];
  prevention?: string[];
  severity?: string;
  affectedCrop?: string;
}

interface HistoryItem {
  id: string;
  image_url: string | null;
  disease_name: string;
  detected: boolean;
  confidence: string | null;
  severity: string | null;
  affected_crop: string | null;
  description: string | null;
  symptoms: string[];
  causes: string[];
  treatment: string[];
  prevention: string[];
  created_at: string;
}

const DiseaseDetection = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiseaseResult | null>(null);
  const [tab, setTab] = useState<"scan" | "history">("scan");
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<HistoryItem | null>(null);

  const fetchHistory = async () => {
    if (!user) return;
    setHistoryLoading(true);
    const { data } = await supabase
      .from("disease_detections")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setHistory(data as unknown as HistoryItem[]);
    setHistoryLoading(false);
  };

  useEffect(() => {
    if (tab === "history") fetchHistory();
  }, [tab, user]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Please upload an image file", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Image must be under 5MB", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const saveToHistory = async (data: DiseaseResult, imageDataUrl: string | null) => {
    if (!user) return;
    // Upload image to storage
    let imageUrl: string | null = null;
    if (imageDataUrl) {
      const base64 = imageDataUrl.split(",")[1];
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const fileName = `${user.id}/disease-${Date.now()}.jpg`;
      const { error: uploadErr } = await supabase.storage
        .from("product-images")
        .upload(fileName, bytes, { contentType: "image/jpeg" });
      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
      }
    }

    await supabase.from("disease_detections").insert({
      user_id: user.id,
      image_url: imageUrl,
      disease_name: data.diseaseName,
      detected: data.detected,
      confidence: data.confidence || null,
      severity: data.severity || null,
      affected_crop: data.affectedCrop || null,
      description: data.description || null,
      symptoms: data.symptoms || [],
      causes: data.causes || [],
      treatment: data.treatment || [],
      prevention: data.prevention || [],
    });
  };

  const analyzeImage = async () => {
    if (!preview) return;
    setLoading(true);
    setResult(null);

    try {
      const base64 = preview.split(",")[1];
      const { data, error } = await supabase.functions.invoke("detect-disease", {
        body: { imageBase64: base64 },
      });

      if (error) throw error;
      setResult(data);
      // Auto-save to history
      await saveToHistory(data, preview);
    } catch (err: any) {
      console.error(err);
      toast({ title: "Analysis failed. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const deleteHistoryItem = async (id: string) => {
    await supabase.from("disease_detections").delete().eq("id", id);
    setHistory((prev) => prev.filter((h) => h.id !== id));
    if (selectedHistory?.id === id) setSelectedHistory(null);
    toast({ title: "Scan deleted" });
  };

  const severityColor = (s?: string | null) => {
    if (s === "Severe") return "text-destructive";
    if (s === "Moderate") return "text-yellow-600";
    return "text-primary";
  };

  const renderResultCards = (r: DiseaseResult | HistoryItem, imageUrl?: string | null) => {
    const isResult = "diseaseName" in r;
    const diseaseName = isResult ? (r as DiseaseResult).diseaseName : (r as HistoryItem).disease_name;
    const detected = r.detected;
    const affectedCrop = isResult ? (r as DiseaseResult).affectedCrop : (r as HistoryItem).affected_crop;
    const confidence = r.confidence;
    const severity = r.severity;
    const description = r.description;
    const symptoms = isResult ? (r as DiseaseResult).symptoms : (r as HistoryItem).symptoms;
    const causes = isResult ? (r as DiseaseResult).causes : (r as HistoryItem).causes;
    const treatment = isResult ? (r as DiseaseResult).treatment : (r as HistoryItem).treatment;
    const prevention = isResult ? (r as DiseaseResult).prevention : (r as HistoryItem).prevention;

    return (
      <div className="space-y-4">
        {imageUrl && (
          <div className="rounded-xl overflow-hidden border border-border bg-card">
            <img src={imageUrl} alt="Plant" className="w-full max-h-60 object-contain bg-muted/30" />
          </div>
        )}

        <div className={`rounded-xl border p-5 ${detected ? "border-destructive/30 bg-destructive/5" : "border-primary/30 bg-primary/5"}`}>
          <div className="flex items-center gap-3">
            {detected ? (
              <ShieldAlert className="h-8 w-8 text-destructive shrink-0" />
            ) : (
              <CheckCircle className="h-8 w-8 text-primary shrink-0" />
            )}
            <div>
              <h3 className="font-heading font-bold text-lg">{diseaseName}</h3>
              <div className="flex flex-wrap gap-3 text-sm mt-1">
                {affectedCrop && (
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Leaf className="h-3 w-3" /> {affectedCrop}
                  </span>
                )}
                {confidence && (
                  <span className="text-muted-foreground">Confidence: <strong>{confidence}</strong></span>
                )}
                {severity && detected && (
                  <span className={`font-medium ${severityColor(severity)}`}>Severity: {severity}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {description && (
          <div className="bg-card border border-border rounded-xl p-5">
            <h4 className="font-heading font-bold mb-2">Description</h4>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        )}

        {symptoms && symptoms.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-5">
            <h4 className="font-heading font-bold mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" /> Symptoms
            </h4>
            <ul className="space-y-1">
              {symptoms.map((s, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-yellow-600 mt-1">•</span> {String(s)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {causes && causes.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-5">
            <h4 className="font-heading font-bold mb-2">Causes</h4>
            <ul className="space-y-1">
              {causes.map((c, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-destructive mt-1">•</span> {String(c)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {treatment && treatment.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-5 border-primary/20">
            <h4 className="font-heading font-bold mb-2 text-primary">💊 Treatment</h4>
            <ul className="space-y-1">
              {treatment.map((t, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary mt-1">•</span> {String(t)}
                </li>
              ))}
            </ul>
          </div>
        )}

        {prevention && prevention.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-5">
            <h4 className="font-heading font-bold mb-2">🛡️ Prevention</h4>
            <ul className="space-y-1">
              {prevention.map((p, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="mt-1">•</span> {String(p)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-black text-foreground">Plant Disease Detection</h2>
          <p className="text-muted-foreground mt-1">
            Upload a photo of your crop and our AI will identify diseases and suggest treatments.
          </p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2">
        <Button
          variant={tab === "scan" ? "default" : "outline"}
          size="sm"
          className="gap-2 font-heading font-bold"
          onClick={() => { setTab("scan"); setSelectedHistory(null); }}
        >
          <Camera className="h-4 w-4" /> New Scan
        </Button>
        <Button
          variant={tab === "history" ? "default" : "outline"}
          size="sm"
          className="gap-2 font-heading font-bold"
          onClick={() => setTab("history")}
        >
          <History className="h-4 w-4" /> History ({history.length})
        </Button>
      </div>

      {/* Scan tab */}
      {tab === "scan" && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileSelect}
          />

          {!preview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
            >
              <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground font-medium mb-2">
                Take a photo or upload an image of the affected plant
              </p>
              <div className="flex gap-3 justify-center">
                <Button className="font-heading font-bold gap-2">
                  <Upload className="h-4 w-4" /> Upload Image
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden border border-border bg-card">
                <img src={preview} alt="Uploaded plant" className="w-full max-h-80 object-contain bg-muted/30" />
                <div className="absolute top-2 right-2 flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => { setPreview(null); setResult(null); }}>
                    Change Image
                  </Button>
                </div>
              </div>

              {!result && !loading && (
                <Button onClick={analyzeImage} className="w-full font-heading font-bold gap-2" size="lg">
                  <Bug className="h-5 w-5" /> Analyze for Diseases
                </Button>
              )}

              {loading && (
                <div className="bg-card border border-border rounded-xl p-8 text-center">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-3" />
                  <p className="font-heading font-bold text-foreground">Analyzing your crop image...</p>
                  <p className="text-sm text-muted-foreground mt-1">This may take a few seconds</p>
                </div>
              )}
            </div>
          )}

          {result && (
            <>
              {renderResultCards(result, preview)}
              <Button
                variant="outline"
                className="w-full font-heading font-bold"
                onClick={() => { setPreview(null); setResult(null); }}
              >
                Scan Another Plant
              </Button>
            </>
          )}
        </>
      )}

      {/* History tab */}
      {tab === "history" && (
        <>
          {selectedHistory ? (
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={() => setSelectedHistory(null)}
              >
                <ArrowLeft className="h-4 w-4" /> Back to History
              </Button>
              <p className="text-xs text-muted-foreground">
                Scanned on {new Date(selectedHistory.created_at).toLocaleDateString()} at{" "}
                {new Date(selectedHistory.created_at).toLocaleTimeString()}
              </p>
              {renderResultCards(selectedHistory, selectedHistory.image_url)}
            </div>
          ) : historyLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading history...</div>
          ) : history.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
              <History className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No scans yet</p>
              <p className="text-sm mt-1">Your disease detection results will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:border-primary/30 transition-colors"
                  onClick={() => setSelectedHistory(item)}
                >
                  {item.image_url ? (
                    <img src={item.image_url} alt="" className="h-16 w-16 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Leaf className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {item.detected ? (
                        <ShieldAlert className="h-4 w-4 text-destructive shrink-0" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                      )}
                      <h4 className="font-heading font-bold text-sm truncate">{item.disease_name}</h4>
                    </div>
                    <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                      {item.affected_crop && <span>{item.affected_crop}</span>}
                      {item.severity && item.detected && (
                        <span className={severityColor(item.severity)}>• {item.severity}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); deleteHistoryItem(item.id); }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DiseaseDetection;
