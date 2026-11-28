const steps = [
  { number: "01", title: "Create a project", description: "Start a new development package for your property." },
  { number: "02", title: "Fill in each section with guided help", description: "Work through each section with built-in guidance and examples." },
  { number: "03", title: "Check your numbers with the built-in analysis", description: "Review budgets, returns and rule checks as you go." },
  { number: "04", title: "Export lender-ready PDFs and Excel", description: "Download the package in the formats lenders expect." },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-20 px-6 bg-muted/30 scroll-mt-24">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">How It Works</h2>
        </div>
        <ol className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {steps.map((step) => (
            <li key={step.number} className="rounded-xl border border-gray-200 bg-white p-8 shadow-md">
              <p className="text-sm font-bold text-secondary mb-4">{step.number}</p>
              <h3 className="text-lg font-semibold text-foreground mb-3">{step.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};

export default HowItWorks;
