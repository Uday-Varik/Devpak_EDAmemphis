import { useState, useRef } from "react";
import { FileImage, Trash2, Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ConceptDrawing {
  url: string;
  title: string;
  fileType: string;
}

interface ConceptDrawingsUploadProps {
  drawings: ConceptDrawing[];
  onChange: (drawings: ConceptDrawing[]) => void;
  projectId: string;
}

export const ConceptDrawingsUpload = ({ drawings, onChange, projectId }: ConceptDrawingsUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (drawings.length + files.length > 4) {
      toast.error("Maximum 4 drawings/plans allowed");
      return;
    }

    setUploading(true);
    const newDrawings: ConceptDrawing[] = [];

    for (const file of Array.from(files)) {
      const isImage = file.type.startsWith("image/");
      const isPDF = file.type === "application/pdf";
      if (!isImage && !isPDF) {
        toast.error(`${file.name}: Only images and PDFs accepted`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        continue;
      }

      const ext = file.name.split(".").pop() || "jpg";
      const path = `${projectId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage
        .from("project-drawings")
        .upload(path, file, { upsert: false });

      if (error) {
        toast.error(`Failed to upload ${file.name}`);
        console.error(error);
        continue;
      }

      const { data: urlData } = supabase.storage.from("project-drawings").getPublicUrl(path);
      const baseName = file.name.replace(/\.[^.]+$/, "").replace(/[_-]/g, " ");
      newDrawings.push({
        url: urlData.publicUrl,
        title: baseName.charAt(0).toUpperCase() + baseName.slice(1),
        fileType: isPDF ? "pdf" : "image",
      });
    }

    onChange([...drawings, ...newDrawings]);
    setUploading(false);
    if (newDrawings.length > 0) toast.success(`${newDrawings.length} file${newDrawings.length > 1 ? "s" : ""} uploaded`);
  };

  const handleDelete = async (index: number) => {
    const drawing = drawings[index];
    const urlParts = drawing.url.split("/project-drawings/");
    if (urlParts[1]) {
      await supabase.storage.from("project-drawings").remove([decodeURIComponent(urlParts[1])]);
    }
    onChange(drawings.filter((_, i) => i !== index));
  };

  const updateTitle = (index: number, title: string) => {
    const updated = [...drawings];
    updated[index] = { ...updated[index], title };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FileImage className="w-4 h-4 text-secondary" />
        <Label className="text-sm font-semibold">Concept Drawings & Plans</Label>
        <span className="text-xs text-muted-foreground">({drawings.length}/4)</span>
      </div>

      {/* Upload area */}
      {drawings.length < 4 && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleUpload(e.dataTransfer.files); }}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-secondary/50 hover:bg-secondary/5 transition-all duration-300"
        >
          <Upload className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">
            {uploading ? "Uploading..." : "Upload floor plans, site plans, elevations"}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">PNG, JPG, or PDF up to 10MB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,application/pdf"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
        </div>
      )}

      {/* File list */}
      {drawings.length > 0 && (
        <div className="space-y-3">
          {drawings.map((drawing, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border">
              {drawing.fileType === "pdf" ? (
                <div className="w-16 h-16 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-8 h-8 text-red-500" />
                </div>
              ) : (
                <img
                  src={drawing.url}
                  alt={drawing.title}
                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <Input
                  value={drawing.title}
                  onChange={(e) => updateTitle(i, e.target.value)}
                  placeholder="e.g., Floor Plan, Site Plan, Elevation"
                  className="h-8 text-sm"
                />
                <p className="text-[10px] text-muted-foreground mt-1 uppercase">{drawing.fileType}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive/80 flex-shrink-0"
                onClick={() => handleDelete(i)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
