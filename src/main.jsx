import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import "./theme.css";
import App from "./App.jsx";
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";
import Navbar from "./components/navbar/navbar.jsx";
import ProductInfo from "./components/productInfo/ProductInfo";
import Profile from "./components/Profile/Profile";
import Wishlist from "./components/Wishlist/Wishlist";
import Cart from "./components/Cart/Cart"; 
import CategoryPage from "./components/categoryPage/CategoryPage";
import ProductForm from "./components/productForm/ProductForm";
import Checkout from "./components/Checkout/Checkout";
import OrderConfirmation from "./components/OrderConfirmation/OrderConfirmation";
import OrderHistory from "./components/OrderHistory/OrderHistory";
import RateProducts from "./components/RateProducts/RateProducts";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <CartProvider>
        <Router>
          <Navbar />
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/product/:productId" element={<ProductInfo />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
            <Route path="/order-history" element={<OrderHistory />} />
            <Route path="/rate-products/:orderId" element={<RateProducts />} />
            <Route path="/category/:categoryId" element={<CategoryPage />} />
            <Route path="/add-product" element={<ProductForm />} />
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  </StrictMode>
);