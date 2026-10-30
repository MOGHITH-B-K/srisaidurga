"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Store, Loader2 } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 4) {
      toast.error("Password must be at least 4 characters long");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/admin/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          username: formData.username,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Registration failed. Please try again.");
        return;
      }

      // Also persist to localStorage for offline fallback login
      const savedAdmins = JSON.parse(localStorage.getItem("shop_admins") || "[]");
      const savedPasswords = JSON.parse(localStorage.getItem("shop_admin_passwords") || "{}");
      if (!savedAdmins.some((a: any) => a.username === formData.username)) {
        savedAdmins.push({ id: String(data.user.id), username: formData.username, name: formData.name });
        savedPasswords[formData.username] = formData.password;
        localStorage.setItem("shop_admins", JSON.stringify(savedAdmins));
        localStorage.setItem("shop_admin_passwords", JSON.stringify(savedPasswords));
      }

      toast.success("Account created successfully! Please log in.");
      router.push("/login?registered=true");
    } catch {
      toast.error("An error occurred during registration");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md">
        <div className="bg-card border rounded-lg shadow-lg p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-primary text-primary-foreground p-3 rounded-full mb-4">
              <Store className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-center">SREE SAI DURGA</h1>
            <p className="text-sm text-muted-foreground text-center mt-1">Create Admin Account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Shop Owner / Admin Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter username (e.g., ADMIN)"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="off"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                autoComplete="off"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Log in here
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-4 text-center text-xs text-muted-foreground">
          <p>MAIN ROAD, THIRUVENNAI NALLUR</p>
          <p>VILLUPURAM Dt, PINCODE: 607203</p>
          <p>CALL: 9790548669, 9442378669</p>
        </div>
      </div>
    </div>
  );
}
