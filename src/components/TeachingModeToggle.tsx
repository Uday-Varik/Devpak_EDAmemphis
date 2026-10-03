import { Switch } from "@/components/ui/switch";
import { useTeachingMode } from "@/hooks/useTeachingMode";
import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

interface TeachingModeToggleProps {
  className?: string;
  showIcon?: boolean;
}

export const TeachingModeToggle = ({ className, showIcon = true }: TeachingModeToggleProps) => {
  const { enabled, toggle } = useTeachingMode();
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showIcon && <GraduationCap className="w-4 h-4 text-muted-foreground" />}
      <label
        htmlFor="teaching-mode"
        className="text-sm font-medium text-foreground cursor-pointer select-none"
      >
        Teaching Mode
      </label>
      <Switch id="teaching-mode" checked={enabled} onCheckedChange={toggle} />
    </div>
  );
};
