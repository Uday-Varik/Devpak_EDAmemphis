import { ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface MultiSelectCheckboxProps {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  className?: string;
}

export const MultiSelectCheckbox = ({
  options,
  value,
  onChange,
  placeholder = "Select…",
  className,
}: MultiSelectCheckboxProps) => {
  const toggle = (opt: string) => {
    if (value.includes(opt)) onChange(value.filter((v) => v !== opt));
    else onChange([...value, opt]);
  };
  const label =
    value.length === 0
      ? placeholder
      : value.length <= 2
        ? value.join(" / ")
        : `${value.length} selected`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn("w-full justify-between font-normal", value.length === 0 && "text-muted-foreground", className)}
        >
          <span className="truncate text-left">{label}</span>
          <ChevronDown className="w-4 h-4 opacity-50 flex-shrink-0 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-1" align="start">
        <div className="max-h-64 overflow-y-auto">
          {options.map((opt) => {
            const checked = value.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => toggle(opt)}
                className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded hover:bg-muted text-left"
              >
                <Checkbox checked={checked} className="pointer-events-none" />
                <span className="flex-1">{opt}</span>
                {checked && <Check className="w-3.5 h-3.5 text-primary" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Coerce legacy string values into array form for multi-select usage.
export const toArrayValue = (v: unknown): string[] => {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string" && x.length > 0);
  if (typeof v === "string" && v.length > 0) return [v];
  return [];
};
