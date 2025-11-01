import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export function PricingSection() {
  const pricingPlans = [
    {
      name: "Starter",
      price: "$29",
      period: "per month",
      description: "Perfect for small teams getting started",
      features: ["Up to 5 users", "Basic contact management", "Email support", "1GB storage"],
      gradient: "from-[#3b82f6] to-[#6366f1]"
    },
    {
      name: "Professional",
      price: "$79",
      period: "per month",
      description: "Everything growing teams need",
      features: ["Up to 20 users", "Advanced analytics", "Priority support", "AI insights", "10GB storage"],
      popular: true,
      gradient: "from-[#6366f1] to-[#8b5cf6]"
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "tailored for you",
      description: "For large organizations with complex needs",
      features: ["Unlimited users", "Custom integrations", "Dedicated support", "Advanced security", "Unlimited storage"],
      gradient: "from-[#8b5cf6] to-[#a855f7]"
    }
  ];

  return (
    <section id="pricing" className="container mx-auto px-6 py-24">
      <div className="mb-16 text-center">
        <Badge variant="outline" className="mb-4 border-[#6366f1]/30 text-[#6366f1]">
          Pricing
        </Badge>
        <h2 className="mb-4 text-4xl font-black text-[#0f172a] dark:text-white md:text-5xl">
          Simple, transparent pricing
        </h2>
        <p className="mx-auto max-w-2xl text-lg text-[#475569] dark:text-[#cbd5e1]">
          Start free and scale as you grow. No hidden fees, no surprises.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
        {pricingPlans.map((plan, index) => (
          <Card 
            key={index} 
            className={`relative border-[#e5e7eb]/50 dark:border-[#1f2937]/50 bg-white dark:bg-[#14151f] transition-all duration-300 hover:-translate-y-2 ${
              plan.popular ? 'ring-2 ring-[#6366f1] shadow-2xl shadow-[#6366f1]/30 scale-105' : 'hover:shadow-xl'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-linear-to-r from-[#6366f1] to-[#8b5cf6] px-4 py-1 shadow-lg">
                  Most Popular
                </Badge>
              </div>
            )}
            <CardHeader className="text-center pt-8">
              <CardTitle className="text-2xl font-bold text-[#0f172a] dark:text-white">
                {plan.name}
              </CardTitle>
              <div className="my-6">
                <span className="text-5xl font-black bg-linear-to-r from-[#6366f1] to-[#a855f7] bg-clip-text text-transparent">
                  {plan.price}
                </span>
                <span className="text-[#64748b] dark:text-[#94a3b8]">
                  /{plan.period}
                </span>
              </div>
              <CardDescription className="text-[#475569] dark:text-[#cbd5e1]">
                {plan.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-8">
              <ul className="space-y-4 mb-6">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-[#10b981] shrink-0" />
                    <span className="text-sm text-[#475569] dark:text-[#cbd5e1]">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              <Button 
                className={`w-full font-semibold ${
                  plan.popular 
                    ? 'bg-linear-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#5558e3] hover:to-[#7c4fe5] shadow-lg shadow-[#6366f1]/30' 
                    : 'bg-linear-to-r from-[#3b82f6] to-[#6366f1] hover:from-[#2563eb] hover:to-[#5558e3]'
                }`}
              >
                Get Started
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}