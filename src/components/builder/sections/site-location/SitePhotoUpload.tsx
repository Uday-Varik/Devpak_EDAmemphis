import { useState, useRef } from "react";
import { Camera, Trash2, Star, Upload, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SitePhoto {
  url: string;
  caption: string;
  featured: boolean;
}

interface SitePhotoUploadProps {
  photos: SitePhoto[];
  onChange: (photos: SitePhoto[]) => void;
  projectId: string;
}

export const SitePhotoUpload = ({ photos, onChange, projectId }: SitePhotoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (photos.length + files.length > 6) {
      toast.error("Maximum 6 photos allowed");
      return;
    }

    setUploading(true);
    const newPhotos: SitePhoto[] = [];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        continue;
      }

      const ext = file.name.split(".").pop() || "jpg";
      const path = `${projectId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage
        .from("project-photos")
        .upload(path, file, { upsert: false });

      if (error) {
        toast.error(`Failed to upload ${file.name}`);
        console.error(error);
        continue;
      }

      const { data: urlData } = supabase.storage.from("project-photos").getPublicUrl(path);
      newPhotos.push({ url: urlData.publicUrl, caption: "", featured: photos.length === 0 && newPhotos.length === 0 });
    }

    onChange([...photos, ...newPhotos]);
    setUploading(false);
    if (newPhotos.length > 0) toast.success(`${newPhotos.length} photo${newPhotos.length > 1 ? "s" : ""} uploaded`);
  };

  const handleDelete = async (index: number) => {
    const photo = photos[index];
    // Extract path from URL
    const urlParts = photo.url.split("/project-photos/");
    if (urlParts[1]) {
      await supabase.storage.from("project-photos").remove([decodeURIComponent(urlParts[1])]);
    }
    const updated = photos.filter((_, i) => i !== index);
    // If deleted photo was featured, make first remaining photo featured
    if (photo.featured && updated.length > 0) {
      updated[0].featured = true;
    }
    onChange(updated);
  };

  const toggleFeatured = (index: number) => {
    const updated = photos.map((p, i) => ({ ...p, featured: i === index }));
    onChange(updated);
  };

  const updateCaption = (index: number, caption: string) => {
    const updated = [...photos];
    updated[index] = { ...updated[index], caption };
    onChange(updated);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleUpload(e.dataTransfer.files);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Camera className="w-4 h-4 text-secondary" />
        <Label className="text-sm font-semibold">Site Photos</Label>
        <span className="text-xs text-muted-foreground">({photos.length}/6)</span>
      </div>

      {/* Upload area */}
      {photos.length < 6 && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-secondary/50 hover:bg-secondary/5 transition-all duration-300"
        >
          <Upload className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">
            {uploading ? "Uploading..." : "Drag & drop photos here, or click to browse"}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1">JPG, PNG up to 5MB each</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleUpload(e.target.files)}
          />
        </div>
      )}

      {/* Photo grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {photos.map((photo, i) => (
            <div key={i} className="relative group rounded-lg border border-border overflow-hidden bg-muted/30">
              <div className="aspect-video relative">
                <img
                  src={photo.url}
                  alt={photo.caption || `Site photo ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                {photo.featured && (
                  <div className="absolute top-2 left-2 bg-accent text-accent-foreground text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3" fill="currentColor" /> Featured
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-7 w-7 bg-white/90 hover:bg-white shadow-sm"
                    onClick={(e) => { e.stopPropagation(); toggleFeatured(i); }}
                    title="Set as featured photo"
                  >
                    <Star className={`w-3.5 h-3.5 ${photo.featured ? "text-accent fill-accent" : "text-muted-foreground"}`} />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-7 w-7 shadow-sm"
                    onClick={(e) => { e.stopPropagation(); handleDelete(i); }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
              <div className="p-2">
                <Input
                  value={photo.caption}
                  onChange={(e) => updateCaption(i, e.target.value)}
                  placeholder="Add caption..."
                  className="h-7 text-xs border-0 bg-transparent px-1 focus-visible:ring-1"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
