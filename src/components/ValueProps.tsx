import { FileText, Calculator, Download, GraduationCap } from "lucide-react";

const ValueProps = () => {
  const features = [
    {
      icon: FileText,
      title: "Guided Process",
      description: "Step-by-step package building with expert guidance. No guesswork—just follow the prompts and build your complete development package.",
      gridClass: "md:col-span-2", // 65% width
    },
    {
      icon: Calculator,
      title: "Financial Analysis",
      description: "Auto-calculated ROI, cap rates, and feasibility metrics. Make data-driven decisions with professional-grade financial projections.",
      gridClass: "md:col-span-1", // 35% width
    },
    {
      icon: Download,
      title: "Professional Output",
      description: "Generate lender-ready PDFs and investor summaries. Present your projects with confidence using polished, professional documents.",
      gridClass: "md:col-span-1", // 35% width
    },
    {
      icon: GraduationCap,
      title: "Expert Guidance",
      description: "Built on the proven Emerging Developer Academy curriculum. Learn as you build with integrated educational content and best practices from industry experts.",
      gridClass: "md:col-span-2", // 65% width
    },
  ];

  return (
    <section className="py-20 px-6 bg-muted/30">
      <div className="mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Everything You Need to Secure Financing
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From property analysis to professional presentations, DevPack guides you through every step of creating compelling financing packages.
          </p>
        </div>

        {/* Bento Grid - 3 columns with varied spans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`${feature.gridClass} bg-white rounded-xl p-8 border border-gray-200 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group`}
            >
              <div className="w-12 h-12 rounded-lg icon-gradient flex items-center justify-center mb-6 group-hover:scale-105 transition-transform duration-300">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ValueProps;
