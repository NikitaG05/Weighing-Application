import { useCallback, useEffect, useMemo, useState } from "react";
import productMasterApi from "../../api/productMasterApi";
import unitMasterApi from "../../api/UnitMasterApi";
import productTypeApi from "../../api/ProductTypeApi";
import "../../style/ProductMaster.css";

const initialForm = { productCode: "", productName: "", unitId: "", productTypeId: "", rate: "", statusId: "1" };

export default function ProductMaster() {
  const [products, setProducts] = useState([]);
  const [units, setUnits] = useState([]);
  const [types, setTypes] = useState([]);
  const [form, setForm] = useState({ ...initialForm });
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isAdmin = useMemo(() => {
    try {
      const session = JSON.parse(sessionStorage.getItem("weighbridgeSession") || "{}");
      return String(session.role || "").replace(/^ROLE_/i, "").toUpperCase() === "ADMIN";
    } catch { return false; }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [productData, unitData, typeData] = await Promise.all([
        productMasterApi.getAllProducts(), unitMasterApi.getActiveUnits(), productTypeApi.getActiveProductTypes(),
      ]);
      setProducts(Array.isArray(productData) ? productData : []);
      setUnits(Array.isArray(unitData) ? unitData : []);
      setTypes(Array.isArray(typeData) ? typeData : []);
    } catch (err) { setError(err.message || "Failed to load Product Master data."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const visibleProducts = useMemo(() => products.filter((p) => {
    const q = search.trim().toLowerCase();
    const text = [p.productCode, p.productName, p.unitName, p.typeName].join(" ").toLowerCase();
    return text.includes(q) && (statusFilter === "ALL" || p.statusCode === statusFilter);
  }), [products, search, statusFilter]);

  const resetForm = () => { setEditingId(null); setForm({ ...initialForm }); };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!isAdmin || saving) return;
    setError(""); setSuccess("");
    const rate = Number(form.rate);
    if (!form.productCode.trim() || !form.productName.trim() || !form.unitId || !form.productTypeId ||
        form.rate.trim() === "" || !Number.isFinite(rate) || rate < 0 || !/^\d+(\.\d{1,2})?$/.test(form.rate)) {
      setError("Enter a code, name, active unit, active type, and a valid non-negative rate (maximum 2 decimals).");
      return;
    }
    const payload = {
      productCode: form.productCode.trim().toUpperCase(),
      productName: form.productName.trim(),
      unitId: Number(form.unitId),
      productTypeId: Number(form.productTypeId),
      rate: form.rate,
      statusId: Number(form.statusId),
    };
    setSaving(true);
    try {
      if (editingId === null) await productMasterApi.createProduct(payload);
      else await productMasterApi.updateProduct(editingId, payload);
      const message = editingId === null ? "Product created successfully." : "Product updated successfully.";
      resetForm();
      await loadData();
      setSuccess(message);
    } catch (err) { setError(err.message || "Unable to save product."); }
    finally { setSaving(false); }
  };

  const handleEdit = (p) => {
    setEditingId(p.id);
    setForm({ productCode: p.productCode, productName: p.productName,
      unitId: String(p.unitId), productTypeId: String(p.productTypeId),
      rate: String(p.rate), statusId: String(p.statusId) });
    setError(""); setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (p) => {
    if (!isAdmin || deletingId !== null || !window.confirm(`Delete product "${p.productName}"?`)) return;
    setDeletingId(p.id); setError(""); setSuccess("");
    try {
      await productMasterApi.deleteProduct(p.id);
      if (editingId === p.id) resetForm();
      await loadData();
      setSuccess("Product deleted successfully.");
    } catch (err) { setError(err.message || "Unable to delete product."); }
    finally { setDeletingId(null); }
  };

  const unitOptions = editingId !== null && form.unitId && !units.some((u) => String(u.id) === form.unitId)
    ? [{ id: Number(form.unitId), unitName: products.find((p) => p.id === editingId)?.unitName + " (Inactive)", disabled: true }, ...units] : units;
  const typeOptions = editingId !== null && form.productTypeId && !types.some((t) => String(t.id) === form.productTypeId)
    ? [{ id: Number(form.productTypeId), typeName: products.find((p) => p.id === editingId)?.typeName + " (Inactive)", disabled: true }, ...types] : types;

  return (
    <div className="pm-page">
      <div className="pm-header">
        <div><h2>Product Master</h2><p>Manage products shared across all weighbridge sites.</p></div>
        <button className="pm-btn pm-secondary" onClick={loadData} disabled={loading}>Refresh</button>
      </div>
      {error && <div className="pm-alert pm-error" role="alert">{error}</div>}
      {success && <div className="pm-alert pm-success" role="status">{success}</div>}

      {isAdmin && <section className="pm-card">
        <h3>{editingId === null ? "Add Product" : "Edit Product"}</h3>
        <form onSubmit={handleSave}>
          <div className="pm-form-grid">
            <label>Product Code *<input maxLength={30} required placeholder="P003" value={form.productCode} onChange={(e) => setForm({ ...form, productCode: e.target.value })} /></label>
            <label>Product Name *<input maxLength={150} required placeholder="e.g. Cement" value={form.productName} onChange={(e) => setForm({ ...form, productName: e.target.value })} /></label>
            <label>Unit *<select required value={form.unitId} onChange={(e) => setForm({ ...form, unitId: e.target.value })}>
              <option value="">Select Unit</option>{unitOptions.map((u) => <option key={u.id} value={u.id} disabled={u.disabled}>{u.unitName} ({u.unitCode || ""})</option>)}
            </select></label>
            <label>Product Type *<select required value={form.productTypeId} onChange={(e) => setForm({ ...form, productTypeId: e.target.value })}>
              <option value="">Select Product Type</option>{typeOptions.map((t) => <option key={t.id} value={t.id} disabled={t.disabled}>{t.typeName}</option>)}
            </select></label>
            <label>Rate *<input type="number" min="0" step="0.01" required placeholder="0.00" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} /></label>
            <label>Status *<select value={form.statusId} onChange={(e) => setForm({ ...form, statusId: e.target.value })}>
              <option value="1">Active</option><option value="2">Inactive</option>
            </select></label>
          </div>
          <div className="pm-actions">
            <button className="pm-btn pm-primary" type="submit" disabled={saving || loading}>{saving ? "Saving..." : editingId === null ? "Add Product" : "Update Product"}</button>
            <button className="pm-btn pm-secondary" type="button" disabled={saving} onClick={resetForm}>Clear</button>
          </div>
        </form>
      </section>}

      <section className="pm-card">
        <div className="pm-list-heading"><h3>Product List</h3><span>{visibleProducts.length} Records</span></div>
        <div className="pm-filters">
          <input type="search" placeholder="Search code, name, unit, type..." value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search products" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status">
            <option value="ALL">All Statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option>
          </select>
        </div>
        <div className="pm-table-wrap"><table className="pm-table">
          <thead><tr><th>ID</th><th>Code</th><th>Product Name</th><th>Unit</th><th>Product Type</th><th>Rate</th><th>Status</th>{isAdmin && <th>Actions</th>}</tr></thead>
          <tbody>{loading ? <tr><td colSpan={isAdmin ? 8 : 7} className="pm-empty">Loading products...</td></tr>
            : visibleProducts.length === 0 ? <tr><td colSpan={isAdmin ? 8 : 7} className="pm-empty">No products found.</td></tr>
            : visibleProducts.map((p) => <tr key={p.id}>
              <td>{p.id}</td><td><strong>{p.productCode}</strong></td><td>{p.productName}</td>
              <td>{p.unitName}</td><td>{p.typeName}</td><td>{Number(p.rate).toFixed(2)}</td>
              <td><span className={`pm-status ${p.statusCode === "ACTIVE" ? "pm-active" : "pm-inactive"}`}>{p.statusName || p.statusCode}</span></td>
              {isAdmin && <td><div className="pm-row-actions">
                <button className="pm-btn pm-edit" type="button" onClick={() => handleEdit(p)}>Edit</button>
                <button className="pm-btn pm-delete" type="button" disabled={deletingId !== null} onClick={() => handleDelete(p)}>{deletingId === p.id ? "Deleting..." : "Delete"}</button>
              </div></td>}
            </tr>)}
          </tbody>
        </table></div>
      </section>
    </div>
  );
}
