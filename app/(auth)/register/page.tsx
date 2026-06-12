"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock, User, Building2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(80, "Name is too long"),
    orgName: z
      .string()
      .min(2, "Organization name must be at least 2 characters")
      .max(100, "Organization name is too long"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Please enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    acceptTerms: z.literal(true, {
      errorMap: () => ({ message: "You must accept the terms and conditions" }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

const passwordRequirements = [
  { label: "At least 8 characters", test: (v: string) => v.length >= 8 },
  { label: "One uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
  { label: "One number", test: (v: string) => /[0-9]/.test(v) },
];

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const passwordValue = watch("password", "");

  // router is available for future redirect use
  void router;

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            org_name: data.orgName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        if (error.message.toLowerCase().includes("already registered")) {
          setServerError("An account with this email already exists. Try signing in instead.");
        } else {
          setServerError(error.message);
        }
        return;
      }

      setSuccess(true);
    } catch {
      setServerError("An unexpected error occurred. Please try again.");
    }
  };

  if (success) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-8 h-8 text-green-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Check your email</h2>
        <p className="text-sm text-gray-400 leading-relaxed mb-6">
          We&apos;ve sent a verification link to your email address. Click the link to activate your account and start your free trial.
        </p>
        <Link href="/login">
          <Button variant="outline" className="w-full">Back to sign in</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-white">Start your free trial</h1>
        <p className="mt-2 text-sm text-gray-400">
          No credit card required. 14 days free.
        </p>
      </div>

      {serverError && (
        <div className="mb-5 flex items-start gap-2.5 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-300">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            {...register("fullName")}
            label="Full name"
            placeholder="Jane Smith"
            error={errors.fullName?.message}
            autoComplete="name"
            leftAdornment={<User className="w-4 h-4" />}
          />
          <Input
            {...register("orgName")}
            label="Organization"
            placeholder="Acme Corp"
            error={errors.orgName?.message}
            autoComplete="organization"
            leftAdornment={<Building2 className="w-4 h-4" />}
          />
        </div>

        <Input
          {...register("email")}
          type="email"
          label="Work email"
          placeholder="you@company.com"
          error={errors.email?.message}
          autoComplete="email"
          leftAdornment={<Mail className="w-4 h-4" />}
        />

        <div className="space-y-1">
          <Input
            {...register("password")}
            type={showPassword ? "text" : "password"}
            label="Password"
            placeholder="Create a strong password"
            error={errors.password?.message}
            autoComplete="new-password"
            leftAdornment={<Lock className="w-4 h-4" />}
            rightAdornment={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="text-gray-500 hover:text-gray-300 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />
          {passwordValue.length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 px-1">
              {passwordRequirements.map(({ label, test }) => (
                <span
                  key={label}
                  className={`flex items-center gap-1 text-xs transition-colors ${
                    test(passwordValue) ? "text-green-400" : "text-gray-600"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>

        <Input
          {...register("confirmPassword")}
          type={showConfirm ? "text" : "password"}
          label="Confirm password"
          placeholder="Repeat your password"
          error={errors.confirmPassword?.message}
          autoComplete="new-password"
          leftAdornment={<Lock className="w-4 h-4" />}
          rightAdornment={
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="text-gray-500 hover:text-gray-300 transition-colors"
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
        />

        <div className="flex items-start gap-3 pt-1">
          <div className="relative mt-0.5">
            <input
              {...register("acceptTerms")}
              type="checkbox"
              id="acceptTerms"
              className="w-4 h-4 rounded border border-gray-600 bg-gray-800 text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0 focus:ring-offset-gray-900 cursor-pointer"
            />
          </div>
          <label htmlFor="acceptTerms" className="text-sm text-gray-400 leading-relaxed cursor-pointer">
            I agree to the{" "}
            <Link href="/terms" className="text-indigo-400 hover:text-indigo-300 transition-colors">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-indigo-400 hover:text-indigo-300 transition-colors">
              Privacy Policy
            </Link>
          </label>
        </div>
        {errors.acceptTerms && (
          <p className="text-xs text-red-400 -mt-2 ml-7" role="alert">
            {errors.acceptTerms.message}
          </p>
        )}

        <Button
          type="submit"
          variant="gradient"
          size="lg"
          loading={isSubmitting}
          className="w-full mt-2 shadow-lg shadow-indigo-500/20"
        >
          Create free account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
