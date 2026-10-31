
import { useTheme } from "../context/ThemeContext";
import "../style/ThemeSelector.css";

const themes = [
  { id: "ocean", name: "Ocean Blue", color: "#2563eb" },
  { id: "teal", name: "Navy & Teal", color: "#0d9488" },
  { id: "purple", name: "Royal Purple", color: "#7c3aed" },
  { id: "emerald", name: "Emerald Green", color: "#059669" },
  { id: "amber", name: "Slate & Amber", color: "#b45309" },
];

export default function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="theme-selector">
      <h3>Appearance Settings</h3>
      <p>Choose your preferred colour theme.</p>

      <div className="theme-options">
        {themes.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`theme-option ${
              theme === item.id ? "selected" : ""
            }`}
            onClick={() => setTheme(item.id)}
            aria-pressed={theme === item.id}
          >
            <span
              className="theme-swatch"
              style={{ backgroundColor: item.color }}
            />
            <span>{item.name}</span>
            {theme === item.id && <span aria-hidden="true">✓</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
