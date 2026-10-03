import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
  helpText?: string;
  suffix?: string;
}

export const CurrencyInput = ({
  value,
  onChange,
  placeholder = "0",
  readOnly = false,
  className,
  helpText,
  suffix,
}: CurrencyInputProps) => {
  const [displayValue, setDisplayValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Format number with commas, whole dollars only
  const formatCurrency = (num: number): string => {
    const rounded = Math.round(num || 0);
    if (rounded === 0) return "";
    return rounded.toLocaleString("en-US", { maximumFractionDigits: 0 });
  };

  // Parse formatted string back to a non-negative number (minus signs are stripped)
  const parseCurrency = (str: string): number => {
    const cleaned = str.replace(/[^0-9.]/g, "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : Math.max(0, parsed);
  };

  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatCurrency(value));
    }
  }, [value, isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    setDisplayValue(value === 0 ? "" : value.toString());
  };

  const handleBlur = () => {
    setIsFocused(false);
    const parsed = parseCurrency(displayValue);
    onChange(parsed);
    setDisplayValue(formatCurrency(parsed));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Allow only numbers, decimals, and commas during typing
    const cleaned = raw.replace(/[^0-9.,]/g, "");
    setDisplayValue(cleaned);
    
    // Update parent with parsed value for real-time calculations
    const parsed = parseCurrency(cleaned);
    onChange(parsed);
  };

  return (
    <div className="relative flex items-center gap-2">
      <div className="relative flex-1">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
          $
        </span>
        <Input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          readOnly={readOnly}
          className={cn(
            "pl-7 pr-3 text-right font-medium transition-all duration-200",
            readOnly && "bg-gray-50 border-gray-200 text-gray-700 cursor-not-allowed",
            !readOnly && "hover:border-primary/50 focus:border-primary",
            className
          )}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            {suffix}
          </span>
        )}
      </div>
      {helpText && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs text-sm">
              {helpText}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};

interface PercentageInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  helpText?: string;
}

export const PercentageInput = ({
  value,
  onChange,
  placeholder = "0",
  className,
  helpText,
}: PercentageInputProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = parseFloat(e.target.value);
    onChange(isNaN(parsed) ? 0 : parsed);
  };

  return (
    <div className="relative flex items-center gap-2">
      <div className="relative flex-1">
        <Input
          type="number"
          value={value || ""}
          onChange={handleChange}
          placeholder={placeholder}
          min={0}
          max={100}
          step={0.5}
          className={cn(
            "pr-8 text-right font-medium transition-all duration-200",
            "hover:border-primary/50 focus:border-primary",
            className
          )}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
          %
        </span>
      </div>
      {helpText && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="max-w-xs text-sm">
              {helpText}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
};
