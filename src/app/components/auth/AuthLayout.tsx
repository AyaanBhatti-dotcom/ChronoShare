import { Clock } from "lucide-react";
import { Link } from "react-router";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: "#0B0F19", fontFamily: "'Inter', sans-serif" }}
    >
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
            style={{ background: "linear-gradient(135deg, #10B981, #06B6D4)" }}
          >
            <Clock size={22} style={{ color: "#000" }} />
          </div>
          <Link to="/" className="text-lg font-semibold text-white tracking-tight hover:opacity-90">
            ChronoShare
          </Link>
          <p className="text-xs text-[#9CA3AF] mt-1">Trade time, not money</p>
        </div>

        <div
          className="rounded-2xl border p-8"
          style={{ background: "#0D1220", borderColor: "#1F2937" }}
        >
          <div className="mb-6">
            <h1 className="text-xl font-semibold text-white">{title}</h1>
            <p className="text-sm text-[#9CA3AF] mt-1">{subtitle}</p>
          </div>
          {children}
        </div>

        <p className="text-center text-sm text-[#9CA3AF] mt-6">{footer}</p>
      </div>
    </div>
  );
}
