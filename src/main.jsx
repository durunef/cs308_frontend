import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from 'react-hot-toast'

import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./theme.css";

import App from "./App.jsx";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import Navbar from "./components/navbar/navbar.jsx";
import ProductInfo from "./components/productInfo/ProductInfo";
import Profile from "./components/Profile/Profile";
import Cart from "./components/Cart/Cart";
import CategoryPage from "./components/categoryPage/CategoryPage";
import Checkout from "./components/Checkout/Checkout";
import OrderConfirmation from "./components/OrderConfirmation/OrderConfirmation";
import OrderHistory from "./components/OrderHistory/OrderHistory";
import RateProducts from "./components/RateProducts/RateProducts";
import Wishlist from "./components/Wishlist/Wishlist";
import SalesManagerDashboard from "./components/salesmanager/salesmanager.jsx";
import Notifications from "./components/Notifications/Notifications";

import ProtectedRoute from "./components/ProtectedRoute";
import ManagerRoute from "./components/ManagerRoute";
import ManagerConsole from "./components/manager/ManagerConsole";

const root = createRoot(document.getElementById("root"));

root.render(
  <StrictMode>
    <Router>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <Toaster position="top-right" />
            <ToastContainer />
            <Navbar />
            <Routes>
              <Route path="/" element={<App />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/product/:productId" element={<ProductInfo />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/category/:categoryId" element={<CategoryPage />} />

              <Route
                path="/checkout"
                element={
                  <ProtectedRoute>
                    <Checkout />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/order-confirmation/:orderId"
                element={
                  <ProtectedRoute>
                    <OrderConfirmation />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/order-history"
                element={
                  <ProtectedRoute>
                    <OrderHistory />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/rate-products"
                element={
                  <ProtectedRoute>
                    <RateProducts />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                }
              />

              {/* Manager area */}
              <Route
                path="/manager/*"
                element={
                  <ManagerRoute>
                    <ManagerConsole />
                  </ManagerRoute>
                }
              />

              {/* Sales Manager Dashboard */}
              <Route
                path="/sales-manager"
                element={
                  <ProtectedRoute>
                    <SalesManagerDashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/wishlist"
                element={
                  <ProtectedRoute>
                    <Wishlist />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  </StrictMode>
);