"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import {
  Brain,
  Globe,
  Database,
  TrendingUp,
  BarChart2,
  Code2,
  Play,
  ArrowRight,
  Star,
  Check,
  ChevronRight,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ─── Animation helpers ──────────────────────────────────────────────────────

function FadeInSection({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Chat Widget Mock ───────────────────────────────────────────────────────

const chatMessages = [
  {
    id: 1,
    role: "customer" as const,
    text: "Hi! I'm looking for a plan that handles 3,000 conversations/month.",
    delay: 0.5,
  },
  {
    id: 2,
    role: "agent" as const,
    text: "Great choice! Our Growth plan covers up to 5,000 conversations/month with CRM integrations and advanced analytics. Would you like a demo?",
    delay: 1.4,
  },
  {
    id: 3,
    role: "customer" as const,
    text: "Yes, and do you support Spanish?",
    delay: 2.5,
  },
  {
    id: 4,
    role: "agent" as const,
    text: "Absolutely — we support 12 languages including Spanish, French, German, and more. I can set up a free trial right now. 🚀",
    delay: 3.4,
  },
];

function ChatWidget() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full max-w-sm mx-auto lg:mx-0 lg:ml-auto"
    >
      {/* Glow effect */}
      <div className="absolute -inset-4 bg-indigo-600/20 rounded-3xl blur-2xl pointer-events-none" />

      <div className="relative bg-gray-900 border border-gray-700/80 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 bg-gray-800/80 border-b border-gray-700/60">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-gray-800" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Fluence AI Agent</p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-green-400 font-medium">Live</span>
            </div>
          </div>
          <div className="ml-auto flex gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
          </div>
        </div>

        {/* Messages */}
        <div className="p-4 space-y-3 min-h-[280px]">
          {chatMessages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: msg.role === "customer" ? -20 : 20, y: 10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.4, delay: msg.delay, ease: "easeOut" }}
              className={`flex ${msg.role === "agent" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  msg.role === "agent"
                    ? "bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-br-sm"
                    : "bg-gray-800 text-gray-200 rounded-bl-sm"
                }`}
              >
                {msg.text}
              </div>
            </motion.div>
          ))}

          {/* Typing indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 4.4 }}
            className="flex justify-end"
          >
            <div className="bg-gray-800 rounded-2xl rounded-br-sm px-4 py-3 flex gap-1.5 items-center">
              {[0, 0.15, 0.3].map((delay, i) => (
                <motion.span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay, ease: "easeInOut" }}
                />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Input bar */}
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2 bg-gray-800 rounded-xl px-3 py-2.5 border border-gray-700/60">
            <span className="text-sm text-gray-500 flex-1">Type a message...</span>
            <button className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
          <p className="text-center text-xs text-gray-600 mt-2">Powered by Fluence AI</p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Section components ─────────────────────────────────────────────────────

const stats = [
  { value: "10,000+", label: "Conversations per day" },
  { value: "47%", label: "Avg. conversion lift" },
  { value: "12", label: "Languages supported" },
  { value: "99.9%", label: "Platform uptime" },
];

const features = [
  {
    icon: Brain,
    title: "Long-term Memory",
    description:
      "Never forget a customer interaction. Our AI remembers every conversation, preference, and purchase history to deliver hyper-personalized experiences.",
  },
  {
    icon: Globe,
    title: "Multilingual AI",
    description:
      "Automatically speaks and understands 12+ languages with native-level fluency. Expand globally without hiring additional staff.",
  },
  {
    icon: Database,
    title: "RAG Knowledge Base",
    description:
      "Instantly answers questions from your docs, FAQs, and product catalog with source citations and real-time accuracy.",
  },
  {
    icon: TrendingUp,
    title: "Sales Intelligence",
    description:
      "Tracks buying intent signals and automatically escalates hot leads to your sales team in real-time with full context.",
  },
  {
    icon: BarChart2,
    title: "Analytics Dashboard",
    description:
      "Deep insights into conversion funnels, sentiment analysis, and agent performance. Know exactly what drives revenue.",
  },
  {
    icon: Code2,
    title: "One-Line Embed",
    description:
      "Add to any website in 60 seconds. Works seamlessly with Shopify, WordPress, Webflow, and virtually any platform.",
  },
];

const steps = [
  {
    number: "01",
    title: "Connect Your Knowledge",
    description:
      "Upload your docs, FAQs, product info, and pricing. Your AI agent learns everything about your business instantly.",
    detail: "PDF, DOCX, CSV, URLs — all supported",
  },
  {
    number: "02",
    title: "Customize Your Agent",
    description:
      "Set your agent's personality, communication goals, escalation triggers, and brand voice in minutes.",
    detail: "No code required",
  },
  {
    number: "03",
    title: "Deploy Everywhere",
    description:
      "Embed on your website with one script tag, or connect to Slack, HubSpot, Salesforce, and more via our integrations.",
    detail: "Go live in under 5 minutes",
  },
];

