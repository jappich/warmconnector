const NetworkNodeIcon = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`relative w-6 h-6 ${className}`}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-3 h-3 bg-[#06B6D4] rounded-full"></div>
      </div>
      <div className="absolute inset-0 border-2 border-[#06B6D4] rounded-full opacity-70"></div>
      <div className="absolute w-1 h-1 bg-[#06B6D4] rounded-full top-0 right-1 shadow-[0_0_5px_#06B6D4]"></div>
      <div className="absolute w-1 h-1 bg-[#06B6D4] rounded-full bottom-1 left-0 shadow-[0_0_5px_#06B6D4]"></div>
      <div className="absolute w-1 h-1 bg-[#06B6D4] rounded-full bottom-0 right-0 shadow-[0_0_5px_#06B6D4]"></div>
    </div>
  );
};

export default NetworkNodeIcon;
