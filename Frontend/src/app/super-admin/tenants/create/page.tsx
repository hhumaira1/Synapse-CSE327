"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { superAdminApi } from "@/lib/super-admin/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Building2, Mail, User, Link as LinkIcon, Copy, Check } from "lucide-react";
import Link from "next/link";

export default function CreateTenantPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [successDialog, setSuccessDialog] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    type: "ORGANIZATION" as "ORGANIZATION" | "PERSONAL" | "BUSINESS",
    adminEmail: "",
    adminFirstName: "",
    adminLastName: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleInputChange(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user types
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    // Auto-generate slug from name
    if (field === "name" && !formData.slug) {
      const autoSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setFormData((prev) => ({ ...prev, slug: autoSlug }));
    }
  }

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Tenant name is required";
    }

    if (!formData.slug.trim()) {
      newErrors.slug = "Slug is required";
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = "Slug can only contain lowercase letters, numbers, and hyphens";
    }

    if (!formData.adminEmail.trim()) {
      newErrors.adminEmail = "Admin email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.adminEmail)) {
      newErrors.adminEmail = "Invalid email format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      const result = await superAdminApi.createTenant({
        name: formData.name,
        slug: formData.slug,
        type: formData.type,
        adminEmail: formData.adminEmail,
        adminFirstName: formData.adminFirstName || undefined,
        adminLastName: formData.adminLastName || undefined,
      });
      
      setSuccessDialog(result);
    } catch (error: any) {
      console.error("Failed to create tenant:", error);
      if (error.message.includes("already exists")) {
        setErrors({ slug: "This slug is already taken" });
      } else {
        setErrors({ submit: error.message || "Failed to create tenant" });
      }
    } finally {
      setLoading(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/super-admin/tenants">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Create New Tenant
          </h1>
          <p className="mt-2 text-gray-600">
            Set up a new tenant organization with an admin user
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-purple-600" />
              Tenant Details
            </CardTitle>
            <CardDescription>
              Provide the basic information for the new tenant
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Tenant Name */}
            <div className="space-y-2">
              <Label htmlFor="name">
                Tenant Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="e.g., Acme Corporation"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug">
                Slug <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <span className="flex items-center px-3 text-sm text-gray-500 bg-gray-100 border border-r-0 rounded-l-md">
                  /
                </span>
                <Input
                  id="slug"
                  placeholder="acme-corporation"
                  value={formData.slug}
                  onChange={(e) => handleInputChange("slug", e.target.value)}
                  className={`rounded-l-none ${errors.slug ? "border-red-500" : ""}`}
                />
              </div>
              {errors.slug && (
                <p className="text-sm text-red-500">{errors.slug}</p>
              )}
              <p className="text-xs text-gray-500">
                URL-friendly identifier (lowercase letters, numbers, and hyphens only)
              </p>
            </div>

            {/* Tenant Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Tenant Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: any) =>
                  setFormData((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ORGANIZATION">Organization</SelectItem>
                  <SelectItem value="BUSINESS">Business</SelectItem>
                  <SelectItem value="PERSONAL">Personal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Divider */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-purple-600" />
                Admin User
              </h3>
            </div>

            {/* Admin Email */}
            <div className="space-y-2">
              <Label htmlFor="adminEmail">
                Admin Email <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="adminEmail"
                  type="email"
                  placeholder="admin@acme.com"
                  value={formData.adminEmail}
                  onChange={(e) => handleInputChange("adminEmail", e.target.value)}
                  className={`pl-10 ${errors.adminEmail ? "border-red-500" : ""}`}
                />
              </div>
              {errors.adminEmail && (
                <p className="text-sm text-red-500">{errors.adminEmail}</p>
              )}
              <p className="text-xs text-gray-500">
                An invitation will be sent to this email address
              </p>
            </div>

            {/* Admin First Name */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="adminFirstName">First Name (Optional)</Label>
                <Input
                  id="adminFirstName"
                  placeholder="John"
                  value={formData.adminFirstName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      adminFirstName: e.target.value,
                    }))
                  }
                />
              </div>

              {/* Admin Last Name */}
              <div className="space-y-2">
                <Label htmlFor="adminLastName">Last Name (Optional)</Label>
                <Input
                  id="adminLastName"
                  placeholder="Doe"
                  value={formData.adminLastName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      adminLastName: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Link href="/super-admin/tenants" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {loading ? "Creating..." : "Create Tenant"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Success Dialog */}
      <Dialog open={!!successDialog} onOpenChange={() => {
        setSuccessDialog(null);
        router.push("/super-admin/tenants");
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Check className="h-6 w-6" />
              Tenant Created Successfully!
            </DialogTitle>
            <DialogDescription>
              The tenant has been created and an invitation has been generated
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-purple-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Tenant Details</h4>
              <div className="space-y-1 text-sm">
                <p><span className="text-gray-600">Name:</span> <span className="font-semibold">{successDialog?.tenant?.name}</span></p>
                <p><span className="text-gray-600">Slug:</span> <span className="font-mono">{successDialog?.tenant?.slug}</span></p>
                <p><span className="text-gray-600">Type:</span> <span className="font-semibold">{successDialog?.tenant?.type}</span></p>
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                Invitation Link
              </h4>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={successDialog?.invitationLink || ""}
                  className="font-mono text-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(successDialog?.invitationLink || "")}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Share this link with the admin user to complete registration
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setSuccessDialog(null);
                router.push("/super-admin/tenants");
              }}
              className="flex-1"
            >
              View All Tenants
            </Button>
            <Button
              onClick={() => {
                setSuccessDialog(null);
                router.push(`/super-admin/tenants/${successDialog?.tenant?.id}`);
              }}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
            >
              View Tenant Details
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
