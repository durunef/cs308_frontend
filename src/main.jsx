import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import "./theme.css";
import App from "./App.jsx";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import Navbar from "./components/navbar/navbar.jsx";
import ProductInfo from "./components/productInfo/ProductInfo";
import Profile from "./components/Profile/Profile";
import Cart from "./components/Cart/Cart"; 
import CategoryPage from "./components/categoryPage/CategoryPage";
import ProductForm from "./components/productForm/ProductForm";
import Checkout from "./components/Checkout/Checkout";
import OrderConfirmation from "./components/OrderConfirmation/OrderConfirmation";
import OrderHistory from "./components/OrderHistory/OrderHistory";
import RateProducts from "./components/RateProducts/RateProducts";
import ReviewApproval from "./components/ReviewApproval/ReviewApproval";
import ProtectedRoute from "./components/ProtectedRoute";

const root = createRoot(document.getElementById("root"));

root.render(
  <StrictMode>
    <Router>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <ToastContainer />
            <Navbar />
            <Routes>
              <Route path="/" element={<App />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/product/:productId" element={<ProductInfo />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/category/:categoryId" element={<CategoryPage />} />
              <Route path="/add-product" element={<ProtectedRoute><ProductForm /></ProtectedRoute>} />
              <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
              <Route path="/order-confirmation" element={<ProtectedRoute><OrderConfirmation /></ProtectedRoute>} />
              <Route path="/order-history" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
              <Route path="/rate-products" element={<ProtectedRoute><RateProducts /></ProtectedRoute>} />
              <Route path="/review-approval" element={<ProtectedRoute><ReviewApproval /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            </Routes>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  </StrictMode>
);