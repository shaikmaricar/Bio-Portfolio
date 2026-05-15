import { createRoot } from "react-dom/client";
import App from "./graphrag-pipeline.jsx";

const container = document.getElementById("root");
if (container) {
  createRoot(container).render(<App />);
}
