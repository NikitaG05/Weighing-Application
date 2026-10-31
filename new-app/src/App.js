
import "./App.css";
import "./style/themes.css";

import ApplicationRout from "./router/ApplicationRout";
import { ThemeProvider } from "./context/ThemeContext";

function App() {
  return (
    <ThemeProvider>
      <div className="App">
        <ApplicationRout />
      </div>
    </ThemeProvider>
  );
}

export default App;
