import { useState, useEffect, useMemo, memo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import NetworkNodeIcon from "./NetworkNodeIcon";
import { SEARCH_URL, API_KEY } from "@/lib/config";
import { searchConnections, queryClient } from "@/lib/queryClient";
import ConnectionStatusTracker from "./ConnectionStatusTracker";
// @ts-ignore - These are JSX components
import ConnectionGraph from "./ConnectionGraph.jsx";
// @ts-ignore
import IntroEmailModal from "./IntroEmailModal.jsx";

interface ConnectionResult {
  path: string;
  strength: number;
}

interface EmailContent {
  to: string;
  cc?: string;
  subject: string;
  body: string;
}

interface WarmConnectionSearchProps {
  searchUrl: string;
  apiKey: string;
  profileEmail?: string;
}

// Memoized result item component to prevent unnecessary re-renders
const ConnectionResultItem = memo(({ 
  result, 
  emailLoading, 
  onGenerateEmail 
}: { 
  result: ConnectionResult; 
  emailLoading: string | null;
  onGenerateEmail: (path: string) => void;
}) => {
  return (
    <tr className="bg-[#0F172A]/70 hover:bg-[#0F172A] transition-colors duration-150">
      <td className="px-4 py-4 text-sm text-[#F8FAFC]">
        {result.path}
      </td>
      <td className="px-4 py-4 text-right">
        <div className="flex items-center justify-end">
          <div className="mr-3 w-24 bg-gray-700/30 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#06B6D4] to-[#A855F7]"
              style={{ width: `${result.strength}%` }}
            ></div>
          </div>
          <span className="text-[#06B6D4] font-medium whitespace-nowrap w-12 text-right">
            {result.strength.toFixed(1)}%
          </span>
        </div>
      </td>
      <td className="px-4 py-4 text-right">
        <Button
          onClick={() => onGenerateEmail(result.path)}
          disabled={emailLoading === result.path}
          size="sm"
          className="bg-[#5d34eb]/20 border border-[#5d34eb]/50 text-[#a389fa] hover:bg-[#5d34eb]/30 transition-all duration-200 hover:scale-105 focus:ring-neon"
        >
          {emailLoading === result.path ? (
            <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-[#a389fa] mr-2"></div>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          )}
          Generate Intro
        </Button>
      </td>
    </tr>
  );
});

// Mobile result card component
const ConnectionResultCard = memo(({ 
  result, 
  emailLoading, 
  onGenerateEmail 
}: { 
  result: ConnectionResult; 
  emailLoading: string | null;
  onGenerateEmail: (path: string) => void;
}) => {
  return (
    <Card className="bg-[#0F172A]/70 border border-transparent neon-border overflow-hidden transition-all duration-200">
      <CardContent className="p-4">
        <div className="space-y-3">
          <p className="text-[#F8FAFC] leading-relaxed">{result.path}</p>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-[#94A3B8]">
              <span>Connection Strength</span>
              <span className="text-[#06B6D4] font-medium">{result.strength.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-700/30 rounded-full h-1.5 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#06B6D4] to-[#A855F7] shadow-[0_0_5px_rgba(6,182,212,0.5)]"
                style={{ width: `${result.strength}%` }}
              ></div>
            </div>
          </div>
          
          <Button
            onClick={() => onGenerateEmail(result.path)}
            disabled={emailLoading === result.path}
            size="sm"
            className="w-full bg-[#5d34eb]/20 border border-[#5d34eb]/50 text-[#a389fa] hover:bg-[#5d34eb]/30 transition-all duration-200 hover:scale-105 focus:ring-neon"
          >
            {emailLoading === result.path ? (
              <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-[#a389fa] mr-2"></div>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            )}
            Generate Intro Email
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

const WarmConnectionSearch = ({ searchUrl, apiKey, profileEmail }: WarmConnectionSearchProps) => {
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounce(query, 300); // Debounce search input by 300ms
  const [emailLoading, setEmailLoading] = useState<string | null>(null);
  const [emailContent, setEmailContent] = useState<EmailContent | null>(null);
  const [showVisualization, setShowVisualization] = useState(false);
  const [searchRunId, setSearchRunId] = useState<string | null>(null);
  const [searchStatus, setSearchStatus] = useState<string | null>(null);
  const [searchProgress, setSearchProgress] = useState<number>(0);

  // React Query for search results with automatic caching
  const {
    data: results,
    error,
    isLoading,
    isFetching,
    refetch,
    isError
  } = useQuery({
    queryKey: ['search', profileEmail, debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery) return [];
      
      // Call the search API
      const response = await searchConnections(profileEmail, debouncedQuery, searchUrl, apiKey);
      
      // Check if response includes a runId for status tracking
      if (response && typeof response === 'object' && 'runId' in response) {
        setSearchRunId(response.runId);
        return response.paths || [];
      }
      
      // If not, it's in the old format (just an array of paths)
      return Array.isArray(response) ? response : [];
    },
    enabled: !!debouncedQuery && debouncedQuery.length > 0, // Only run query if we have a search term
    staleTime: 5 * 60 * 1000, // Results stay fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Cache time in v5 of React Query
    refetchOnWindowFocus: false
  });

  // Track if we've searched
  const hasSearched = !!debouncedQuery && debouncedQuery.length > 0;
  
  // Auto-run the demo search when component mounts
  useEffect(() => {
    // Immediate run to simulate already being logged in and active
    runDemoSearch();
    
    // Return empty cleanup function
    return () => {};
  }, []);
  
  // Handle status updates from ConnectionStatusTracker
  const handleStatusUpdate = (status: {
    status: 'pending' | 'processing' | 'complete' | 'error';
    progress: number;
    step: string;
    message: string;
    runId: string;
    resultCount?: number;
    error?: string;
  }) => {
    setSearchStatus(status.status);
    setSearchProgress(status.progress);
    
    // If search is complete, update the results by triggering a refetch
    if (status.status === 'complete' && status.resultCount && status.resultCount > 0) {
      refetch();
    }
  };

  // Format the error message
  const errorMessage = useMemo(() => {
    if (!error) return null;
    return error instanceof Error ? error.message : "Failed to fetch connections";
  }, [error]);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    // The query will be triggered by the useQuery hook based on debouncedQuery
  };
  
  const runDemoSearch = () => {
    setQuery("John Smith"); // Set the input field to show what we're searching
    // The useQuery hook will trigger the search automatically
  };
  
  // Ensure results is always an array to prevent TypeScript errors
  const connectionResults = useMemo(() => {
    return Array.isArray(results) ? results : [];
  }, [results]);
  
  // Email generation mutation with React Query
  const emailMutation = useMutation({
    mutationFn: async ({ path }: { path: string }) => {
      const response = await fetch('/api/generate-intro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          path,
          profileEmail
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to generate email: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setEmailContent(data);
    },
    onError: (error) => {
      console.error('Failed to generate intro email:', error);
    }
  });

  // Generate an introduction email based on a connection path
  const generateIntroEmail = (path: string) => {
    setEmailLoading(path);
    emailMutation.mutate({ path }, {
      onSettled: () => {
        setEmailLoading(null);
      }
    });
  };
  
  // Toggle the connection visualization
  const toggleVisualization = () => {
    setShowVisualization(!showVisualization);
  };

  return (
    <div className="w-full max-w-[600px] mx-auto relative">
      {/* Decorative background elements */}
      <div className="absolute -top-20 -left-20 w-40 h-40 bg-purple-500/10 rounded-full filter blur-3xl"></div>
      <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-cyan-500/10 rounded-full filter blur-3xl"></div>

      <Card className="bg-[#1E293B]/80 backdrop-blur-md border border-transparent shadow-lg overflow-hidden neon-border">
        <CardContent className="p-6 md:p-8">
          {/* Progress indicator */}
          <div className="mb-2">
            <Progress value={searchProgress} max={100} className="h-1" />
          </div>
          <div className="flex justify-between text-xs text-[#94A3B8] mb-6">
            <span>{searchStatus === 'processing' ? 'Searching...' : searchStatus === 'complete' ? 'Search complete' : 'Ready to search'}</span>
            <span>{searchProgress}%</span>
          </div>
          
          {/* Status tracker component (hidden but functional) */}
          {searchRunId && <ConnectionStatusTracker 
            runId={searchRunId}
            onStatusUpdate={handleStatusUpdate}
            pollInterval={2000}
          />}
          
          {/* Header */}
          <div className="flex items-center justify-center mb-2">
            <div className="mr-3 p-2 bg-[#06B6D4]/10 rounded-full relative">
              <NetworkNodeIcon />
              <div className="absolute inset-0 rounded-full bg-[#06B6D4]/10 animate-ping opacity-30"></div>
            </div>
            <h1 className="text-2xl font-bold neon-text">Find a Warm Connection</h1>
          </div>
          
          {/* Subheader */}
          <p className="text-center text-[#94A3B8] mb-8">
            Search your extended network by name, title, or company.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="space-y-4 mb-3">
            <div className="relative">
              <Input
                value={query}
                onChange={handleQueryChange}
                placeholder="e.g. CFO of Apple"
                className="bg-[#0F172A]/50 border-b-2 border-t-0 border-l-0 border-r-0 border-[#1E293B] rounded-none text-[#F8FAFC] placeholder:text-[#94A3B8]/50 focus:ring-0 focus:border-[#06B6D4] transition-all duration-200 px-4 py-3"
                aria-label="Search query"
              />
              <div className="h-0.5 w-0 bg-[#06B6D4] absolute bottom-0 left-1/2 transform -translate-x-1/2 transition-all duration-300 group-focus-within:w-full"></div>
            </div>
            
            <Button
              type="submit"
              disabled={!query.trim() || isLoading || isFetching}
              className="w-full py-5 bg-gradient-to-r from-[#06B6D4] to-[#A855F7] text-white shadow-lg transition-all duration-300 ease-in-out hover:shadow-[0_0_15px_rgba(6,182,212,0.5)] hover:scale-105 disabled:opacity-50 disabled:from-gray-500 disabled:to-gray-600 disabled:hover:scale-100 disabled:hover:shadow-none focus:ring-neon"
              aria-label="Search for connections"
            >
              {isLoading || isFetching ? (
                <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
              ) : (
                "Search"
              )}
            </Button>
          </form>
          
          {/* Demo Button */}
          <div className="mb-6 text-center">
            <Button
              onClick={runDemoSearch}
              disabled={isLoading || isFetching}
              variant="outline"
              className="text-sm border-[#1E293B] bg-[#1E293B]/30 text-[#94A3B8] hover:bg-[#1E293B]/50 hover:text-[#F8FAFC] transition-all duration-200 hover:scale-105 focus:ring-neon"
              aria-label="Run a demo search with 'John Smith'"
            >
              {isLoading || isFetching ? (
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-[#06B6D4] mr-2"></div>
              ) : (
                <span className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Run Demo Search
                </span>
              )}
            </Button>
          </div>
          
          {/* Error Message */}
          {isError && errorMessage && (
            <div className="p-4 mb-4 rounded-md bg-red-900/20 border border-red-800/50 text-red-400">
              <p>Oops, something went wrong—please try again.</p>
              <p className="mt-2 text-sm">{errorMessage}</p>
              <Button 
                onClick={() => refetch()} 
                variant="outline" 
                className="mt-3 text-red-400 border-red-500/30 hover:bg-red-950/20 hover:scale-105 focus:ring-neon"
                aria-label="Retry search"
              >
                Retry
              </Button>
            </div>
          )}
          
          {/* Results */}
          {hasSearched && connectionResults && (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-[#1E293B] pb-2">
                <h2 className="text-xl font-semibold neon-text">
                  Connections
                </h2>
                {connectionResults.length > 0 && (
                  <Button
                    onClick={toggleVisualization}
                    variant="outline"
                    size="sm"
                    className="text-xs border-[#1E293B] bg-[#1E293B]/30 text-[#94A3B8] hover:bg-[#1E293B]/50 hover:text-[#F8FAFC] transition-all duration-200 hover:scale-105 focus:ring-neon"
                  >
                    {showVisualization ? "Hide" : "Show"} Visualization
                  </Button>
                )}
              </div>
              
              {connectionResults.length === 0 ? (
                <div className="text-center py-10 text-[#94A3B8]">
                  <div className="mb-4 text-5xl opacity-30">🔍</div>
                  <p className="text-lg">No connections found.</p>
                  <p className="text-sm mt-2 max-w-xs mx-auto">Try a different search term or check back later as our network grows.</p>
                </div>
              ) : (
                <div>
                  {/* Table View (Desktop) */}
                  <div className="hidden md:block rounded-lg overflow-hidden border border-[#1E293B]">
                    <table className="w-full">
                      <thead className="bg-[#0F172A]/90">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-[#94A3B8] uppercase tracking-wider">
                            Connection Path
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-[#94A3B8] uppercase tracking-wider w-32">
                            Strength
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-[#94A3B8] uppercase tracking-wider w-40">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1E293B]">
                        {connectionResults.map((result, index) => (
                          <ConnectionResultItem 
                            key={index}
                            result={result}
                            emailLoading={emailLoading}
                            onGenerateEmail={generateIntroEmail}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Card View (Mobile) */}
                  <div className="md:hidden space-y-3">
                    {connectionResults.map((result, index) => (
                      <ConnectionResultCard 
                        key={index}
                        result={result}
                        emailLoading={emailLoading}
                        onGenerateEmail={generateIntroEmail}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Visualization - Lazy loaded for better performance */}
          {showVisualization && connectionResults.length > 0 && (
            <div className="mt-6 border-t border-[#1E293B] pt-6">
              <h3 className="text-lg font-medium text-[#F8FAFC] mb-4">Network Visualization</h3>
              <ConnectionGraph paths={connectionResults} />
            </div>
          )}
          
          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-[#1E293B]/50 text-center">
            <p className="text-xs text-[#94A3B8]">
              Powered by WarmConnector Network
            </p>
          </div>
          
          {/* Email Modal */}
          {emailContent && (
            <IntroEmailModal
              email={emailContent}
              onClose={() => setEmailContent(null)}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WarmConnectionSearch;