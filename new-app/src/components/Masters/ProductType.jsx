
import { useCallback, useEffect, useMemo, useState } from "react";
import productTypeApi from "../../api/ProductTypeApi";
import "../../style/ProductTypeMaster.css";

const EMPTY_FORM = {
  typeCode: "",
  typeName: "",
  statusId: "1",
};

const ProductTypeMaster = () => {
  const [productTypes, setProductTypes] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const session = useMemo(() => {
    try {
      return JSON.parse(
        sessionStorage.getItem("weighbridgeSession") || "{}"
      );
    } catch {
      return {};
    }
  }, []);

  const isAdmin =
    String(session.role || "")
      .replace(/^ROLE_/i, "")
      .toUpperCase() === "ADMIN";

  const loadProductTypes = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await productTypeApi.getAllProductTypes();
      setProductTypes(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load product types.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProductTypes();
  }, [loadProductTypes]);

  const filteredProductTypes = useMemo(() => {
    const query = search.trim().toLowerCase();

    return productTypes.filter((item) => {
      const matchesSearch =
        String(item.typeCode || "")
          .toLowerCase()
          .includes(query) ||
        String(item.typeName || "")
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        item.statusCode === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [productTypes, search, statusFilter]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!isAdmin || saving) return;

    setError("");
    setSuccess("");

    const typeCode = form.typeCode.trim().toUpperCase();
    const typeName = form.typeName.trim();

    if (!typeCode || !typeName) {
      setError("Product type code and name are required.");
      return;
    }

    const payload = {
      typeCode,
      typeName,
      statusId: Number(form.statusId),
    };

    try {
      setSaving(true);

      if (editingId !== null) {
        await productTypeApi.updateProductType(
          editingId,
          payload
        );
        setSuccess("Product type updated successfully.");
      } else {
        await productTypeApi.createProductType(payload);
        setSuccess("Product type created successfully.");
      }

      resetForm();
      await loadProductTypes();
    } catch (err) {
      setError(err.message || "Unable to save product type.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    if (!isAdmin) return;

    setEditingId(item.id);
    setForm({
      typeCode: item.typeCode || "",
      typeName: item.typeName || "",
      statusId: String(item.statusId ?? 1),
    });

    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (item) => {
    if (!isAdmin || deletingId !== null) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete "${item.typeName}"?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(item.id);
      setError("");
      setSuccess("");

      await productTypeApi.deleteProductType(item.id);

      if (editingId === item.id) {
        resetForm();
      }

      setSuccess("Product type deleted successfully.");
      await loadProductTypes();
    } catch (err) {
      setError(
        err.message ||
          "Unable to delete product type. It may be in use."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="ptm-page">
      <div className="ptm-header">
        <div>
          <h2>Product Type Master</h2>
          <p>
            Manage global product categories for all weighbridge
            sites.
          </p>
        </div>

        <button
          type="button"
          className="ptm-button ptm-button-secondary"
          onClick={loadProductTypes}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="ptm-alert ptm-alert-error" role="alert">
          {error}
        </div>
      )}

      {success && (
        <div className="ptm-alert ptm-alert-success" role="status">
          {success}
        </div>
      )}

      {isAdmin && (
        <section className="ptm-card">
          <div className="ptm-section-heading">
            <h3>
              {editingId !== null
                ? "Edit Product Type"
                : "Add Product Type"}
            </h3>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="ptm-form-grid">
              <label className="ptm-field">
                <span>Type Code *</span>
                <input
                  name="typeCode"
                  value={form.typeCode}
                  onChange={handleChange}
                  placeholder="e.g. RAW"
                  maxLength={30}
                  required
                />
              </label>

              <label className="ptm-field">
                <span>Type Name *</span>
                <input
                  name="typeName"
                  value={form.typeName}
                  onChange={handleChange}
                  placeholder="e.g. Raw Material"
                  maxLength={100}
                  required
                />
              </label>

              <label className="ptm-field">
                <span>Status *</span>
                <select
                  name="statusId"
                  value={form.statusId}
                  onChange={handleChange}
                  required
                >
                  <option value="1">Active</option>
                  <option value="2">Inactive</option>
                </select>
              </label>
            </div>

            <div className="ptm-form-actions">
              <button
                type="submit"
                className="ptm-button ptm-button-primary"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId !== null
                    ? "Update Product Type"
                    : "Add Product Type"}
              </button>

              <button
                type="button"
                className="ptm-button ptm-button-secondary"
                onClick={resetForm}
                disabled={saving}
              >
                Clear
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="ptm-card">
        <div className="ptm-section-heading">
          <h3>Product Type List</h3>
          <span className="ptm-count">
            {filteredProductTypes.length} Records
          </span>
        </div>

        <div className="ptm-toolbar">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by code or name..."
            aria-label="Search product types"
          />

          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            aria-label="Filter by status"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>

        <div className="ptm-table-wrapper">
          <table className="ptm-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type Code</th>
                <th>Type Name</th>
                <th>Status</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="ptm-empty">
                    Loading product types...
                  </td>
                </tr>
              ) : filteredProductTypes.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="ptm-empty">
                    No product types found.
                  </td>
                </tr>
              ) : (
                filteredProductTypes.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>
                      <strong>{item.typeCode}</strong>
                    </td>
                    <td>{item.typeName}</td>
                    <td>
                      <span
                        className={`ptm-status ${
                          item.statusCode === "ACTIVE"
                            ? "ptm-status-active"
                            : "ptm-status-inactive"
                        }`}
                      >
                        {item.statusName || item.statusCode}
                      </span>
                    </td>

                    {isAdmin && (
                      <td>
                        <div className="ptm-row-actions">
                          <button
                            type="button"
                            className="ptm-button ptm-button-edit"
                            onClick={() => handleEdit(item)}
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="ptm-button ptm-button-delete"
                            onClick={() => handleDelete(item)}
                            disabled={deletingId !== null}
                          >
                            {deletingId === item.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default ProductTypeMaster;
