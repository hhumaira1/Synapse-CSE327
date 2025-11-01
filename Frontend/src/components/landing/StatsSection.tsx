export function StatsSection() {
  const stats = [
    { number: "10K+", label: "Active Users" },
    { number: "98%", label: "Customer Satisfaction" },
    { number: "3.2x", label: "Faster Deal Closing" },
    { number: "24/7", label: "Support Available" }
  ];

  return (
    <section className="border-y border-[#e5e7eb]/50 dark:border-[#1f2937]/50 bg-linear-to-r from-white/50 to-[#fafbff]/50 dark:from-[#0f1117]/50 dark:to-[#14151f]/50 backdrop-blur-sm py-16">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center group">
              <div className="text-4xl font-black bg-linear-to-r from-[#6366f1] to-[#a855f7] bg-clip-text text-transparent md:text-5xl transition-transform group-hover:scale-110">
                {stat.number}
              </div>
              <div className="text-sm font-medium text-[#64748b] dark:text-[#94a3b8] mt-2">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}