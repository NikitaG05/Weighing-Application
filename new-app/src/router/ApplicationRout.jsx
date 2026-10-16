import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../components/Login";
import Home from "../components/Home";
import AdminDashboard from "../components/AdminDashboard";
import Register from "../components/Register";
import Report from "../components/Report";

function ApplicationRout() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} >
          <Route path="admindashboard" element={<AdminDashboard />} />
          <Route path="register" element={<Register />} />
          <Route path="report" element={<Report />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default ApplicationRout;