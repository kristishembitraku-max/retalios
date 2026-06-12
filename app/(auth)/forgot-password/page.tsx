"use client";

import * as React from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, AlertCircle, ArrowLeft, MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

const forgotSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

export default function ForgotPasswordPage() {
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [submitted, setSubmitted] = React.useState(false);
  const [submittedEmail, setSubmittedEmail] = React.useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotFormData) => {
    setServerError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        setServerError(error.message);
        return;
      }

      setSubmittedEmail(data.email);
      setSubmitted(true);
    } catch {
      setServerError("An unexpected error occurred. Please try again.");
    }
  };

  if (submitted) {
    return (
      <div className="p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-5">
          <MailCheck className="w-8 h-8 text-indigo-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Check your inbox</h2>
        <p className="text-sm text-gray-400 leading-relaxed mb-1">
          We sent a password reset link to
        </p>
        <p className="text-sm font-medium text-white mb-6">{submittedEmail}</p>
        <p className="text-xs text-gray-500 mb-6">
          Didn&apos;t receive the email? Check your spam folder, or{" "}
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            try a different email
          </button>
          .
        </p>
        <Link href="/login">
          <Button variant="outline" className="w-full">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to sign in
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to sign in
        </Link>
        <h1 className="text-2xl font-bold text-white">Reset your password</h1>
        <p className="mt-2 text-sm text-gray-400">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      {serverError && (
        <div className="mb-5 flex items-start gap-2.5 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-300">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
        <Input
          {...register("email")}
          type="email"
          label="Email address"
          placeholder="you@company.com"
          error={errors.email?.message}
          autoComplete="email"
          leftAdornment={<Mail className="w-4 h-4" />}
        />

        <Button
          type="submit"
          variant="gradient"
          size="lg"
          loading={isSubmitting}
          className="w-full shadow-lg shadow-indigo-500/20"
        >
          Send reset link
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Remember your password?{" "}
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
