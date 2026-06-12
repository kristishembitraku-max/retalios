import Link from "next/link";
import { Zap } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background mesh gradient */}
      <div className="absolute inset-0 bg-mesh-gradient opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-gray-950/0 via-gray-950/60 to-gray-950 pointer-events-none" />

      {/* Radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-4 py-8 flex flex-col items-center gap-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-all duration-300 group-hover:scale-105">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Fluence AI
          </span>
        </Link>

        {/* Card */}
        <div className="w-full bg-gray-900/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/40">
          {children}
        </div>

        {/* Footer note */}
        <p className="text-xs text-gray-600 text-center">
          Protected by enterprise-grade security.{" "}
          <Link href="/privacy" className="text-gray-500 hover:text-gray-400 transition-colors">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