const testimonials = [
  {
    quote:
      "Fluence AI increased our conversion rate by 52% in the first month. The multilingual support alone opened up 3 new markets for us. It's like having a world-class sales rep on call 24/7.",
    author: "Sarah Chen",
    role: "VP Sales",
    company: "TechCorp",
    initials: "SC",
    color: "from-indigo-500 to-violet-500",
  },
  {
    quote:
      "The RAG feature is incredible. Our AI agent answers product questions better than our human reps did. Customers literally can't tell the difference — and our NPS score went through the roof.",
    author: "Marcus Rodriguez",
    role: "Founder",
    company: "GrowthStack",
    initials: "MR",
    color: "from-violet-500 to-purple-500",
  },
  {
    quote:
      "Setup took 20 minutes. ROI was immediate. We went from 8% to 31% lead conversion overnight. I honestly wish we'd found Fluence AI a year ago.",
    author: "Emily Watson",
    role: "CMO",
    company: "ScaleUp Inc",
    initials: "EW",
    color: "from-purple-500 to-pink-500",
  },
];

type PricingPlan = {
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  description: string;
  features: string[];
  highlighted: boolean;
  badge?: string;
};

const pricingPlans: PricingPlan[] = [
  {
    name: "Starter",
    monthlyPrice: 29,
    annualPrice: 23,
    description: "For individuals and small teams",
    highlighted: false,
    features: [
      "500 conversations/month",
      "1 AI agent",
      "Basic analytics dashboard",
      "Email support",
      "2 knowledge bases",
      "Standard integrations",
    ],
  },
  {
    name: "Growth",
    monthlyPrice: 79,
    annualPrice: 63,
    description: "For growing businesses",
    highlighted: true,
    badge: "Most Popular",
    features: [
      "5,000 conversations/month",
      "5 AI agents",
      "Advanced analytics & sentiment",
      "Priority support",
      "Unlimited knowledge bases",
      "Custom branding",
      "CRM integrations",
      "Multilingual support",
    ],
  },
  {
    name: "Enterprise",
    monthlyPrice: 199,
    annualPrice: 159,
    description: "For large organizations",
    highlighted: false,
    features: [
      "Unlimited conversations",
      "Unlimited AI agents",
      "Enterprise analytics suite",
      "24/7 dedicated support",
      "Custom integrations & API",
      "SSO / SAML",
      "SLA guarantee (99.9%)",
      "White-label option",
    ],
  },
];

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [billingAnnual, setBillingAnnual] = React.useState(false);

  return (
    <div className="bg-gray-950 text-white overflow-hidden">
      {/* ──────────────────────────────────────────────────────────────────────
          SECTION 1 — HERO
      ─────────────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center pt-16">
        {/* Background layers */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Grid */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
          {/* Radial gradient center */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_-20%,rgba(99,102,241,0.25)_0%,transparent_70%)]" />
          {/* Orb left */}
          <motion.div
            animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-48 top-1/4 w-[500px] h-[500px] rounded-full bg-indigo-600/15 blur-[100px]"
          />
          {/* Orb right */}
          <motion.div
            animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute -right-48 top-1/3 w-[600px] h-[500px] rounded-full bg-violet-600/15 blur-[100px]"
          />
          {/* Orb bottom */}
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[200px] rounded-full bg-indigo-500/8 blur-[80px]"
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left column */}
            <div className="flex flex-col gap-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Badge
                  variant="default"
                  className="inline-flex items-center gap-1.5 text-sm px-3 py-1"
                >
                  <span>✨</span>
                  Now with GPT-4o
                </Badge>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="space-y-4"
              >
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight">
                  Turn{" "}
                  <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
                    Conversations
                  </span>
                  <br />
                  Into Conversions
                </h1>
                <p className="text-xl text-gray-400 leading-relaxed max-w-lg">
                  Deploy AI sales agents that remember every customer, speak any language,
                  and close deals 24/7. No code required.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex flex-wrap items-center gap-3"
              >
                <Link href="/register">
                  <Button
                    variant="gradient"
                    size="lg"
                    className="shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50"
                    rightIcon={<ChevronRight className="w-4 h-4" />}
                  >
                    Start Free Trial
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="lg"
                  leftIcon={
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                      <Play className="w-3 h-3 text-white fill-white" />
                    </div>
                  }
                >
                  Watch Demo
                </Button>
              </motion.div>

              {/* Trust indicators */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.35 }}
                className="flex items-center gap-3"
              >
                <div className="flex -space-x-2">
                  {["bg-indigo-500", "bg-violet-500", "bg-purple-500", "bg-pink-500", "bg-blue-500"].map(
                    (color, i) => (
                      <div
                        key={i}
                        className={`w-8 h-8 rounded-full ${color} border-2 border-gray-950 flex items-center justify-center text-xs font-bold text-white`}
                      >
                        {String.fromCharCode(65 + i)}
                      </div>
                    )
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    Join <span className="text-indigo-400">2,000+</span> businesses
                  </p>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    ))}
                    <span className="text-xs text-gray-500 ml-1">4.9/5 rating</span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right column — Chat widget */}
            <ChatWidget />
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────
          SECTION 2 — STATS BAR
      ─────────────────────────────────────────────────────────────────────── */}
      <section className="relative border-y border-gray-800/60 bg-gray-900/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
            {stats.map((stat, i) => (
              <FadeInSection key={stat.label} delay={i * 0.08}>
                <div className="text-center px-4">
                  <p className="text-4xl sm:text-5xl font-extrabold bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-sm text-gray-400">{stat.label}</p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────
          SECTION 3 — FEATURES
      ─────────────────────────────────────────────────────────────────────── */}
      <section id="features" className="relative py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(99,102,241,0.06)_0%,transparent_70%)] pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection className="text-center mb-16 space-y-4">
            <Badge variant="default" className="text-xs tracking-wider uppercase">
              Features
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">
              Everything you need to close more deals
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              A complete AI sales platform built for modern businesses. Powerful by default, infinitely customizable.
            </p>
          </FadeInSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <FadeInSection key={feature.title} delay={i * 0.07}>
                  <div className="group relative bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 hover:scale-[1.02] cursor-default h-full">
                    {/* Hover glow */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-600/0 to-violet-600/0 group-hover:from-indigo-600/5 group-hover:to-violet-600/5 transition-all duration-300 pointer-events-none" />

                    <div className="relative">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center mb-5 shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-shadow">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </FadeInSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────
          SECTION 4 — HOW IT WORKS
      ─────────────────────────────────────────────────────────────────────── */}
      <section className="relative py-28 border-t border-gray-800/60">
        <div className="absolute inset-0 bg-gray-900/20 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection className="text-center mb-16 space-y-4">
            <Badge variant="default" className="text-xs tracking-wider uppercase">
              How It Works
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">
              Up and running in minutes
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              From zero to a fully deployed AI sales agent in three simple steps.
            </p>
          </FadeInSection>

          <div className="relative grid md:grid-cols-3 gap-8">
            {/* Connector line */}
            <div className="hidden md:block absolute top-12 left-[calc(33.33%+1rem)] right-[calc(33.33%+1rem)] h-0.5 bg-gradient-to-r from-indigo-600/40 via-violet-600/40 to-purple-600/40" />

            {steps.map((step, i) => (
              <FadeInSection key={step.title} delay={i * 0.12}>
                <div className="relative bg-gray-900 border border-gray-800 rounded-2xl p-7 text-center hover:border-indigo-500/40 transition-all duration-300">
                  {/* Step number */}
                  <div className="flex justify-center mb-5">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-500/30 relative z-10">
                      <span className="text-xl font-black text-white">{i + 1}</span>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed mb-4">{step.description}</p>
                  <span className="inline-block text-xs font-medium text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-3 py-1">
                    {step.detail}
                  </span>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────
          SECTION 5 — PRICING
      ─────────────────────────────────────────────────────────────────────── */}
      <section id="pricing" className="relative py-28 border-t border-gray-800/60">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(139,92,246,0.08)_0%,transparent_70%)] pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection className="text-center mb-12 space-y-4">
            <Badge variant="default" className="text-xs tracking-wider uppercase">
              Pricing
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-gray-400">
              Start free, scale as you grow. No hidden fees.
            </p>

            {/* Billing toggle */}
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                onClick={() => setBillingAnnual(false)}
                className={`text-sm font-medium transition-colors ${
                  !billingAnnual ? "text-white" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingAnnual((v) => !v)}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  billingAnnual
                    ? "bg-gradient-to-r from-indigo-600 to-violet-600"
                    : "bg-gray-700"
                }`}
                role="switch"
                aria-checked={billingAnnual}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
                    billingAnnual ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
              <button
                onClick={() => setBillingAnnual(true)}
                className={`text-sm font-medium transition-colors flex items-center gap-2 ${
                  billingAnnual ? "text-white" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                Annual
                <span className="text-xs font-semibold text-green-400 bg-green-400/10 border border-green-400/20 rounded-full px-2 py-0.5">
                  Save 20%
                </span>
              </button>
            </div>
          </FadeInSection>

          <div className="grid md:grid-cols-3 gap-6 items-stretch">
            {pricingPlans.map((plan, i) => (
              <FadeInSection key={plan.name} delay={i * 0.1}>
                <div
                  className={`relative flex flex-col rounded-2xl p-8 h-full transition-all duration-300 ${
                    plan.highlighted
                      ? "bg-gray-900 border-2 border-indigo-500/60 shadow-2xl shadow-indigo-500/20 scale-105"
                      : "bg-gray-900 border border-gray-800 hover:border-gray-700"
                  }`}
                >
                  {plan.highlighted && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-indigo-600/10 to-violet-600/5 pointer-events-none" />
                  )}

                  {plan.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg shadow-indigo-500/30 whitespace-nowrap">
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div className="relative flex flex-col flex-1">
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                      <p className="text-sm text-gray-400 mt-1">{plan.description}</p>
                    </div>

                    <div className="mb-8">
                      <div className="flex items-end gap-1">
                        <span className="text-5xl font-extrabold text-white">
                          ${billingAnnual ? plan.annualPrice : plan.monthlyPrice}
                        </span>
                        <span className="text-gray-400 mb-2">/mo</span>
                      </div>
                      {billingAnnual && (
                        <p className="text-sm text-green-400 mt-1">
                          Billed annually — save $
                          {(plan.monthlyPrice - plan.annualPrice) * 12}/yr
                        </p>
                      )}
                    </div>

                    <ul className="space-y-3 mb-8 flex-1">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2.5 text-sm">
                          <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center mt-0.5 shrink-0">
                            <Check className="w-3 h-3 text-indigo-400" />
                          </div>
                          <span className="text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Link href="/register" className="block">
                      <Button
                        variant={plan.highlighted ? "gradient" : "outline"}
                        size="lg"
                        className="w-full"
                      >
                        Get started
                      </Button>
                    </Link>
                  </div>
                </div>
              </FadeInSection>
            ))}
          </div>

          <FadeInSection className="text-center mt-10">
            <p className="text-sm text-gray-500">
              All plans include a 14-day free trial. No credit card required.{" "}
              <Link href="/contact" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                Need a custom plan?
              </Link>
            </p>
          </FadeInSection>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────
          SECTION 6 — TESTIMONIALS
      ─────────────────────────────────────────────────────────────────────── */}
      <section className="relative py-28 border-t border-gray-800/60">
        <div className="absolute inset-0 bg-gray-900/30 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection className="text-center mb-16 space-y-4">
            <Badge variant="default" className="text-xs tracking-wider uppercase">
              Testimonials
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">
              Trusted by sales teams worldwide
            </h2>
          </FadeInSection>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <FadeInSection key={t.author} delay={i * 0.1}>
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-7 flex flex-col gap-5 h-full hover:border-gray-700 transition-all duration-300 hover:shadow-xl hover:shadow-black/30">
                  {/* Stars */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, si) => (
                      <Star key={si} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>

                  <blockquote className="text-gray-300 text-sm leading-relaxed flex-1">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>

                  <div className="flex items-center gap-3 pt-2 border-t border-gray-800">
                    <div
                      className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white text-sm font-bold shrink-0`}
                    >
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{t.author}</p>
                      <p className="text-xs text-gray-500">
                        {t.role} @ {t.company}
                      </p>
                    </div>
                  </div>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────
          SECTION 7 — CTA BANNER
      ─────────────────────────────────────────────────────────────────────── */}
      <section className="relative py-4 border-t border-gray-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <FadeInSection>
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-12 sm:p-16 text-center">
              {/* Decorative elements */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
                <div
                  className="absolute inset-0 opacity-[0.05]"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
                    backgroundSize: "40px 40px",
                  }}
                />
              </div>

              <div className="relative space-y-6">
                <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
                  Ready to transform your sales?
                </h2>
                <p className="text-xl text-indigo-100 max-w-2xl mx-auto">
                  Join 2,000+ businesses using Fluence AI to close more deals, faster.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                  <Link href="/register">
                    <Button
                      size="lg"
                      className="bg-white text-indigo-700 font-bold hover:bg-gray-100 shadow-xl hover:shadow-2xl px-8"
                    >
                      Start Free Trial
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="lg" className="text-white hover:bg-white/10 border border-white/20">
                    Talk to sales
                  </Button>
                </div>
                <p className="text-sm text-indigo-200">
                  No credit card required · 14-day free trial · Cancel anytime
                </p>
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>
    </div>
  );
}
