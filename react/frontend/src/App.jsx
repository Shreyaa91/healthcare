import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/login";
import Signup from "./pages/signup";
import Consultation from "./pages/consultation"
import Dashboard from "./pages/dashboard";
import AppointmentPage from "./pages/appointment";
import BookAppointment from "./pages/book_appointment";
import MedicalRecords from "./pages/medicalrecords";
import ForgotPassword from "./pages/forgot_password";
import ResetPassword from "./pages/resetpassword";
import CartPage from "./pages/cart";
import { CartProvider } from './pages/cartcontext.jsx';
import MedicineOrderingScreen from "./pages/medicineordering.jsx";
import PaymentPage from "./pages/payment.jsx";
import ProfilePage from "./pages/profile.jsx";


function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Fetch user from localStorage when the app loads
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("user_role");

    if (token && role) {
      fetchUserDetails(token, role);
    }
  }, []);

  const fetchUserDetails = async (token, role) => {
    console.log(token)
    try {
      const response = await fetch("http://localhost:8000/user/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch user details");
      }

      const data = await response.json();
      console.log("DATA IN APP.JSX",data);
      setUser({ ...data, role }); // Store user details along with role
    } catch (error) {
      console.error("Error fetching user details:", error);
      setUser(null);
    }
  };
  return (
    <CartProvider>
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/consultation/:channel_name" element={<Consultation user={user}/>}/>
        <Route path="/dashboard" element={<Dashboard/>}/>
        <Route path="/appointment" element={<AppointmentPage user={user}/>}/>
        <Route path="/bookappointment" element={<BookAppointment user={user} />} />
        <Route path="/medicalrecords" element={<MedicalRecords userId={user?.id} user={user}/>}/>
        <Route path="/forgot_password" element={<ForgotPassword/>} />
        <Route path="/resetpassword" element={<ResetPassword/>} />
        <Route path="/cart" element={<CartPage/>} />  
        <Route path="/payment" element={<PaymentPage user={user}/>} />
        <Route path="/cartcontext" element={<ResetPassword/>} />  
         <Route path="/medicineordering" element={<MedicineOrderingScreen/>} />
         <Route path="/profile" element={<ProfilePage user={user}/>} />
      </Routes>
    </Router>
    </CartProvider>
  );
}

export default App;
