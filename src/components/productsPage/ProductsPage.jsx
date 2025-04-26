import React, { useState, useEffect } from "react";
import ProductCard from "../productCard/ProductCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faTh, 
  faThList, 
  faSearch,
  faSortAmountDown,
  faSortAmountUp
} from "@fortawesome/free-solid-svg-icons";
import { getAllProducts } from "../../api/productService";
import "./ProductsPage.css"; 

function ProductsPage() {
  const [columns, setColumns] = useState(3); 
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [sortOrder, setSortOrder] = useState("none"); // "none", "asc", "desc"
  const [filterValues, setFilterValues] = useState({
    type: "",
    subtype: "",
    priceMin: "",
    priceMax: "",
    searchQuery: ""
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load products data from backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const response = await getAllProducts();
        
        if (response.status === 'success') {
          const products = response.data.products;
          console.log('Received products:', products); // Debug log
          setAllProducts(products);
          setFilteredProducts(products);
        } else {
          throw new Error('Failed to fetch products');
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Effect for filtering and sorting products
  useEffect(() => {
    let result = [...allProducts];
    
    // Apply filters
    if (filterValues.type) {
      result = result.filter(p => p.type === filterValues.type);
    }
    
    if (filterValues.subtype) {
      result = result.filter(p => p.subtype === filterValues.subtype);
    }
    
    if (filterValues.priceMin) {
      const min = parseFloat(filterValues.priceMin);
      result = result.filter(p => p.price >= min);
    }
    
    if (filterValues.priceMax) {
      const max = parseFloat(filterValues.priceMax);
      result = result.filter(p => p.price <= max);
    }
    
    if (filterValues.searchQuery) {
      const query = filterValues.searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.description.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    if (sortOrder === "asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortOrder === "desc") {
      result.sort((a, b) => b.price - a.price);
    }
    
    setFilteredProducts(result);
  }, [allProducts, filterValues, sortOrder]);

  // Handler for filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilterValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handler for search input
  const handleSearch = (e) => {
    const value = e.target.value;
    setFilterValues(prev => ({
      ...prev,
      searchQuery: value
    }));
  };

  // Toggle sorting order
  const toggleSortOrder = () => {
    if (sortOrder === "none") {
      setSortOrder("asc");
    } else if (sortOrder === "asc") {
      setSortOrder("desc");
    } else {
      setSortOrder("none");
    }
  };

  // Reset all filters
  const resetFilters = () => {
    setFilterValues({
      type: "",
      subtype: "",
      priceMin: "",
      priceMax: "",
      searchQuery: ""
    });
    setSortOrder("none");
  };

  // Set grid columns
  const setGridColumns = (num) => setColumns(num);

  // Get unique values for filter dropdowns
  const typeOptions = [...new Set(allProducts.map(p => p.type))];
  const subtypeOptions = [...new Set(allProducts.map(p => p.subtype))];

  // Debug log for products before rendering
  console.log('Products to render:', filteredProducts);

  if (isLoading) {
    return (
      <div className="product-page-container">
        <div className="loading-spinner"></div>
        <p>Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-page-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="product-page-container">
      <div className="main-content">
        {/* Sidebar filters */}
        <div className="sidebar">
          <div className="sidebar-filters">
            <h2>Filters</h2>
            
            <div className="filter-group">
              <label htmlFor="type">Product Type</label>
              <select 
                id="type" 
                name="type" 
                value={filterValues.type}
                onChange={handleFilterChange}
                className="filter-select"
              >
                <option value="">All Types</option>
                {typeOptions.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label htmlFor="subtype">Subtype</label>
              <select 
                id="subtype" 
                name="subtype" 
                value={filterValues.subtype}
                onChange={handleFilterChange}
                className="filter-select"
              >
                <option value="">All Subtypes</option>
                {subtypeOptions.map(subtype => (
                  <option key={subtype} value={subtype}>{subtype}</option>
                ))}
              </select>
            </div>
            
            <div className="filter-group">
              <label>Price Range</label>
              <div className="price-inputs">
                <input
                  type="number"
                  placeholder="Min"
                  name="priceMin"
                  value={filterValues.priceMin}
                  onChange={handleFilterChange}
                  className="price-input"
                />
                <span>to</span>
                <input
                  type="number"
                  placeholder="Max"
                  name="priceMax"
                  value={filterValues.priceMax}
                  onChange={handleFilterChange}
                  className="price-input"
                />
              </div>
            </div>
            
            <button className="reset-filters-button" onClick={resetFilters}>
              Reset All Filters
            </button>
          </div>
        </div>
        
        <div className="content-area">
          <h1>Our Products</h1>
          
          {/* Search and Controls */}
          <div className="product-controls">
            <div className="search-container">
              <input
                type="text"
                className="search-input"
                placeholder="Search products..."
                value={filterValues.searchQuery}
                onChange={handleSearch}
              />
              <button className="search-button pulse-effect">
                <FontAwesomeIcon icon={faSearch} />
              </button>
            </div>
            
            <div className="grid-controls">
              <button 
                className="sort-button"
                onClick={toggleSortOrder}
              >
                <FontAwesomeIcon 
                  icon={sortOrder === "desc" ? faSortAmountDown : faSortAmountUp} 
                />
                <span className="button-text">
                  {sortOrder === "none" && "Sort by Price"}
                  {sortOrder === "asc" && "Price: Low to High"}
                  {sortOrder === "desc" && "Price: High to Low"}
                </span>
              </button>
              
              <button onClick={() => setGridColumns(3)}>
                <FontAwesomeIcon icon={faTh} />
              </button>
              <button onClick={() => setGridColumns(4)}>
                <FontAwesomeIcon icon={faThList} />
              </button>
            </div>
          </div>
          
          {/* Results count */}
          <div className="results-count">
            {filteredProducts.length} products found
          </div>
          
          {/* Product Grid */}
          <div className="product-grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product, index) => {
                // Debug log for each product
                console.log('Rendering product:', product);
                return (
                  <ProductCard 
                    key={`${product._id || product.serialNumber || index}`} 
                    product={product} 
                  />
                );
              })
            ) : (
              <div className="no-results">
                <p>No products match your criteria</p>
                <button onClick={resetFilters} className="clear-filters-button">
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductsPage;