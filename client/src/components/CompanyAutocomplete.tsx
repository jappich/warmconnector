import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Building2, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Company {
  id: string;
  name: string;
  domain?: string;
  industry?: string;
  logo?: string;
}

interface CompanyAutocompleteProps {
  onCompanySelect: (company: Company) => void;
  selectedCompany?: Company | null;
  placeholder?: string;
  disabled?: boolean;
}

const CompanyAutocomplete: React.FC<CompanyAutocompleteProps> = ({
  onCompanySelect,
  selectedCompany,
  placeholder = "Start typing the company name—autocomplete will help you find the right match.",
  disabled = false
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch companies based on search query
  const { data: companies = [], isLoading, error } = useQuery({
    queryKey: ['/api/companies', query],
    queryFn: async () => {
      if (!query.trim() || query.length < 2) return [];
      
      const response = await fetch(`/api/companies?query=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch companies');
      }
      return response.json();
    },
    enabled: query.length >= 2 && !selectedCompany,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    if (selectedCompany) {
      onCompanySelect(null as any); // Clear selection when typing
    }
    
    setIsOpen(value.length >= 2);
  };

  // Handle company selection
  const handleCompanySelect = (company: Company) => {
    setQuery(company.name);
    setIsOpen(false);
    onCompanySelect(company);
    inputRef.current?.blur();
  };

  // Handle input focus
  const handleFocus = () => {
    setIsFocused(true);
    if (query.length >= 2 && !selectedCompany) {
      setIsOpen(true);
    }
  };

  // Handle input blur
  const handleBlur = (e: React.FocusEvent) => {
    // Delay closing to allow for dropdown clicks
    setTimeout(() => {
      if (!dropdownRef.current?.contains(e.relatedTarget as Node)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    }, 150);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update query when selectedCompany changes externally
  useEffect(() => {
    if (selectedCompany) {
      setQuery(selectedCompany.name);
    } else if (!isFocused) {
      setQuery('');
    }
  }, [selectedCompany, isFocused]);

  return (
    <div className="relative w-full">
      {/* Input Field */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Building2 className="h-5 w-5 text-gray-400" />
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg",
            "focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            "placeholder-gray-500 text-gray-900",
            "transition-all duration-200",
            disabled && "bg-gray-50 cursor-not-allowed",
            selectedCompany && "border-green-300 bg-green-50",
            error && "border-red-300 bg-red-50"
          )}
        />

        {/* Loading/Status Icons */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {isLoading ? (
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
          ) : (
            <ChevronDown className={cn(
              "h-4 w-4 text-gray-400 transition-transform duration-200",
              isOpen && "transform rotate-180"
            )} />
          )}
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div 
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {isLoading ? (
            <div className="px-4 py-3 text-center text-gray-500">
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                <span>Searching companies...</span>
              </div>
            </div>
          ) : companies.length > 0 ? (
            <div className="py-1">
              {companies.map((company: Company) => (
                <button
                  key={company.id}
                  onClick={() => handleCompanySelect(company)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors duration-150"
                >
                  <div className="flex items-center space-x-3">
                    {company.logo ? (
                      <img 
                        src={company.logo} 
                        alt={`${company.name} logo`}
                        className="w-8 h-8 rounded object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-gray-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {company.name}
                      </div>
                      {(company.industry || company.domain) && (
                        <div className="text-sm text-gray-500 truncate">
                          {company.industry}{company.industry && company.domain ? ' • ' : ''}{company.domain}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : query.length >= 2 ? (
            <div className="px-4 py-3 text-center text-gray-500">
              <div className="flex flex-col items-center space-y-2">
                <Search className="h-6 w-6 text-gray-400" />
                <span>No companies found for "{query}"</span>
                <span className="text-xs text-gray-400">Try a different search term</span>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-2 text-sm text-red-600">
          Failed to load companies. Please try again.
        </div>
      )}

      {/* Success Message */}
      {selectedCompany && (
        <div className="mt-2 text-sm text-green-600 flex items-center space-x-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span>Company selected: {selectedCompany.name}</span>
        </div>
      )}
    </div>
  );
};

export default CompanyAutocomplete;