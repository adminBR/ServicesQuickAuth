// src/components/QuotesList.tsx
import React from "react";
import { Quote } from "../types";
import QuoteCard from "./QuoteCard";
import LoadingSpinner from "./LoadingSpinner";

interface QuotesListProps {
  quotes: Quote[];
  isLoading: boolean;
}

const QuotesList: React.FC<QuotesListProps> = ({ quotes, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (quotes.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">
          No quotes found. Try adjusting your search criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:gap-6">
      {quotes.map((quote) => (
        <QuoteCard key={quote.id} quote={quote} />
      ))}
    </div>
  );
};

export default QuotesList;
