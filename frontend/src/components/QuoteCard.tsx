// src/components/QuoteCard.tsx
import React from "react";
import { Quote } from "../types";

interface QuoteCardProps {
  quote: Quote;
}

const QuoteCard: React.FC<QuoteCardProps> = ({ quote }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
      <div className="flex flex-col md:flex-row justify-between">
        <div className="mb-2 md:mb-0">
          <h3 className="text-lg font-semibold text-gray-800">{quote.name}</h3>
          <p className="text-sm text-gray-500">Code: {quote.code}</p>
        </div>
        <div className="flex items-center space-x-2">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              quote.kind === "pdc"
                ? "bg-green-100 text-green-800"
                : "bg-blue-100 text-blue-800"
            }`}
          >
            {quote.kind}
          </span>
          {quote.canceled && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
              Canceled
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-gray-500">Published</p>
          <p className="text-sm">
            {quote.published_at.date} at {quote.published_at.hour}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Expires</p>
          <p className="text-sm">
            {quote.expires_at.date} at {quote.expires_at.hour}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Categories</p>
          <div className="flex flex-wrap gap-1">
            {quote.category.map((cat, index) => (
              <span
                key={index}
                className="text-xs bg-gray-100 rounded px-2 py-0.5"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-between items-center">
        <div className="flex space-x-4">
          <div className="flex items-center">
            <svg
              className="h-4 w-4 text-green-600 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
              />
            </svg>
            <span className="text-sm">{quote.replies_count} replies</span>
          </div>
          <div className="flex items-center">
            <svg
              className="h-4 w-4 text-green-600 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <span className="text-sm">{quote.items_count} items</span>
          </div>
        </div>
        <button className="px-3 py-1 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors duration-200 text-sm">
          View Details
        </button>
      </div>
    </div>
  );
};

export default QuoteCard;
