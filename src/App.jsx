import React from "react";
import ProductPage from "./components/ProductsPage/ProductsPage";
import WelcomeScreen from "./components/welcomeScreen/WelcomeScreen";

function App() {
  return (
    <div className="app-container">
      <WelcomeScreen/>
      <ProductPage />
    </div>
  );
}

export default App;
