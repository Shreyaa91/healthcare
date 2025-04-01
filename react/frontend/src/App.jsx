import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/login";
import Signup from "./pages/signup";
import Consultation from "./pages/consultation"
import Dashboard from "./pages/dashboard";
import Appointment from "./pages/appointment";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/consultation" element={<Consultation/>}/>
        <Route path="/dashboard" element={<Dashboard/>}/>
        <Route path="/appointment" element={<Appointment/>}/>
      </Routes>
    </Router>
  );
}

export default App;
