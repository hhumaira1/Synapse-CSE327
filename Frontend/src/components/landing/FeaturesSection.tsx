import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, BarChart3, Zap, Shield, Cloud, Sparkles } from "lucide-react";

export function FeaturesSection() {
  const features = [
    {
      icon: Users,
      title: "Contact Management",
      description: "Organize and track all your customer interactions in one place with smart contact profiles.",
      color: "from-[#6366f1] to-[#8b5cf6]"
    },
    {
      icon: BarChart3,
      title: "Sales Analytics",
      description: "Get real-time insights into your sales pipeline with beautiful dashboards and reports.",
      color: "from-[#8b5cf6] to-[#a855f7]"
    },
    {
      icon: Zap,
      title: "Automation",
      description: "Automate repetitive tasks and workflows to focus on what matters most - closing deals.",
      color: "from-[#ec4899] to-[#f43f5e]"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-level encryption and compliance to keep your customer data safe and secure.",
      color: "from-[#10b981] to-[#14b8a6]"
    },
    {
      icon: Cloud,
      title: "Cloud-Based",
      description: "Access your CRM from anywhere, on any device with seamless cloud synchronization.",
      color: "from-[#3b82f6] to-[#6366f1]"
    },
    {
      icon: Sparkles,
      title: "AI Insights",
      description: "Leverage AI to predict customer behavior and get actionable recommendations.",
      color: "from-[#f59e0b] to-[#f97316]"
    }
  ];

  return (
    <section id="features" className="container mx-auto px-6 py-24">
      <div className="mb-16 text-center">
        <Badge variant="outline" className="mb-4 border-[#6366f1]/30 text-[#6366f1]">
          Features
        </Badge>
        <h2 className="mb-4 text-4xl font-black text-[#0f172a] dark:text-white md:text-5xl">
          Everything you need to succeed
        </h2>
        <p className="mx-auto max-w-2xl text-lg text-[#475569] dark:text-[#cbd5e1]">
          Powerful features designed for modern sales teams to boost productivity and drive revenue growth.
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => (
          <Card 
            key={index} 
            className="group relative border-[#e5e7eb]/50 dark:border-[#1f2937]/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#6366f1]/20 bg-white/50 dark:bg-[#0f1117]/50 backdrop-blur-sm overflow-hidden"
          >
            <div className="absolute inset-0 bg-linear-to-br from-transparent via-transparent to-[#6366f1]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <CardHeader className="relative">
              <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br ${feature.color} shadow-lg shadow-current/30 transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                <feature.icon className="h-7 w-7 text-white" />
              </div>
              <CardTitle className="text-xl font-bold text-[#0f172a] dark:text-white">
                {feature.title}
              </CardTitle>
              <CardDescription className="mt-2 text-base text-[#475569] dark:text-[#cbd5e1] leading-relaxed">
                {feature.description}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  );
}