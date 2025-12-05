import { Sparkles } from "lucide-react";

export function Footer() {
  const footerSections = [
    {
      title: "Product",
      links: [
        { label: "Features", href: "#" },
        { label: "Pricing", href: "#" },
        { label: "Security", href: "#" },
        { label: "Integrations", href: "#" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "About", href: "#" },
        { label: "Blog", href: "#" },
        { label: "Careers", href: "#" },
        { label: "Contact", href: "#" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy", href: "#" },
        { label: "Terms", href: "#" },
        { label: "Security", href: "#" },
        { label: "Compliance", href: "#" },
      ],
    },
  ];

  return (
    <footer className="border-t border-[#e5e7eb]/50 dark:border-[#1f2937]/50 bg-white dark:bg-[#0a0b14]">
      <div className="container mx-auto px-6 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Logo and Description */}
          <div>
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-[#6366f1] to-[#a855f7] shadow-lg shadow-[#6366f1]/30">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-black bg-linear-to-r from-[#6366f1] to-[#a855f7] bg-clip-text text-transparent">
                SynapseCRM
              </span>
            </div>
            <p className="text-sm text-[#64748b] dark:text-[#94a3b8] leading-relaxed">
              The modern CRM for modern teams. Transform your customer relationships today.
            </p>
          </div>

          {/* Footer Links */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="mb-4 font-bold text-[#0f172a] dark:text-white">
                {section.title}
              </h3>
              <ul className="space-y-3 text-sm text-[#64748b] dark:text-[#94a3b8]">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="transition-colors hover:text-[#6366f1] dark:hover:text-white"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Copyright */}
        <div className="mt-12 border-t border-[#e5e7eb]/50 dark:border-[#1f2937]/50 pt-8 text-center text-sm text-[#64748b] dark:text-[#94a3b8]">
          © 2025 SynapseCRM. All rights reserved. Built with ❤️ for sales teams everywhere.
        </div>
      </div>
    </footer>
  );
}