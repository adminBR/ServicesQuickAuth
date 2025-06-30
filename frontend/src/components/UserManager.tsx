/* eslint-disable @typescript-eslint/no-explicit-any */
// src/components/UserManager.tsx
import React, { useState, FormEvent, useRef, useEffect } from "react";
import {
  getAllUsersAdmin,
  createUserAdmin,
  updateUserAdmin,
  deleteUserAdmin,
  getAllServicesForAdmin,
  User,
  NewUserPayload,
  UpdateUserPayload,
  AdminService,
} from "../api/axios"; // Adjust path

import { LoaderCircle } from "lucide-react";

interface UserManagerProps {
  onClose: () => void; // Callback to close the modal
}

const UserManager: React.FC<UserManagerProps> = ({ onClose }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [allServices, setAllServices] = useState<AdminService[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start true to load data
  const [isLoadingPost, setIsLoadingPost] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAdminUser, setIsAdminUser] = useState<boolean>(false);

  // Modal states for internal forms
  const [showAddUserModal, setShowAddUserModal] = useState<boolean>(false);
  const [showEditUserModal, setShowEditUserModal] = useState<boolean>(false);
  const [currentUserToEdit, setCurrentUserToEdit] = useState<User | null>(null);

  // Add User Form Fields
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newIsAdmin, setNewIsAdmin] = useState(false);
  const [newEndlessJwt, setNewEndlessJwt] = useState(false);
  // const [newAccess, setNewAccess] = useState(""); // No longer needed, replaced by newSelectedServiceIds
  const [newSelectedServiceIds, setNewSelectedServiceIds] = useState<
    Set<number>
  >(new Set()); // ADDED: State for new user's service selection

  // Edit User Form Fields
  const [editPassword, setEditPassword] = useState("");
  const [editIsAdmin, setEditIsAdmin] = useState(false);
  const [editEndlessJwt, setEditEndlessJwt] = useState(false);
  const [editSelectedServiceIds, setEditSelectedServiceIds] = useState<
    Set<number>
  >(new Set());

  // Reference for the main modal scrollable area
  const modalBodyRef = useRef<HTMLDivElement>(null);

  // Effect to check admin status and fetch initial data
  useEffect(() => {
    const adminStatus = localStorage.getItem("isAdmin");
    if (adminStatus === "true") {
      setIsAdminUser(true);
      // Fetch data only if admin
      const fetchData = async () => {
        setIsLoading(true);
        setError(null); // Clear previous errors before fetching
        try {
          // Fetch services first as they are needed for both add/edit forms
          await fetchAllServices();
          await fetchUsers();
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    } else {
      setIsAdminUser(false);
      setError(
        "Acesso negado. You must be an administrator to view this page."
      );
      setIsLoading(false); // Not loading if not admin
    }
  }, []);

  const fetchUsers = async () => {
    // setError(null); // setError is handled by caller or handleApiError
    try {
      const data = await getAllUsersAdmin();
      setUsers(data);
    } catch (err: any) {
      handleApiError(err, "Failed to fetch users.");
    }
  };

  const fetchAllServices = async () => {
    // setError(null);
    try {
      const servicesData = await getAllServicesForAdmin();
      setAllServices(servicesData);
    } catch (err) {
      handleApiError(err, "Failed to fetch services list.");
      setAllServices([]); // Ensure allServices is an empty array on failure to prevent map errors
    }
  };

  const handleApiError = (err: any, defaultMessage: string) => {
    const errorMessage =
      err.response?.data?.detail || err.message || defaultMessage;
    setError(errorMessage);
    console.error(defaultMessage, err);
  };

  const resetAddUserForm = () => {
    setNewUsername("");
    setNewPassword("");
    setNewIsAdmin(false);
    setNewEndlessJwt(false);
    // setNewAccess(""); // No longer needed
    setNewSelectedServiceIds(new Set()); // ADDED: Reset selected services for new user
    setError(null); // Clear form-specific errors
  };

  // ADDED: Handler for new user service checkbox change
  const handleNewServiceCheckboxChange = (serviceId: number) => {
    setNewSelectedServiceIds((prevSelectedIds) => {
      const newSelectedIds = new Set(prevSelectedIds);
      if (newSelectedIds.has(serviceId)) {
        newSelectedIds.delete(serviceId);
      } else {
        newSelectedIds.add(serviceId);
      }
      return newSelectedIds;
    });
  };

  const handleAddUser = async (e: FormEvent) => {
    setIsLoadingPost(true);
    e.preventDefault();
    setError(null);
    if (!newUsername.trim() || !newPassword.trim()) {
      setError("Username and Password are required for new user.");
      return;
    }
    const payload: NewUserPayload = {
      user_name: newUsername,
      user_pass: newPassword,
      is_admin: newIsAdmin,
      jwt_expiration: newEndlessJwt ? "inf" : "1",
      access: Array.from(newSelectedServiceIds).join(","), // MODIFIED: Use newSelectedServiceIds
    };
    try {
      await createUserAdmin(payload);
      fetchUsers();
      setShowAddUserModal(false);
      resetAddUserForm();
    } catch (err: any) {
      handleApiError(err, "Failed to add user.");
    } finally {
      setIsLoadingPost(false);
    }
  };

  const openEditModal = (user: User) => {
    setCurrentUserToEdit(user);
    setEditPassword(""); // Clear password field
    setEditIsAdmin(user.is_admin);
    setEditEndlessJwt(user.jwt_expiration === "1" ? false : true);
    const serviceIds = user.access
      ? user.access
          .split(",")
          .map((id) => parseInt(id.trim(), 10))
          .filter((id) => !isNaN(id))
      : [];

    setEditSelectedServiceIds(new Set(serviceIds));
    setShowEditUserModal(true);
    setError(null);
  };

  const handleServiceCheckboxChange = (serviceId: number) => {
    setEditSelectedServiceIds((prevSelectedIds) => {
      const newSelectedIds = new Set(prevSelectedIds);
      if (newSelectedIds.has(serviceId)) {
        newSelectedIds.delete(serviceId);
      } else {
        newSelectedIds.add(serviceId);
      }
      return newSelectedIds;
    });
  };

  const handleEditUser = async (e: FormEvent) => {
    setIsLoadingPost(true);
    e.preventDefault();
    if (!currentUserToEdit) return;
    setError(null);

    const payload: UpdateUserPayload = {
      is_admin: editIsAdmin,
      jwt_expiration: editEndlessJwt ? "inf" : "1",
      access: Array.from(editSelectedServiceIds).join(","),
    };
    if (editPassword.trim()) {
      payload.user_pass = editPassword;
    }

    const originalAccessSet = new Set(
      currentUserToEdit.access
        ? currentUserToEdit.access
            .split(",")
            .map((id) => parseInt(id.trim(), 10))
            .filter((id) => !isNaN(id)) // ensure only numbers are processed
        : []
    );

    const noPasswordChange = !payload.user_pass;
    const noAdminChange = editIsAdmin === currentUserToEdit.is_admin;

    const noEndlessJwtChange =
      (editEndlessJwt ? "inf" : "1") === currentUserToEdit.jwt_expiration;

    const noAccessChange =
      editSelectedServiceIds.size === originalAccessSet.size &&
      Array.from(editSelectedServiceIds).every((id) =>
        originalAccessSet.has(id)
      );
    console.log(
      noPasswordChange,
      noAdminChange,
      noAccessChange,
      noEndlessJwtChange
    );

    if (
      noPasswordChange &&
      noAdminChange &&
      noAccessChange &&
      noEndlessJwtChange
    ) {
      setIsLoadingPost(false);
      setError("Nenhuma mudança foi feita...");
      return;
    }

    try {
      await updateUserAdmin(currentUserToEdit.id, payload);
      fetchUsers();
      setShowEditUserModal(false);
      setCurrentUserToEdit(null);
    } catch (err: any) {
      handleApiError(err, "Failed to update user.");
    } finally {
      setIsLoadingPost(false);
    }
  };

  // Custom Confirmation Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmMessage, setConfirmMessage] = useState("");

  const handleDeleteUser = async (userId: number) => {
    setConfirmMessage(
      "Are you sure you want to delete this user? This action cannot be undone."
    );
    setConfirmAction(() => async () => {
      setError(null);
      try {
        await deleteUserAdmin(userId);
        fetchUsers();
      } catch (err: any) {
        handleApiError(err, "Failed to delete user.");
      }
      setShowConfirmModal(false); // Close confirmation modal after action
    });
    setShowConfirmModal(true);
  };

  const renderConfirmModal = () => {
    if (!showConfirmModal) return null;
    return (
      <div className="fixed inset-0 bg-gray-800 bg-opacity-75 overflow-y-auto h-full w-full flex justify-center items-center z-[70]">
        <div className="relative mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Confirm Action
          </h3>
          <p className="text-sm text-gray-600 mb-6">{confirmMessage}</p>
          {error /* Error display specific to the confirm modal if any action within it fails */ && (
            <div
              className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded relative mb-3 text-sm"
              role="alert"
            >
              {error}
            </div>
          )}
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowConfirmModal(false);
                setError(null); // Clear error when cancelling
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md border border-gray-300 shadow-sm"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (confirmAction) confirmAction();
                // setShowConfirmModal(false); // Moved inside confirmAction or its .then/.catch if async
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm"
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSubModal = (
    title: string,
    content: JSX.Element,
    subModalCloseHandler: () => void
  ) => (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 overflow-y-auto h-full w-full flex justify-center items-center z-[60]">
      <div className="relative mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl leading-6 font-medium text-gray-900">
            {title}
          </h3>
          <button
            onClick={subModalCloseHandler}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-400"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>
        {error && (showAddUserModal || showEditUserModal) && (
          <div
            className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded relative mb-3 text-sm"
            role="alert"
          >
            {error}
          </div>
        )}
        {content}
      </div>
    </div>
  );

  // MODIFIED: addUserFormContent to include service selection
  const addUserFormContent = (
    <form onSubmit={handleAddUser} className="space-y-4">
      <div>
        <label
          className="block text-sm font-medium text-gray-700"
          htmlFor="newUsername"
        >
          Usuário
        </label>
        <input
          type="text"
          id="newUsername"
          value={newUsername}
          onChange={(e) => setNewUsername(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      <div>
        <label
          className="block text-sm font-medium text-gray-700"
          htmlFor="newPassword"
        >
          Senha
        </label>
        <input
          type="password"
          id="newPassword"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>
      <div className="flex items-center">
        <input
          type="checkbox"
          id="newIsAdmin"
          checked={newIsAdmin}
          onChange={(e) => setNewIsAdmin(e.target.checked)}
          className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
        />
        <label
          htmlFor="newIsAdmin"
          className="ml-2 block text-sm text-gray-900"
        >
          É Admin?
        </label>
      </div>
      <div className="flex items-center">
        <input
          type="checkbox"
          id="newIsAdmin"
          checked={newEndlessJwt}
          onChange={(e) => setNewEndlessJwt(e.target.checked)}
          className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
        />
        <label
          htmlFor="newIsAdmin"
          className="ml-2 block text-sm text-gray-900"
        >
          Sessão infinita?
        </label>
      </div>
      {/* ADDED: Service Access Rights selection for Add User form */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Service Access Rights
        </label>
        <div className="mt-1 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3 bg-gray-50 space-y-2">
          {allServices.length > 0 ? (
            allServices.map((service) => (
              <div
                key={`new-service-${service.srv_id}`}
                className="flex items-center"
              >
                <input
                  id={`new-service-add-${service.srv_id}`}
                  type="checkbox"
                  checked={newSelectedServiceIds.has(service.srv_id)}
                  onChange={() =>
                    handleNewServiceCheckboxChange(service.srv_id)
                  }
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label
                  htmlFor={`new-service-add-${service.srv_id}`}
                  className="ml-2 block text-sm text-gray-900"
                >
                  {service.srv_name}{" "}
                  <span className="text-xs text-gray-500">
                    (ID: {service.srv_id})
                  </span>
                </label>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">
              {isLoading
                ? "Loading services..."
                : "No services available or failed to load."}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-3">
        <button
          type="button"
          onClick={() => {
            setShowAddUserModal(false);
            resetAddUserForm();
          }}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md border border-gray-300 shadow-sm"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md shadow-sm"
        >
          {isLoadingPost ? (
            <LoaderCircle className="animate-spin w-20 h-5 text-white" />
          ) : (
            <p>Criar usuário</p>
          )}
        </button>
      </div>
    </form>
  );

  const editUserFormContent = currentUserToEdit && (
    <form onSubmit={handleEditUser} className="space-y-4">
      <div>
        <label
          className="block text-sm font-medium text-gray-700"
          htmlFor="editPassword"
        >
          Nova senha (opcional)
        </label>
        <input
          type="password"
          id="editPassword"
          value={editPassword}
          onChange={(e) => setEditPassword(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          autoComplete="new-password"
        />
      </div>
      <div className="flex items-center">
        <input
          id="editIsAdmin"
          type="checkbox"
          checked={editIsAdmin}
          onChange={(e) => setEditIsAdmin(e.target.checked)}
          className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
        />
        <label
          htmlFor="editIsAdmin"
          className="ml-2 block text-sm text-gray-900"
        >
          É Admin?
        </label>
      </div>
      <div className="flex items-center">
        <input
          id="jwt_expiration"
          type="checkbox"
          checked={editEndlessJwt}
          onChange={(e) => setEditEndlessJwt(e.target.checked)}
          className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
        />
        <label
          htmlFor="jwt_expiration"
          className="ml-2 block text-sm text-gray-900"
        >
          Sessão infinita
        </label>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Direito de acesso
        </label>
        <div className="mt-1 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3 bg-gray-50 space-y-2">
          {allServices.length > 0 ? (
            allServices.map((service) => (
              <div
                key={`edit-service-${service.srv_id}`}
                className="flex items-center"
              >
                <input
                  id={`service-edit-${service.srv_id}`}
                  type="checkbox"
                  checked={editSelectedServiceIds.has(service.srv_id)}
                  onChange={() => handleServiceCheckboxChange(service.srv_id)}
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label
                  htmlFor={`service-edit-${service.srv_id}`}
                  className="ml-2 block text-sm text-gray-900"
                >
                  {service.srv_name}{" "}
                  <span className="text-xs text-gray-500">
                    (ID: {service.srv_id})
                  </span>
                </label>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">
              {isLoading
                ? "Loading services..."
                : "No services available or failed to load."}
            </p>
          )}
        </div>
      </div>
      <div className="flex justify-end space-x-3 pt-3">
        <button
          type="button"
          onClick={() => {
            setShowEditUserModal(false);
            setError(null); // Clear error when cancelling edit
          }}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md border border-gray-300 shadow-sm"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md shadow-sm"
        >
          {isLoadingPost ? (
            <LoaderCircle className="animate-spin w-24 h-5 text-white" />
          ) : (
            <p>Salvar mudanças</p>
          )}
        </button>
      </div>
    </form>
  );

  return (
    <div
      className="fixed inset-0 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full flex items-center justify-center z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="userManagerModalTitle"
    >
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h1
            id="userManagerModalTitle"
            className="text-xl font-semibold text-gray-800"
          >
            Gerenciamento de usuários
          </h1>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-400"
            aria-label="Close user manager"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>

        <div ref={modalBodyRef} className="p-4 overflow-y-auto flex-grow">
          {!isAdminUser && !isLoading && (
            <div
              className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded"
              role="alert"
            >
              <p className="font-bold">Access Denied</p>
              <p>
                {error || "You must be an administrator to use this feature."}
              </p>
            </div>
          )}

          {isAdminUser && (
            <>
              {isLoading && (
                <div className="text-center py-10 text-gray-500">
                  Loading user data...
                </div>
              )}

              {error &&
                !showAddUserModal &&
                !showEditUserModal &&
                !showConfirmModal /* Hide main error if a sub-modal or confirm modal is active and showing its own error */ &&
                !isLoading && (
                  <div
                    className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded relative mb-4 text-sm"
                    role="alert"
                  >
                    {error}
                  </div>
                )}

              {!isLoading && (
                <>
                  <div className="mb-4">
                    <button
                      onClick={() => {
                        setError(null); // Clear any previous main errors
                        resetAddUserForm(); // Reset form fields and specific errors
                        setShowAddUserModal(true);
                      }}
                      className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded shadow-md focus:outline-none focus:ring-2 focus:ring-green-300"
                    >
                      Adicionar usuário
                    </button>
                  </div>

                  {users.length === 0 && !error && !isLoading && (
                    <p className="text-center text-gray-500 py-5">
                      No users found.
                    </p>
                  )}

                  {users.length > 0 && (
                    <div className="overflow-x-auto shadow-md rounded-lg border border-gray-200">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-100">
                          <tr>
                            <th
                              scope="col"
                              className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
                            >
                              ID
                            </th>
                            <th
                              scope="col"
                              className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
                            >
                              Username
                            </th>
                            <th
                              scope="col"
                              className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
                            >
                              Admin
                            </th>
                            <th
                              scope="col"
                              className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
                            >
                              JWT expiration
                            </th>
                            <th
                              scope="col"
                              className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
                            >
                              Acesso (IDs)
                            </th>
                            <th
                              scope="col"
                              className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
                            >
                              Criado em
                            </th>
                            <th
                              scope="col"
                              className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
                            >
                              Ações
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {users.map((user) => (
                            <tr
                              key={user.id}
                              className="hover:bg-gray-50 transition-colors duration-150"
                            >
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {user.id}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                {user.username}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm">
                                {user.is_admin ? (
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                    Yes
                                  </span>
                                ) : (
                                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                    No
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                {user.jwt_expiration}
                              </td>
                              <td
                                className="px-4 py-3 text-sm text-gray-500 truncate max-w-[150px] sm:max-w-xs"
                                title={user.access || "-"}
                              >
                                {user.access || "-"}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                {user.created_at
                                  ? new Date(
                                      user.created_at
                                    ).toLocaleDateString()
                                  : "-"}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium space-x-2">
                                <button
                                  onClick={() => {
                                    setError(null); // Clear main error
                                    openEditModal(user);
                                  }}
                                  className="text-indigo-600 hover:text-indigo-800 transition-colors"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() => {
                                    setError(null); // Clear main error
                                    handleDeleteUser(user.id);
                                  }}
                                  className="text-red-600 hover:text-red-800 transition-colors"
                                >
                                  Remover
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {showAddUserModal &&
        renderSubModal("Adicionar novo usuário", addUserFormContent, () => {
          setShowAddUserModal(false);
          resetAddUserForm(); // Also clears sub-modal error
        })}
      {showEditUserModal &&
        currentUserToEdit &&
        renderSubModal(
          `Edit User: ${currentUserToEdit.username}`,
          editUserFormContent || <div />, // Fallback if editUserFormContent is null
          () => {
            setShowEditUserModal(false);
            setError(null); // Clear sub-modal error
            setCurrentUserToEdit(null); // Clear current user being edited
          }
        )}
      {renderConfirmModal()}
    </div>
  );
};

export default UserManager;
