import { useState, useEffect } from "react";
import { Search, LogOut, Edit, Plus, X } from "lucide-react";

import { useNavigate } from "react-router-dom";
import { getServices, updateService, addService } from "./api/services";

// Define interfaces for our data types
interface ServiceType {
  srv_id: number;
  srv_image: string;
  srv_name: string;
  srv_ip: string;
  srv_desc: string;
}

export default function Dashboard() {
  const navigate = useNavigate();

  // Sample data for the service cards
  const [services, setServices] = useState<ServiceType[]>([
    {
      srv_id: 1,
      srv_image: "File Server",
      srv_name: "Shared network storage for documents and media",
      srv_ip: "192.168.1.100",
      srv_desc: "/api/placeholder/200/150",
    },
  ]);

  // State for managing edit modal
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [currentService, setCurrentService] = useState<ServiceType | null>(
    null
  );

  // State for managing add modal
  const [addModalOpen, setAddModalOpen] = useState<boolean>(false);
  const [newService, setNewService] = useState<Omit<ServiceType, "srv_id">>({
    srv_image: "/api/placeholder/200/150",
    srv_name: "",
    srv_ip: "",
    srv_desc: "",
  });

  // Search functionality
  const [searchTerm, setSearchTerm] = useState<string>("");

  const filteredServices = services.filter(
    (service) =>
      service.srv_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.srv_ip.includes(searchTerm)
  );

  const handleLogout = (): void => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/login");
  };

  // Function to handle service card click
  const handleServiceClick = (ip: string): void => {
    // Open the service in a new tab
    window.open(`http://${ip}`, "_blank");
  };

  // Function to handle edit button click
  const handleEditClick = (e: React.MouseEvent, service: ServiceType): void => {
    e.stopPropagation(); // Prevent the card click event from firing
    setCurrentService(service);
    setEditModalOpen(true);
  };

  // Function to handle service update
  const handleUpdateService = async (): Promise<void> => {
    try {
      if (!currentService) return;

      await updateService(currentService.srv_id, currentService);

      // Update the services in state
      setServices(
        services.map((service) =>
          service.srv_id === currentService.srv_id ? currentService : service
        )
      );

      setEditModalOpen(false);
    } catch (err) {
      console.error("Error updating service:", err);
    }
  };

  // Function to handle add service
  const handleAddService = async (): Promise<void> => {
    try {
      await addService(newService);
      const request = await getServices();
      setServices(request["content"] as ServiceType[]);

      setAddModalOpen(false);
    } catch (err) {
      console.error("Error adding service:", err);
    }
  };

  useEffect(() => {
    const populateServices = async (): Promise<void> => {
      try {
        const request = await getServices();
        setServices(request["content"] as ServiceType[]);
      } catch (err: unknown) {
        console.log("CallError", err);
      }
    };
    populateServices();
  }, []); // Added dependency array to prevent infinite re-renders

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

              <div className="ml-3 relative">
                <div className="flex items-center">
                  <button className="ml-2 p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                    <LogOut className="h-5 w-5" onClick={handleLogout} />
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
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            <button
              onClick={() => setAddModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </button>
          </div>

          {/* Services grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredServices.map((service) => (
              <div
                key={service.srv_ip}
                className="bg-white overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transform hover:-translate-y-1 transition-transform duration-300"
              >
                <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                  <img
                    src={service.srv_image}
                    alt={service.srv_name}
                    className="w-full h-48 object-cover"
                    onClick={() => handleServiceClick(service.srv_ip)}
                  />
                </div>
                <div className="px-4 py-4">
                  <div className="flex justify-between items-start">
                    <h3
                      className="text-lg font-medium text-gray-900"
                      onClick={() => handleServiceClick(service.srv_ip)}
                    >
                      {service.srv_name}
                    </h3>
                    <button
                      onClick={(e) => handleEditClick(e, service)}
                      className="p-1 rounded-full text-gray-400 hover:text-green-600 focus:outline-none"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  </div>
                  <p
                    className="mt-1 text-sm text-gray-500"
                    onClick={() => handleServiceClick(service.srv_ip)}
                  >
                    {service.srv_desc}
                  </p>
                  <div
                    className="mt-2 flex items-center"
                    onClick={() => handleServiceClick(service.srv_ip)}
                  >
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {service.srv_ip}
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

      {/* Edit Modal */}
      {editModalOpen && currentService && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                Edit Service
              </h3>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Service Name
                  </label>
                  <input
                    type="text"
                    value={currentService.srv_name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCurrentService({
                        ...currentService,
                        srv_name: e.target.value,
                      })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    IP Address
                  </label>
                  <input
                    type="text"
                    value={currentService.srv_ip}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCurrentService({
                        ...currentService,
                        srv_ip: e.target.value,
                      })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    value={currentService.srv_desc}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setCurrentService({
                        ...currentService,
                        srv_desc: e.target.value,
                      })
                    }
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Image URL
                  </label>
                  <input
                    type="text"
                    value={currentService.srv_image}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCurrentService({
                        ...currentService,
                        srv_image: e.target.value,
                      })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 mr-3"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateService}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                Add New Service
              </h3>
              <button
                onClick={() => setAddModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Service Name
                  </label>
                  <input
                    type="text"
                    value={newService.srv_name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewService({ ...newService, srv_name: e.target.value })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="Enter service name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    IP Address
                  </label>
                  <input
                    type="text"
                    value={newService.srv_ip}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewService({ ...newService, srv_ip: e.target.value })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="Enter IP address (e.g. 192.168.1.100)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    value={newService.srv_desc}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setNewService({ ...newService, srv_desc: e.target.value })
                    }
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="Enter service description"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Image URL
                  </label>
                  <input
                    type="text"
                    value={newService.srv_image}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewService({
                        ...newService,
                        srv_image: e.target.value,
                      })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="Enter image URL or leave as default"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setAddModalOpen(false)}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 mr-3"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddService}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  Add Service
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
