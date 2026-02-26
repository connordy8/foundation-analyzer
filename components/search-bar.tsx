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
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        {isLoading ? (
          <Loader2 className="h-5 w-5 text-ma-gray-400 animate-spin" />
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
        className="w-full pl-12 pr-10 py-4 text-lg bg-white border border-ma-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-ma-teal focus:border-transparent placeholder:text-ma-gray-400 transition-shadow"
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-ma-gray-400 hover:text-ma-gray-600 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
