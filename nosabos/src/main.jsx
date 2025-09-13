import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { ChakraProvider } from "@chakra-ui/react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useNavigate,
  useParams,
  useLocation,
} from "react-router-dom";

createRoot(document.getElementById("root")).render(
  <ChakraProvider>
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        {/* <Route path="/experiments" element={<RealtimeAgent />} /> */}
      </Routes>
    </Router>
  </ChakraProvider>
);
