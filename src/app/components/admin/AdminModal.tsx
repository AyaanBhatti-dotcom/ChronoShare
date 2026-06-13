import { useEffect } from "react";
import { X } from "lucide-react";

interface AdminModalProps {
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  submitLabel: string;
  submitVariant?: "primary" | "danger";
  loading?: boolean;
  children: React.ReactNode;
}

export function AdminModal({
  title,
  onClose,
  onSubmit,
  submitLabel,
  submitVariant = "primary",
  loading = false,
  children,
}: AdminModalProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border p-6"
        style={{ background: "#111827", borderColor: "#1F2937" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-[#9CA3AF] hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">{children}</div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm text-[#9CA3AF] hover:text-white transition-colors"
            style={{ border: "1px solid #1F2937" }}
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-60"
            style={{
              background: submitVariant === "danger" ? "#EF4444" : "#10B981",
              color: submitVariant === "danger" ? "#fff" : "#000",
            }}
          >
            {loading ? "Saving..." : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

interface AdminFieldProps {
  label: string;
  children: React.ReactNode;
}

export function AdminField({ label, children }: AdminFieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-[#9CA3AF] uppercase tracking-wide">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-[#4B5563] outline-none focus:ring-1 focus:ring-emerald-500";

const inputStyle = { background: "#0B0F19", border: "1px solid #1F2937" };

export function AdminInput({
  value,
  onChange,
  type = "text",
  placeholder,
  step,
  min,
}: {
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  step?: string;
  min?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      step={step}
      min={min}
      className={inputClass}
      style={inputStyle}
    />
  );
}

export function AdminTextarea({
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className={`${inputClass} resize-none`}
      style={inputStyle}
    />
  );
}

export function AdminSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={inputClass}
      style={inputStyle}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
