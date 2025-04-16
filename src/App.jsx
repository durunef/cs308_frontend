import React from "react";
import { AuthProvider } from './context/AuthContext';
import ProductPage from "./components/ProductsPage/ProductsPage";
import WelcomeScreen from "./components/welcomeScreen/WelcomeScreen";
import mockData from "./data/mockData.json";

function App() {
  return (
    <AuthProvider>
      <div className="app-container">
        <WelcomeScreen />
        <ProductPage products={mockData} />
      </div>
    </AuthProvider>
  );
}

export default App;