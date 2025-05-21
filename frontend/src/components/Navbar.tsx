// src/components/Navbar.tsx
import React from "react";
import { LogOut, Search } from "lucide-react";

export interface NavbarProps {
  searchTerm: string;
  setSearchTerm: (dashboard: string) => void;
  handleLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchTerm,
  setSearchTerm,
  handleLogout,
}) => {
  return (
    <nav className="w-full bg-[#2e7675] shadow-md">
      <div className="w-full px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex justify-center items-center">
            <img src="s-i.webp" className="w-10" />
            <div className="mx-4 h-10 w-px bg-gray-300"></div>
            <span className=" text-xl font-semibold text-gray-100">
              Painel de serviços
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center">
              <div className="relative mx-4">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search services..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="ml-3 relative">
                <div className="flex items-center">
                  <button className="ml-2 p-1 rounded-full text-gray-100 hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                    <LogOut className="h-5 w-5" onClick={handleLogout} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
