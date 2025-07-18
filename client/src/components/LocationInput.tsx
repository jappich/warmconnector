import React, { useState, useEffect } from 'react';
import { MapPin, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LocationInputProps {
  value: string;
  onChange: (location: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

const LocationInput: React.FC<LocationInputProps> = ({
  value,
  onChange,
  placeholder = "Where does this person work? (City, state, or region)",
  disabled = false,
  required = false,
  className
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isValid, setIsValid] = useState(false);

  // Validate location input
  useEffect(() => {
    const trimmedValue = value.trim();
    setIsValid(trimmedValue.length >= 2);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="relative">
        {/* Icon */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MapPin className="h-5 w-5 text-gray-400" />
        </div>

        {/* Input Field */}
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={cn(
            "w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg",
            "focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            "placeholder-gray-500 text-gray-900",
            "transition-all duration-200",
            disabled && "bg-gray-50 cursor-not-allowed text-gray-500",
            isValid && !isFocused && "border-green-300 bg-green-50",
            isFocused && "border-blue-300"
          )}
        />

        {/* Validation Icon */}
        {isValid && !isFocused && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <Check className="h-5 w-5 text-green-500" />
          </div>
        )}
      </div>

      {/* Helper Text */}
      <div className="mt-2 text-sm text-gray-600">
        {isFocused && !isValid && (
          <span>Enter a city, state, or region (e.g., "San Francisco, CA" or "London, UK")</span>
        )}
        {isValid && !isFocused && (
          <span className="text-green-600 flex items-center space-x-1">
            <Check className="w-4 h-4" />
            <span>Location entered: {value}</span>
          </span>
        )}
      </div>
    </div>
  );
};

export default LocationInput;