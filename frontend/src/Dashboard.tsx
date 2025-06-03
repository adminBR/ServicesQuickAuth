import { useState, useEffect } from "react";
import { Search, Edit, Plus, X, LoaderCircle } from "lucide-react";

import { useNavigate } from "react-router-dom";
import {
  getServices,
  updateService,
  addService,
  deleteService,
} from "./api/services";
import { logoutUser } from "./api/axios";
import { Navbar } from "./components/Navbar";
import UserManager from "./components/UserManager";

// Define interfaces for our data types
interface ServiceType {
  srv_id: number;
  srv_image: Base64URLString;
  srv_name: string;
  srv_ip: string;
  srv_desc: string;
}

export default function Dashboard() {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [isRemoveLoading, setRemoveIsLoading] = useState<boolean>(false);
  // Sample data for the service cards
  const [services, setServices] = useState<ServiceType[]>([]);

  // State for managing edit modal
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [currentService, setCurrentService] = useState<ServiceType | null>(
    null
  );

  // State for managing add modal
  const [addModalOpen, setAddModalOpen] = useState<boolean>(false);
  const [userManager, setUserManager] = useState<boolean>(false);
  const [newService, setNewService] = useState<Omit<ServiceType, "srv_id">>({
    srv_image: "/api/placeholder/200/150",
    srv_name: "",
    srv_ip: "",
    srv_desc: "",
  });

  const [isAdmin, setIsAdmin] = useState<boolean>(false);

  // Search functionality
  const [searchTerm, setSearchTerm] = useState<string>("");

  const filteredServices = services.filter(
    (service) =>
      service.srv_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.srv_ip.includes(searchTerm)
  );

  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleLogout = async () => {
    try {
      await logoutUser();
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      navigate("/login");
    } catch (error) {
      console.log(error);
    }
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
      setIsLoading(true);

      const formData = new FormData();
      formData.append("srv_name", currentService.srv_name);
      formData.append("srv_ip", currentService.srv_ip);
      formData.append("srv_desc", currentService.srv_desc);
      if (selectedFile) {
        formData.append("srv_image", selectedFile);
      }
      await updateService(currentService.srv_id, formData);

      // Update the services in state
      const request = await getServices();
      setServices(request["content"] as ServiceType[]);

      setEditModalOpen(false);
      setPreviewImage(null);
      setSelectedFile(null);
    } catch (err) {
      console.error("Error updating service:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteService = async (): Promise<void> => {
    try {
      if (!currentService) return;
      setRemoveIsLoading(true);

      await deleteService(currentService.srv_id);

      // Update the services in state
      const request = await getServices();
      setServices(request["content"] as ServiceType[]);

      setEditModalOpen(false);
      setPreviewImage(null);
      setSelectedFile(null);
    } catch (err) {
      console.error("Error updating service:", err);
    } finally {
      setRemoveIsLoading(false);
    }
  };

  // Function to handle add service
  const handleAddService = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append("srv_name", newService.srv_name);
      formData.append("srv_ip", newService.srv_ip);
      formData.append("srv_desc", newService.srv_desc);
      if (selectedFile) {
        formData.append("srv_image", selectedFile);
      }

      await addService(formData);

      const request = await getServices();
      setServices(request["content"] as ServiceType[]);

      setAddModalOpen(false);
      setPreviewImage(null);
      setSelectedFile(null);
    } catch (err) {
      console.error("Error adding service:", err);
    } finally {
      setIsLoading(false);
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
      setIsAdmin(localStorage.getItem("isAdmin") === "true" ? true : false);
    };
    populateServices();
  }, []); // Added dependency array to prevent infinite re-renders

  const handleCloseUserManager = () => {
    setUserManager(false);
  };

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden bg-gradient-to-b from-[#2e7675] to-[#2e7675]">
      {/* Header */}
      <Navbar
        handleLogout={handleLogout}
        setSearchTerm={setSearchTerm}
        searchTerm={searchTerm}
      />

      {/* Main content */}
      <main className="flex-1 flex flex-col p-2 overflow-y-auto  bg-[#e7e7e7] rounded-md m-2">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex justify-between items-center mb-6 w-full">
            <h1 className="text-2xl font-semibold pt-3 text-gray-500">
              Serviços ativos
            </h1>
            {isAdmin && (
              <div>
                <button
                  onClick={() => setAddModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {isLoading ? (
                    <LoaderCircle className="animate-spin w-5 h-5 text-white" />
                  ) : (
                    <p>Adicionar serviço</p>
                  )}
                </button>
                <button
                  onClick={() => setUserManager(!userManager)}
                  className="inline-flex items-center ml-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Gerenciar usuarios
                </button>
              </div>
            )}
          </div>

          <div className="min-h-[300px] w-full">
            {filteredServices.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {filteredServices.map((service) => (
                  <div
                    key={service.srv_ip}
                    className="bg-white border overflow-hidden shadow rounded-lg cursor-pointer hover:shadow-md transform hover:-translate-y-1 transition-transform duration-300"
                  >
                    <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                      <img
                        src={`data:${service.srv_image
                          .split(".")
                          .pop()
                          ?.toLowerCase()};base64,${service.srv_image}`}
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

                        {isAdmin && (
                          <button
                            onClick={(e) => handleEditClick(e, service)}
                            className="p-1 rounded-full text-gray-400 hover:text-green-600 focus:outline-none"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <div
                        className="mt-2 flex items-center"
                        onClick={() => handleServiceClick(service.srv_ip)}
                      >
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {service.srv_ip}
                        </span>
                      </div>
                      <p
                        className="mt-1 text-sm text-gray-500"
                        onClick={() => handleServiceClick(service.srv_ip)}
                      >
                        {service.srv_desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full flex flex-col items-center justify-center border border-dashed rounded-lg py-16 px-4  text-center">
                <Search className="w-10 h-10 text-gray-400 mb-4" />
                <h2 className="text-lg font-semibold text-gray-700 mb-2">
                  Nenhum serviço encontrado
                </h2>
                <p className="text-sm text-gray-500">
                  Verifique sua internet ou entre em contanto com o suporte
                </p>
              </div>
            )}
          </div>
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
                    Service Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSelectedFile(file);
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setPreviewImage(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  {previewImage && (
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="mt-2 w-32 h-32 object-cover rounded"
                    />
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-between items-center">
                {/* Left Side - Delete Button */}
                <div className="flex">
                  <button
                    onClick={handleDeleteService}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    {isRemoveLoading ? (
                      <LoaderCircle className="animate-spin w-5 h-5 text-white" />
                    ) : (
                      <p>Remover</p>
                    )}
                  </button>
                </div>

                {/* Right Side - Cancel and Save Buttons */}
                <div className="flex">
                  <button
                    onClick={() => setEditModalOpen(false)}
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 mr-3"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleUpdateService}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    {isLoading ? (
                      <LoaderCircle className="animate-spin w-5 h-5 text-white" />
                    ) : (
                      <p>Salvar</p>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {userManager && <UserManager onClose={handleCloseUserManager} />}

      {/* Add Modal */}

      {addModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                Adicionar novo serviço
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
                    Nome do serviço
                  </label>
                  <input
                    type="text"
                    value={newService.srv_name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewService({ ...newService, srv_name: e.target.value })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="Insira um nome"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Ip do serviço
                  </label>
                  <input
                    type="text"
                    value={newService.srv_ip}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewService({ ...newService, srv_ip: e.target.value })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="Insira um endereço ip (ex. 192.168.1.100)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Descrição do serviço
                  </label>
                  <textarea
                    value={newService.srv_desc}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setNewService({ ...newService, srv_desc: e.target.value })
                    }
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                    placeholder="Insira uma descrição sobre o funcionamento do serviço"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Imagem do serviço
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setSelectedFile(file);
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setPreviewImage(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  {previewImage && (
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="mt-2 w-32 h-32 object-cover rounded"
                    />
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setAddModalOpen(false)}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 mr-3"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddService}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  {isLoading ? (
                    <LoaderCircle className="animate-spin w-5 h-5 text-white" />
                  ) : (
                    <p>Adicionar</p>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
