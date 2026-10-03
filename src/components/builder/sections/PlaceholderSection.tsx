import { Construction } from "lucide-react";

interface PlaceholderSectionProps {
  title: string;
  description: string;
}

export const PlaceholderSection = ({ title, description }: PlaceholderSectionProps) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-md">
      <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center mx-auto mb-6">
        <Construction className="w-8 h-8 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-semibold text-foreground mb-2">
        {title} - Coming Soon
      </h2>
      <p className="text-muted-foreground max-w-md mx-auto">
        {description}
      </p>
    </div>
  );
};
