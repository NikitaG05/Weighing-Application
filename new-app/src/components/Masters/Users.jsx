
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../../api/usersApi";

import "../../style/User.css";
import ActionButtons from "../ActionButtons";

const emptyForm = {
  username: "",
  fullName: "",
  mobileNumber: "",
  email: "",
  role: "USER",
  enabled: true,
};

function User({
  accessToken,
  refreshKey = 0,
  currentUserRole,
}) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [editLoading, setEditLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadUsers = useCallback(async () => {
    if (!accessToken) return;

    setLoading(true);
    setError("");

    try {
      const data = await getAllUsers(accessToken);
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "Unable to load users."
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers, refreshKey]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch = (user.username || "")
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesRole =
        roleFilter === "ALL" || user.role === roleFilter;

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && user.enabled) ||
        (statusFilter === "INACTIVE" && !user.enabled);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / pageSize)
  );

  const currentPage = Math.min(page, totalPages);

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  function updateFilter(setter, value) {
    setter(value);
    setPage(1);
  }

  function resetForm() {
    setEditingId(null);
    setForm({ ...emptyForm });
  }

  async function handleEdit(id) {
    setError("");
    setSuccess("");
    setEditLoading(true);

    try {
      const user = await getUserById(accessToken, id);

      setEditingId(user.id);
      setForm({
        username: user.username || "",
        fullName: user.fullName || "",
        mobileNumber: user.mobileNumber || "",
        email: user.email || "",
        role: user.role || "USER",
        enabled: Boolean(user.enabled),
      });
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Unable to load user details."
      );
    } finally {
      setEditLoading(false);
    }
  }

  function handleFormChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleUpdate(event) {
    event.preventDefault();

    if (editingId === null) return;

    setError("");
    setSuccess("");

    if (
      !form.username.trim() ||
      !form.fullName.trim() ||
      !form.email.trim()
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    if (!/^[0-9]{10}$/.test(form.mobileNumber.trim())) {
      setError("Mobile number must contain exactly 10 digits.");
      return;
    }

    setSaving(true);

    try {
      await updateUser(accessToken, editingId, {
        username: form.username.trim(),
        fullName: form.fullName.trim(),
        mobileNumber: form.mobileNumber.trim(),
        email: form.email.trim(),
        role: form.role,
        enabled: form.enabled,
      });

      resetForm();
      await loadUsers();
      setSuccess("User information updated successfully.");
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Unable to update user."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(user) {
    const confirmed = window.confirm(
      `Permanently delete user "${user.username}"?\n\n` +
      "This action cannot be undone."
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");
    setDeletingId(user.id);

    try {
      await deleteUser(accessToken, user.id);

      if (editingId === user.id) {
        resetForm();
      }

      await loadUsers();
      setSuccess(`User "${user.username}" deleted successfully.`);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        err.response?.data?.message ||
        "Unable to delete user. The account may be protected or referenced by other records."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="user-management">
      
        <div className="user-list-header">
          <h2>Registered Users</h2>

          <button
            type="button"
            className="user-refresh-button"
            onClick={loadUsers}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}

      {success && (
        <p className="user-success-message" role="status">
          {success}
        </p>
      )}

      {/* Edit User Form */}
      {editLoading && <p>Loading user details...</p>}

      {editingId !== null && (
        <form
          className="user-edit-form"
          onSubmit={handleUpdate}
        >
          <h3>Edit User Information</h3>

          <div className="user-edit-grid">
            <div className="user-edit-field">
              <label htmlFor="editUsername">Username</label>
              <input
                id="editUsername"
                name="username"
                value={form.username}
                onChange={handleFormChange}
                maxLength={100}
                required
              />
            </div>

            <div className="user-edit-field">
              <label htmlFor="editFullName">Full Name</label>
              <input
                id="editFullName"
                name="fullName"
                value={form.fullName}
                onChange={handleFormChange}
                maxLength={100}
                required
              />
            </div>

            <div className="user-edit-field">
              <label htmlFor="editMobile">Mobile Number</label>
              <input
                id="editMobile"
                name="mobileNumber"
                type="tel"
                value={form.mobileNumber}
                onChange={handleFormChange}
                maxLength={10}
                pattern="[0-9]{10}"
                required
              />
            </div>

            <div className="user-edit-field">
              <label htmlFor="editEmail">Email</label>
              <input
                id="editEmail"
                name="email"
                type="email"
                value={form.email}
                onChange={handleFormChange}
                maxLength={150}
                required
              />
            </div>

            <div className="user-edit-field">
              <label htmlFor="editRole">Role</label>
              <select
                id="editRole"
                name="role"
                value={form.role}
                onChange={handleFormChange}
              >
                <option value="ADMIN">Admin</option>
                <option value="USER">User</option>
              </select>
            </div>

            <div className="user-edit-field user-status-field">
              <label>Account Status</label>
              <label className="user-enabled-toggle">
                <input
                  type="checkbox"
                  name="enabled"
                  checked={form.enabled}
                  onChange={handleFormChange}
                />
                {form.enabled ? "Active" : "Inactive"}
              </label>
            </div>
          </div>

          <div className="user-edit-actions">
            <button
              type="submit"
              className="user-save-button"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>

            <button
              type="button"
              className="user-cancel-button"
              onClick={resetForm}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Existing Filters */}
      <div className="user-filters">
        <input
          type="text"
          placeholder="Search username..."
          value={search}
          onChange={(e) =>
            updateFilter(setSearch, e.target.value)
          }
        />

        <select
          value={roleFilter}
          onChange={(e) =>
            updateFilter(setRoleFilter, e.target.value)
          }
        >
          <option value="ALL">All Roles</option>
          <option value="ADMIN">Admin</option>
          <option value="USER">User</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) =>
            updateFilter(setStatusFilter, e.target.value)
          }
        >
          <option value="ALL">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {loading && <p>Loading users...</p>}

      {!loading && (
        <>
          <div className="user-table-wrapper">
            <table className="user-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {paginatedUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.username}</td>
                    <td>
                      <span className="user-role-badge">
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span
                        className={
                          user.enabled
                            ? "status-active"
                            : "status-inactive"
                        }
                      >
                        {user.enabled ? "Active" : "Inactive"}
                      </span>
                    </td>
                    
                    <td>
                      <ActionButtons
                          onEdit={() => handleEdit(user)}
                          onDelete={() => handleDelete(user)}
                          deleteDisabled={
                            currentUserRole !== "ADMIN" ||
                            user.role === "ADMIN" ||
                            deletingId === user.id
                          }
                        />
                    </td>

                  </tr>
                ))}

                {paginatedUsers.length === 0 && (
                  <tr>
                    <td colSpan={5}>No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="user-pagination">
            <label>
              Rows per page:{" "}
              <select
                value={pageSize}
                onChange={(e) =>
                  updateFilter(
                    setPageSize,
                    Number(e.target.value)
                  )
                }
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </label>

            <div className="pagination-controls">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
              >
                Previous
              </button>

              <span>
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setPage(currentPage + 1)}
              >
                Next
              </button>
            </div>
          </div>

          <p>Total Users: {filteredUsers.length}</p>
        </>
      )}
    </div>
  );
}

export default User;
