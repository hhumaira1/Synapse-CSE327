"use client"
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  Users, 
  BarChart3, 
  Zap, 
  Shield, 
  Cloud, 
  Sparkles, 
  CheckCircle,
  Play,
  Star,
  Menu,
  X,
  MessageCircle,
  TrendingUp,
  Target
} from "lucide-react";
import { useState } from "react";

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

  const stats = [
    { number: "10K+", label: "Active Users" },
    { number: "98%", label: "Customer Satisfaction" },
    { number: "3.2x", label: "Faster Deal Closing" },
    { number: "24/7", label: "Support Available" }
  ];

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
    <div className="min-h-screen bg-gradient-to-br from-[#fafbff] via-[#f5f7ff] to-[#eff2ff] dark:from-[#0a0b14] dark:via-[#0f1117] dark:to-[#14151f]">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-[#e5e7eb]/50 bg-white/70 backdrop-blur-xl dark:border-[#1f2937]/50 dark:bg-[#0a0b14]/70 transition-all duration-300">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#6366f1] to-[#a855f7] shadow-lg shadow-[#6366f1]/30">
              <Sparkles className="h-5 w-5 text-white" />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#a855f7] opacity-0 blur-xl transition-opacity group-hover:opacity-100" />
            </div>
            <span className="text-xl font-black bg-gradient-to-r from-[#6366f1] to-[#a855f7] bg-clip-text text-transparent">
              Synapse
            </span>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="relative text-sm font-semibold text-[#1e293b] transition-all hover:text-[#6366f1] dark:text-[#cbd5e1] dark:hover:text-white group">
              Features
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#6366f1] to-[#a855f7] transition-all group-hover:w-full"></span>
            </a>
            <a href="#pricing" className="relative text-sm font-semibold text-[#1e293b] transition-all hover:text-[#6366f1] dark:text-[#cbd5e1] dark:hover:text-white group">
              Pricing
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#6366f1] to-[#a855f7] transition-all group-hover:w-full"></span>
            </a>
            <a href="#testimonials" className="relative text-sm font-semibold text-[#1e293b] transition-all hover:text-[#6366f1] dark:text-[#cbd5e1] dark:hover:text-white group">
              Testimonials
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-[#6366f1] to-[#a855f7] transition-all group-hover:w-full"></span>
            </a>
            <Button variant="outline" size="sm" className="border-[#6366f1]/30 text-[#1e293b] hover:bg-[#6366f1]/10 dark:text-white font-semibold">
              Sign In
            </Button>
            <Button size="sm" className="bg-gradient-to-r from-[#6366f1] to-[#a855f7] hover:from-[#5558e3] hover:to-[#9848e8] shadow-lg shadow-[#6366f1]/30 font-semibold">
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-[#1e293b] dark:text-[#cbd5e1]"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="absolute left-0 right-0 top-full bg-white/95 backdrop-blur-xl dark:bg-[#0a0b14]/95 md:hidden border-b border-[#e5e7eb]/50 dark:border-[#1f2937]/50">
            <div className="container mx-auto px-6 py-4">
              <div className="flex flex-col space-y-4">
                <a href="#features" className="py-2 font-semibold text-[#1e293b] dark:text-[#cbd5e1]">Features</a>
                <a href="#pricing" className="py-2 font-semibold text-[#1e293b] dark:text-[#cbd5e1]">Pricing</a>
                <a href="#testimonials" className="py-2 font-semibold text-[#1e293b] dark:text-[#cbd5e1]">Testimonials</a>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1 border-[#6366f1]/30 text-[#1e293b] dark:text-white">Sign In</Button>
                  <Button className="flex-1 bg-gradient-to-r from-[#6366f1] to-[#a855f7]">Get Started</Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative container mx-auto px-6 py-20 md:py-32 overflow-hidden">
        {/* Animated background gradient orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-[#6366f1]/20 to-[#8b5cf6]/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-br from-[#a855f7]/20 to-[#ec4899]/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '700ms'}} />
        
        <div className="relative mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-6 bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white border-0 px-4 py-1.5 shadow-lg shadow-[#6366f1]/20">
            <Sparkles className="mr-1.5 h-3.5 w-3.5 animate-pulse" />
            AI-Powered CRM
          </Badge>
          <h1 className="mb-6 bg-gradient-to-br from-[#0f172a] via-[#6366f1] to-[#8b5cf6] bg-clip-text text-5xl font-black tracking-tight text-transparent dark:from-white dark:via-[#a78bfa] dark:to-[#c084fc] md:text-7xl lg:text-8xl">
            Transform Your Customer Relationships
          </h1>
          <p className="mb-10 text-lg text-[#475569] dark:text-[#cbd5e1] md:text-xl leading-relaxed max-w-3xl mx-auto">
            SynapseCRM helps you manage contacts, close deals faster, and grow your business with intelligent automation and insights. Experience the future of customer relationship management.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button size="lg" className="group w-full bg-gradient-to-r from-[#6366f1] via-[#8b5cf6] to-[#a855f7] hover:from-[#5558e3] hover:via-[#7c4fe5] hover:to-[#9848e8] sm:w-auto shadow-2xl shadow-[#6366f1]/50 px-8 py-6 text-lg font-semibold">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button size="lg" variant="outline" className="group w-full border-2 border-[#6366f1] text-[#6366f1] hover:bg-[#6366f1] hover:text-white sm:w-auto px-8 py-6 text-lg font-semibold transition-all duration-300">
              <Play className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
              Watch Demo
            </Button>
          </div>
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-[#64748b] dark:text-[#94a3b8]">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-[#10b981]" />
              <span>No credit card</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-[#10b981]" />
              <span>14-day trial</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="h-4 w-4 text-[#10b981]" />
              <span>5-min setup</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-[#e5e7eb]/50 dark:border-[#1f2937]/50 bg-gradient-to-r from-white/50 to-[#fafbff]/50 dark:from-[#0f1117]/50 dark:to-[#14151f]/50 backdrop-blur-sm py-16">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="text-4xl font-black bg-gradient-to-r from-[#6366f1] to-[#a855f7] bg-clip-text text-transparent md:text-5xl transition-transform group-hover:scale-110">
                  {stat.number}
                </div>
                <div className="text-sm font-medium text-[#64748b] dark:text-[#94a3b8] mt-2">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-6 py-24">
        <div className="mb-16 text-center">
          <Badge variant="outline" className="mb-4 border-[#6366f1]/30 text-[#6366f1]">Features</Badge>
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
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-[#6366f1]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader className="relative">
                <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.color} shadow-lg shadow-current/30 transition-transform group-hover:scale-110 group-hover:rotate-3`}>
                  <feature.icon className="h-7 w-7 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-[#0f172a] dark:text-white">{feature.title}</CardTitle>
                <CardDescription className="mt-2 text-base text-[#475569] dark:text-[#cbd5e1] leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="relative bg-gradient-to-b from-[#fafbff] to-white dark:from-[#0a0b14] dark:to-[#0f1117] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#6366f1]/10 via-transparent to-transparent" />
        <div className="relative container mx-auto px-6 py-24">
          <div className="mb-16 text-center">
            <Badge variant="outline" className="mb-4 border-[#6366f1]/30 text-[#6366f1]">Testimonials</Badge>
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
                  <p className="mb-6 text-[#475569] dark:text-[#cbd5e1] leading-relaxed">&ldquo;{testimonial.content}&rdquo;</p>
                  <div>
                    <p className="font-bold text-[#0f172a] dark:text-white">{testimonial.name}</p>
                    <p className="text-sm text-[#64748b] dark:text-[#94a3b8]">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-6 py-24">
        <div className="mb-16 text-center">
          <Badge variant="outline" className="mb-4 border-[#6366f1]/30 text-[#6366f1]">Pricing</Badge>
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
                  <Badge className="bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] px-4 py-1 shadow-lg">Most Popular</Badge>
                </div>
              )}
              <CardHeader className="text-center pt-8">
                <CardTitle className="text-2xl font-bold text-[#0f172a] dark:text-white">{plan.name}</CardTitle>
                <div className="my-6">
                  <span className="text-5xl font-black bg-gradient-to-r from-[#6366f1] to-[#a855f7] bg-clip-text text-transparent">
                    {plan.price}
                  </span>
                  <span className="text-[#64748b] dark:text-[#94a3b8]">/{plan.period}</span>
                </div>
                <CardDescription className="text-[#475569] dark:text-[#cbd5e1]">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-8">
                <ul className="space-y-4 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-[#10b981] flex-shrink-0" />
                      <span className="text-sm text-[#475569] dark:text-[#cbd5e1]">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className={`w-full font-semibold ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] hover:from-[#5558e3] hover:to-[#7c4fe5] shadow-lg shadow-[#6366f1]/30' 
                      : 'bg-gradient-to-r from-[#3b82f6] to-[#6366f1] hover:from-[#2563eb] hover:to-[#5558e3]'
                  }`}
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-24">
        <Card className="relative overflow-hidden border-none bg-gradient-to-r from-[#6366f1] via-[#8b5cf6] to-[#a855f7] shadow-2xl shadow-[#6366f1]/30">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-40" />
          <CardContent className="relative p-12 text-center">
            <h2 className="mb-4 text-4xl font-black text-white md:text-5xl">
              Ready to transform your sales process?
            </h2>
            <p className="mb-8 text-lg text-white/90 max-w-2xl mx-auto">
              Join thousands of teams already using SynapseCRM to close more deals and grow faster.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" className="bg-white text-[#6366f1] hover:bg-white/90 font-semibold px-8 py-6 shadow-xl">
                Start Your Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white/10 font-semibold px-8 py-6">
                Schedule a Demo
              </Button>
            </div>
            <div className="mt-6 flex items-center justify-center gap-6 text-sm text-white/80">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4" />
                Full features
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4" />
                No credit card
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4" />
                14-day trial
              </span>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#e5e7eb]/50 dark:border-[#1f2937]/50 bg-white dark:bg-[#0a0b14]">
        <div className="container mx-auto px-6 py-12">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="mb-4 flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#6366f1] to-[#a855f7] shadow-lg shadow-[#6366f1]/30">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-black bg-gradient-to-r from-[#6366f1] to-[#a855f7] bg-clip-text text-transparent">
                  SynapseCRM
                </span>
              </div>
              <p className="text-sm text-[#64748b] dark:text-[#94a3b8] leading-relaxed">
                The modern CRM for modern teams. Transform your customer relationships today.
              </p>
            </div>
            <div>
              <h3 className="mb-4 font-bold text-[#0f172a] dark:text-white">Product</h3>
              <ul className="space-y-3 text-sm text-[#64748b] dark:text-[#94a3b8]">
                <li><a href="#" className="transition-colors hover:text-[#6366f1] dark:hover:text-white">Features</a></li>
                <li><a href="#" className="transition-colors hover:text-[#6366f1] dark:hover:text-white">Pricing</a></li>
                <li><a href="#" className="transition-colors hover:text-[#6366f1] dark:hover:text-white">Security</a></li>
                <li><a href="#" className="transition-colors hover:text-[#6366f1] dark:hover:text-white">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 font-bold text-[#0f172a] dark:text-white">Company</h3>
              <ul className="space-y-3 text-sm text-[#64748b] dark:text-[#94a3b8]">
                <li><a href="#" className="transition-colors hover:text-[#6366f1] dark:hover:text-white">About</a></li>
                <li><a href="#" className="transition-colors hover:text-[#6366f1] dark:hover:text-white">Blog</a></li>
                <li><a href="#" className="transition-colors hover:text-[#6366f1] dark:hover:text-white">Careers</a></li>
                <li><a href="#" className="transition-colors hover:text-[#6366f1] dark:hover:text-white">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 font-bold text-[#0f172a] dark:text-white">Legal</h3>
              <ul className="space-y-3 text-sm text-[#64748b] dark:text-[#94a3b8]">
                <li><a href="#" className="transition-colors hover:text-[#6366f1] dark:hover:text-white">Privacy</a></li>
                <li><a href="#" className="transition-colors hover:text-[#6366f1] dark:hover:text-white">Terms</a></li>
                <li><a href="#" className="transition-colors hover:text-[#6366f1] dark:hover:text-white">Security</a></li>
                <li><a href="#" className="transition-colors hover:text-[#6366f1] dark:hover:text-white">Compliance</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-[#e5e7eb]/50 dark:border-[#1f2937]/50 pt-8 text-center text-sm text-[#64748b] dark:text-[#94a3b8]">
            © 2025 SynapseCRM. All rights reserved. Built with ❤️ for sales teams everywhere.
          </div>
        </div>
      </footer>
    </div>
  );
}