
import { Eye, Pencil, Trash2 } from "lucide-react";
import "../style/ActionButtons.css";

function ActionButtons({
  onView,
  onEdit,
  onDelete,
  viewDisabled = false,
  editDisabled = false,
  deleteDisabled = false,
  disabled = false,
}) {
  return (
    <div className="common-action-buttons">

      {/* View */}
      {typeof onView === "function" && (
        <button
          type="button"
          className="common-action-icon action-view"
          onClick={onView}
          disabled={disabled || viewDisabled}
          title="View Details"
          aria-label="View Details"
        >
          <Eye size={18} strokeWidth={2} />
        </button>
      )}

      {/* Edit */}
      {typeof onEdit === "function" && (
        <button
          type="button"
          className="common-action-icon action-edit"
          onClick={onEdit}
          disabled={disabled || editDisabled}
          title="Edit"
          aria-label="Edit"
        >
          <Pencil size={18} strokeWidth={2} />
        </button>
      )}

      {/* Delete */}
      {typeof onDelete === "function" && (
        <button
          type="button"
          className="common-action-icon action-delete"
          onClick={onDelete}
          disabled={disabled || deleteDisabled}
          title="Delete"
          aria-label="Delete"
        >
          <Trash2 size={18} strokeWidth={2} />
        </button>
      )}

    </div>
  );
}

export default ActionButtons;
