import { useState } from "react";
import { Search, Bell, Settings, LogOut } from "lucide-react";

export default function Dashboard() {
  // Sample data for the service cards
  const [services, setServices] = useState([
    {
      id: 1,
      title: "File Server",
      description: "Shared network storage for documents and media",
      ip: "192.168.1.100",
      imageUrl: "/api/placeholder/200/150",
    },
    {
      id: 2,
      title: "Mail Server",
      description: "Email and communication services",
      ip: "192.168.1.110",
      imageUrl: "/api/placeholder/200/150",
    },
    {
      id: 3,
      title: "Database",
      description: "PostgreSQL database for application data",
      ip: "192.168.1.120",
      imageUrl: "/api/placeholder/200/150",
    },
    {
      id: 4,
      title: "Web Server",
      description: "Apache server for internal websites",
      ip: "192.168.1.130",
      imageUrl: "/api/placeholder/200/150",
    },
    {
      id: 5,
      title: "Monitoring",
      description: "System metrics and health monitoring",
      ip: "192.168.1.140",
      imageUrl: "/api/placeholder/200/150",
    },
    {
      id: 6,
      title: "Jenkins",
      description: "CI/CD pipeline for development",
      ip: "192.168.1.150",
      imageUrl: "/api/placeholder/200/150",
    },
    {
      id: 7,
      title: "GitLab",
      description: "Source code management and version control",
      ip: "192.168.1.160",
      imageUrl: "/api/placeholder/200/150",
    },
    {
      id: 8,
      title: "Wiki",
      description: "Documentation and knowledge base",
      ip: "192.168.1.170",
      imageUrl: "/api/placeholder/200/150",
    },
  ]);

  // Search functionality
  const [searchTerm, setSearchTerm] = useState("");

  const filteredServices = services.filter(
    (service) =>
      service.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.ip.includes(searchTerm)
  );

  // Function to handle service card click
  const handleServiceClick = (ip) => {
    // Open the service in a new tab
    window.open(`http://${ip}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center mr-2">
                  <span className="text-white font-bold">S</span>
                </div>
                <span className="text-xl font-bold text-gray-800">
                  Services Hub
                </span>
              </div>
            </div>

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

              <button className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                <Bell className="h-6 w-6" />
              </button>

              <button className="ml-3 p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                <Settings className="h-6 w-6" />
              </button>

              <div className="ml-3 relative">
                <div className="flex items-center">
                  <button className="max-w-xs bg-gray-800 rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                    <img
                      className="h-8 w-8 rounded-full"
                      src="/api/placeholder/32/32"
                      alt="User profile"
                    />
                  </button>
                  <button className="ml-2 p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">
            Dashboard
          </h1>

          {/* Services grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                onClick={() => handleServiceClick(service.ip)}
                className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow duration-300 transform hover:-translate-y-1 transition-transform duration-300"
              >
                <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                  <img
                    src={service.imageUrl}
                    alt={service.title}
                    className="w-full h-48 object-cover"
                  />
                </div>
                <div className="px-4 py-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {service.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {service.description}
                  </p>
                  <div className="mt-2 flex items-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {service.ip}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty state */}
          {filteredServices.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">
                No services found matching your search.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
