import React, { useState, useEffect } from "react";
import ProductCard from "../productCard/ProductCard";
import Sidebar from "../sidebar/Sidebar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTh, faThList, faFilter } from "@fortawesome/free-solid-svg-icons";
import "./ProductsPage.css"; 

function ProductsPage() {
  const [columns, setColumns] = useState(3); 
  const [products, setProducts] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    import("../../data/mockData.json")
      .then((data) => setProducts(data.default || data))
      .catch((error) => console.error("Error loading mock data:", error));
  }, []);

  const setGridColumns = (num) => setColumns(num);

  return (
    <div className="product-page-container">
      <div className="main-content">
        <Sidebar className="sidebar" />
        <div className="content-area">
          <h1>Our Products</h1>
          <div className="grid-controls">
            <button className="mobile-only" onClick={() => setShowFilters(!showFilters)}>
              <FontAwesomeIcon icon={faFilter} />
            </button>
            <button className="desktop-only" onClick={() => setGridColumns(3)}>
              <FontAwesomeIcon icon={faTh} />
            </button>
            <button className="desktop-only" onClick={() => setGridColumns(4)}>
              <FontAwesomeIcon icon={faThList} />
            </button>
          </div>
          {showFilters && (
            <Sidebar className="sidebar" />
          )}
          <div className="product-grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.isArray(products) && products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductsPage;
