// src/components/UserManager.tsx
import React, { useState, useEffect, FormEvent } from "react";
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

interface UserManagerProps {
  onClose: () => void; // Callback to close the modal
}

const UserManager: React.FC<UserManagerProps> = ({ onClose }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [allServices, setAllServices] = useState<AdminService[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start true to load data
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
  const [newAccess, setNewAccess] = useState("");

  // Edit User Form Fields
  const [editPassword, setEditPassword] = useState("");
  const [editIsAdmin, setEditIsAdmin] = useState(false);
  const [editSelectedServiceIds, setEditSelectedServiceIds] = useState<
    Set<number>
  >(new Set());

  // Effect to check admin status and fetch initial data
  useEffect(() => {
    const adminStatus = localStorage.getItem("isAdmin");
    if (adminStatus === "true") {
      setIsAdminUser(true);
      // Fetch data only if admin
      const fetchData = async () => {
        setIsLoading(true);
        await Promise.all([fetchUsers(), fetchAllServices()]);
        setIsLoading(false);
      };
      fetchData();
    } else {
      setIsAdminUser(false);
      setError(
        "Access Denied. You must be an administrator to view this page."
      );
      setIsLoading(false); // Not loading if not admin
    }
  }, []);

  const fetchUsers = async () => {
    // No setIsLoading here, handled by parent fetchData
    setError(null);
    try {
      const data = await getAllUsersAdmin();
      setUsers(data);
    } catch (err: any) {
      handleApiError(err, "Failed to fetch users.");
    }
  };

  const fetchAllServices = async () => {
    // No setIsLoading here
    try {
      const servicesData = await getAllServicesForAdmin();
      setAllServices(servicesData);
    } catch (err) {
      handleApiError(err, "Failed to fetch services list.");
    }
  };

  const handleApiError = (err: any, defaultMessage: string) => {
    const errorMessage =
      err.response?.data?.detail || err.message || defaultMessage;
    setError(errorMessage); // Set error for display within the modal
    console.error(err);
  };

  const resetAddUserForm = () => {
    setNewUsername("");
    setNewPassword("");
    setNewIsAdmin(false);
    setNewAccess("");
    setError(null); // Clear form-specific errors
  };

  const handleAddUser = async (e: FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors
    if (!newUsername.trim() || !newPassword.trim()) {
      setError("Username and Password are required for new user.");
      return;
    }
    const payload: NewUserPayload = {
      user_name: newUsername,
      user_pass: newPassword,
      is_admin: newIsAdmin,
      access: newAccess,
    };
    try {
      await createUserAdmin(payload);
      fetchUsers(); // Refresh user list
      setShowAddUserModal(false); // Close the add user sub-modal
      resetAddUserForm();
    } catch (err: any) {
      handleApiError(err, "Failed to add user."); // Error will be shown in the sub-modal
    }
  };

  const openEditModal = (user: User) => {
    setCurrentUserToEdit(user);
    setEditPassword("");
    setEditIsAdmin(user.is_admin);
    const serviceIds = user.access
      ? user.access
          .split(",")
          .map((id) => parseInt(id.trim(), 10))
          .filter((id) => !isNaN(id))
      : [];
    setEditSelectedServiceIds(new Set(serviceIds));
    setShowEditUserModal(true);
    setError(null); // Clear errors when opening edit modal
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
    e.preventDefault();
    if (!currentUserToEdit) return;
    setError(null); // Clear previous errors

    const payload: UpdateUserPayload = {
      is_admin: editIsAdmin,
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
        : []
    );
    const noAccessChange =
      editSelectedServiceIds.size === originalAccessSet.size &&
      Array.from(editSelectedServiceIds).every((id) =>
        originalAccessSet.has(id)
      );

    if (
      !payload.user_pass &&
      editIsAdmin === currentUserToEdit.is_admin &&
      noAccessChange
    ) {
      setError("No changes detected to update.");
      return;
    }

    try {
      await updateUserAdmin(currentUserToEdit.id, payload);
      fetchUsers(); // Refresh user list
      setShowEditUserModal(false); // Close the edit user sub-modal
      setCurrentUserToEdit(null);
    } catch (err: any) {
      handleApiError(err, "Failed to update user."); // Error will be shown in the sub-modal
    }
  };

  const handleDeleteUser = async (userId: number) => {
    // Use a custom confirmation modal instead of window.confirm if desired for consistent styling
    if (
      window.confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    ) {
      setError(null); // Clear previous errors
      try {
        await deleteUserAdmin(userId);
        fetchUsers(); // Refresh user list
      } catch (err: any) {
        handleApiError(err, "Failed to delete user."); // Error will be shown in the main part of UserManager
      }
    }
  };

  // Render function for the internal "Add User" and "Edit User" modals
  const renderSubModal = (
    title: string,
    content: JSX.Element,
    subModalCloseHandler: () => void
  ) => (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 overflow-y-auto h-full w-full flex justify-center items-center z-[60]">
      {" "}
      {/* Higher z-index for sub-modal */}
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
        {/* Error display specific to the sub-modal */}
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

  const addUserFormContent = (
    <form onSubmit={handleAddUser} className="space-y-4">
      <div>
        <label
          className="block text-sm font-medium text-gray-700"
          htmlFor="newUsername"
        >
          Username
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
          Password
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
      <div>
        <label
          className="block text-sm font-medium text-gray-700"
          htmlFor="newAccess"
        >
          Access Rights (comma-separated IDs)
        </label>
        <input
          type="text"
          id="newAccess"
          value={newAccess}
          onChange={(e) => setNewAccess(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="e.g., 1,2,3"
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
          Is Admin?
        </label>
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
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm"
        >
          Create User
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
          New Password (optional)
        </label>
        <input
          type="password"
          id="editPassword"
          value={editPassword}
          onChange={(e) => setEditPassword(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
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
          Is Admin?
        </label>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Service Access Rights
        </label>
        <div className="mt-1 max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3 bg-gray-50 space-y-2">
          {allServices.length > 0 ? (
            allServices.map((service) => (
              <div key={service.srv_id} className="flex items-center">
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
              No services available or failed to load.
            </p>
          )}
        </div>
      </div>
      <div className="flex justify-end space-x-3 pt-3">
        <button
          type="button"
          onClick={() => {
            setShowEditUserModal(false);
            setError(null);
          }}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md border border-gray-300 shadow-sm"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md shadow-sm"
        >
          Save Changes
        </button>
      </div>
    </form>
  );

  // Main modal structure for UserManager
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      {" "}
      {/* Overlay */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {" "}
        {/* Modal Content Box */}
        {/* Modal Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h1 className="text-xl font-semibold text-gray-800">
            User Management
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
        {/* Modal Body */}
        <div className="p-4 overflow-y-auto flex-grow">
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

              {/* General error display for UserManager (not for sub-modals) */}
              {error &&
                !showAddUserModal &&
                !showEditUserModal &&
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
                        setShowAddUserModal(true);
                        resetAddUserForm();
                      }}
                      className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                    >
                      Add New User
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
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                              ID
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                              Username
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                              Admin
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                              Access (IDs)
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                              Created
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                              Actions
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
                                  onClick={() => openEditModal(user)}
                                  className="text-indigo-600 hover:text-indigo-800 transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="text-red-600 hover:text-red-800 transition-colors"
                                >
                                  Delete
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
      {/* Internal Modals for Add/Edit User */}
      {showAddUserModal &&
        renderSubModal("Add New User", addUserFormContent, () => {
          setShowAddUserModal(false);
          resetAddUserForm();
        })}
      {showEditUserModal &&
        currentUserToEdit &&
        renderSubModal(
          `Edit User: ${currentUserToEdit.username}`,
          editUserFormContent !== null ? editUserFormContent : <div />,
          () => {
            setShowEditUserModal(false);
            setError(null);
          }
        )}
    </div>
  );
};

export default UserManager;
