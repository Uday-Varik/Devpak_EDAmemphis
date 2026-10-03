import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { CurrencyInput } from "./CurrencyInput";

interface CustomItem {
  label: string;
  amount: number;
}

interface CustomLineItemsProps {
  items: CustomItem[];
  onAdd: () => void;
  onUpdate: (index: number, field: "label" | "amount", value: any) => void;
  onRemove: (index: number) => void;
  maxItems?: number;
}

export const CustomLineItems = ({ items, onAdd, onUpdate, onRemove, maxItems = 10 }: CustomLineItemsProps) => (
  <div className="space-y-3">
    {items.map((item, i) => (
      <div
        key={i}
        className="flex gap-3 items-end border-l-2 border-dashed border-border pl-3 animate-in fade-in slide-in-from-top-2 duration-300"
      >
        <div className="flex-1 space-y-1">
          {i === 0 && <Label className="text-xs text-muted-foreground">Item Name</Label>}
          <Input
            placeholder="Custom item name"
            value={item.label}
            onChange={(e) => onUpdate(i, "label", e.target.value)}
          />
        </div>
        <div className="w-40 space-y-1">
          {i === 0 && <Label className="text-xs text-muted-foreground">Amount</Label>}
          <CurrencyInput
            value={item.amount}
            onChange={(v) => onUpdate(i, "amount", v)}
            placeholder="Amount"
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 text-muted-foreground hover:text-destructive shrink-0"
          onClick={() => onRemove(i)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    ))}
    {items.length < maxItems && (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onAdd}
        className="text-xs gap-1.5"
      >
        <Plus className="w-3.5 h-3.5" />
        Add Line Item
      </Button>
    )}
  </div>
);
