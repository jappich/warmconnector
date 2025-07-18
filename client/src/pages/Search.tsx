import WarmConnectionSearch from "@/components/WarmConnectionSearch";

export default function Search() {
  // Using a default API key or empty string if not needed for testing
  const defaultApiKey = "default-api-key"; 
  
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#0F172A] p-4 bg-gradient-to-br from-[#0F172A] to-[#1E293B]">
      <WarmConnectionSearch 
        searchUrl="/webhook/search" 
        apiKey={defaultApiKey} 
      />
    </div>
  );
}