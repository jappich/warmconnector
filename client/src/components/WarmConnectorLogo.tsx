import wcLogoPath from "@assets/ChatGPT Image Jun 22, 2025, 08_42_35 PM_1750639361021.png";

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export default function WarmConnectorLogo({ className = "", size = 120, showText = true }: LogoProps) {
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <img 
        src={wcLogoPath}
        alt="WarmConnect"
        width={size}
        height={size}
        className="object-contain"
      />
      {showText && (
        <div className="flex flex-col">
          <span className="text-lg font-bold bg-gradient-to-r from-cosmic-primary to-cosmic-accent bg-clip-text text-transparent">
            WARMCONNECT
          </span>
          <span className="text-xs text-gray-400 tracking-wide">
            Professional Network Intelligence
          </span>
        </div>
      )}
    </div>
  );
}