// src/components/Navbar.tsx
import React from "react";

const Navbar: React.FC = () => {
  return (
    <nav className="bg-green-700 text-white shadow-md">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg
              className="h-8 w-8 mr-2"
              xmlns="http://www.w3.org/2000/svg"
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
            <span className="font-bold text-xl">bionexo scrap</span>
          </div>

          <div className="flex items-center">
            <div className="rounded-full bg-white text-green-700 h-8 w-8 flex items-center justify-center">
              <span className="font-bold">US</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
