import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Bug, Upload, Camera, Loader2, AlertTriangle, CheckCircle, ShieldAlert, Leaf } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

const DiseaseDetection = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiseaseResult | null>(null);

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
    } catch (err: any) {
      console.error(err);
      toast({ title: "Analysis failed. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const severityColor = (s?: string) => {
    if (s === "Severe") return "text-destructive";
    if (s === "Moderate") return "text-yellow-600";
    return "text-primary";
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-black text-foreground">Plant Disease Detection</h2>
        <p className="text-muted-foreground mt-1">
          Upload a photo of your crop and our AI will identify diseases and suggest treatments.
        </p>
      </div>

      {/* Upload area */}
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
              <Button
                variant="secondary"
                size="sm"
                onClick={() => { setPreview(null); setResult(null); }}
              >
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

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Status card */}
          <div className={`rounded-xl border p-5 ${result.detected ? "border-destructive/30 bg-destructive/5" : "border-primary/30 bg-primary/5"}`}>
            <div className="flex items-center gap-3">
              {result.detected ? (
                <ShieldAlert className="h-8 w-8 text-destructive shrink-0" />
              ) : (
                <CheckCircle className="h-8 w-8 text-primary shrink-0" />
              )}
              <div>
                <h3 className="font-heading font-bold text-lg">{result.diseaseName}</h3>
                <div className="flex gap-3 text-sm mt-1">
                  {result.affectedCrop && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Leaf className="h-3 w-3" /> {result.affectedCrop}
                    </span>
                  )}
                  {result.confidence && (
                    <span className="text-muted-foreground">Confidence: <strong>{result.confidence}</strong></span>
                  )}
                  {result.severity && result.detected && (
                    <span className={`font-medium ${severityColor(result.severity)}`}>
                      Severity: {result.severity}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {result.description && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h4 className="font-heading font-bold mb-2">Description</h4>
              <p className="text-sm text-muted-foreground">{result.description}</p>
            </div>
          )}

          {result.symptoms && result.symptoms.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h4 className="font-heading font-bold mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" /> Symptoms
              </h4>
              <ul className="space-y-1">
                {result.symptoms.map((s, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-yellow-600 mt-1">•</span> {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.causes && result.causes.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h4 className="font-heading font-bold mb-2">Causes</h4>
              <ul className="space-y-1">
                {result.causes.map((c, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-destructive mt-1">•</span> {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.treatment && result.treatment.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5 border-primary/20">
              <h4 className="font-heading font-bold mb-2 text-primary">💊 Treatment</h4>
              <ul className="space-y-1">
                {result.treatment.map((t, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-1">•</span> {t}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.prevention && result.prevention.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h4 className="font-heading font-bold mb-2">🛡️ Prevention</h4>
              <ul className="space-y-1">
                {result.prevention.map((p, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="mt-1">•</span> {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Button
            variant="outline"
            className="w-full font-heading font-bold"
            onClick={() => { setPreview(null); setResult(null); }}
          >
            Scan Another Plant
          </Button>
        </div>
      )}
    </div>
  );
};

export default DiseaseDetection;
