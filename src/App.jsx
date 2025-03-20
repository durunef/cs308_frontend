import React from "react";
import ProductPage from "./components/ProductsPage/ProductsPage";
import WelcomeScreen from "./components/welcomeScreen/WelcomeScreen";
import mockData from "./data/mockData.json"; // Import mock data

function App() {
  return (
    <div className="app-container">
      <WelcomeScreen />
      <ProductPage products={mockData} /> {/* Pass products to ProductPage */}
    </div>
  );
}

export default App;
