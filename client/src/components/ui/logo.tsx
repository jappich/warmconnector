import wcLogoPath from "@assets/ChatGPT Image Jun 22, 2025, 08_42_35 PM_1750639361021.png";

export function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <img
      src={wcLogoPath}
      alt="WarmConnect"
      className={className}
    />
  );
}

export function LogoText({ className = "" }: { className?: string }) {
  return (
    <span className={`font-bold text-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 bg-clip-text text-transparent ${className}`}>
      WARMCONNECT
    </span>
  );
}