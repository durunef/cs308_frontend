import React from "react";
import { AuthProvider } from './context/AuthContext';
import ProductPage from "./components/productsPage/ProductsPage";
import WelcomeScreen from "./components/welcomeScreen/WelcomeScreen";

function App() {
  return (
    <AuthProvider>
      <div className="app-container">
        <WelcomeScreen />
        <ProductPage />
      </div>
    </AuthProvider>
  );
}

export default App;