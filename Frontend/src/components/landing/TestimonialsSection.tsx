import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

export function TestimonialsSection() {
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Sales Director, TechCorp",
      content: "SynapseCRM reduced our sales cycle by 40%. The AI insights are game-changing!",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "Founder, StartupXYZ",
      content: "Finally, a CRM that actually helps us sell more instead of just tracking data.",
      rating: 5
    },
    {
      name: "Emily Davis",
      role: "Account Executive",
      content: "The automation features saved me 10+ hours per week. Incredible ROI.",
      rating: 5
    }
  ];

  return (
    <section id="testimonials" className="relative bg-linear-to-b from-[#fafbff] to-white dark:from-[#0a0b14] dark:to-[#0f1117] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-[#6366f1]/10 via-transparent to-transparent" />
      <div className="relative container mx-auto px-6 py-24">
        <div className="mb-16 text-center">
          <Badge variant="outline" className="mb-4 border-[#6366f1]/30 text-[#6366f1]">
            Testimonials
          </Badge>
          <h2 className="mb-4 text-4xl font-black text-[#0f172a] dark:text-white md:text-5xl">
            Loved by sales teams worldwide
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-[#475569] dark:text-[#cbd5e1]">
            See what our customers are saying about their experience with SynapseCRM.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-[#e5e7eb]/50 dark:border-[#1f2937]/50 bg-white dark:bg-[#14151f] hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="mb-4 flex gap-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-[#fbbf24] text-[#fbbf24]" />
                  ))}
                </div>
                <p className="mb-6 text-[#475569] dark:text-[#cbd5e1] leading-relaxed">
                  &ldquo;{testimonial.content}&rdquo;
                </p>
                <div>
                  <p className="font-bold text-[#0f172a] dark:text-white">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-[#64748b] dark:text-[#94a3b8]">
                    {testimonial.role}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}