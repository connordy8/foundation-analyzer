"use client";

import { useRef, useEffect, useCallback } from "react";
import { Search, X, Loader2 } from "lucide-react";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  isLoading: boolean;
}

export function SearchBar({ value, onChange, isLoading }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleClear = useCallback(() => {
    onChange("");
    inputRef.current?.focus();
  }, [onChange]);

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
        {isLoading ? (
          <Loader2 className="h-5 w-5 text-ma-purple animate-spin" />
        ) : (
          <Search className="h-5 w-5 text-ma-gray-400" />
        )}
      </div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search for a foundation (e.g., Gates Foundation, Ford Foundation)..."
        className="w-full pl-13 pr-11 py-4 text-lg glass-card !rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-ma-teal/50 focus:border-transparent placeholder:text-ma-gray-400 transition-all"
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-5 flex items-center text-ma-gray-400 hover:text-ma-navy transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
