const highlights = [
  { value: "10", label: "package sections" },
  { value: "4", label: "export formats" },
  { value: "Memphis", label: "specific data and subsidies" },
];

const MemphisHighlights = () => {
  return (
    <section className="py-16 px-6 bg-background">
      <div className="mx-auto max-w-5xl text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-10">
          Built for Memphis developers
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {highlights.map((item) => (
            <div key={item.label} className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
              <p className="text-3xl font-bold text-primary mb-2">{item.value}</p>
              <p className="text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MemphisHighlights;
