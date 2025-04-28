import React, { useState, useEffect } from "react";
import ProductCard from "../productCard/ProductCard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faTh, 
  faThList, 
  faSearch,
  faSortAmountDown,
  faSortAmountUp,
  faStar
} from "@fortawesome/free-solid-svg-icons";
import { getAllProducts } from "../../api/productService";
import { useLocation, useNavigate } from "react-router-dom";
import "./ProductsPage.css"; 
import axios from "axios";

function ProductsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [columns, setColumns] = useState(3); 
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [sortOrder, setSortOrder] = useState("none"); // "none", "asc", "desc"
  const [ratingSort, setRatingSort] = useState("none"); // "none", "asc", "desc"
  const [filterValues, setFilterValues] = useState({
    type: "",
    subtype: "",
    priceMin: "",
    priceMax: "",
    searchQuery: ""
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Read search query from URL when component mounts
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const searchQuery = queryParams.get('search');
    
    if (searchQuery) {
      setFilterValues(prev => ({
        ...prev,
        searchQuery
      }));
    }
  }, [location.search]);

  // Load products data from backend
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const response = await getAllProducts();
        
        if (response.status === 'success') {
          const products = response.data.products;
          console.log('Received products:', products); // Debug log
          
          // Fetch review counts for each product
          const productsWithReviewData = await Promise.all(
            products.map(async (product) => {
              try {
                // Try to fetch reviews for this product
                const reviewsResponse = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:3000/api'}/products/${product._id}/reviews`);
                
                if (reviewsResponse.data && reviewsResponse.data.status === 'success') {
                  let reviews = [];
                  
                  // Extract reviews based on the response structure
                  if (reviewsResponse.data.data && reviewsResponse.data.data.reviews) {
                    reviews = reviewsResponse.data.data.reviews;
                  } else if (Array.isArray(reviewsResponse.data.data)) {
                    reviews = reviewsResponse.data.data;
                  }
                  
                  // Filter only approved reviews
                  const approvedReviews = reviews.filter(review => review.approved === true);
                  
                  // Calculate average rating
                  let averageRating = 0;
                  if (approvedReviews.length > 0) {
                    const sum = approvedReviews.reduce((total, review) => total + review.rating, 0);
                    averageRating = sum / approvedReviews.length;
                  }
                  
                  return { 
                    ...product, 
                    reviews: approvedReviews,
                    averageRating,
                    reviewCount: approvedReviews.length
                  };
                }
              } catch (error) {
                console.warn(`Couldn't fetch reviews for product ${product._id}:`, error);
              }
              
              // Return product as is if we couldn't fetch reviews
              return product;
            })
          );
          
          setAllProducts(productsWithReviewData);
          setFilteredProducts(productsWithReviewData);
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
    
    // Apply price sorting
    if (sortOrder === "asc") {
      result.sort((a, b) => a.price - b.price);
    } else if (sortOrder === "desc") {
      result.sort((a, b) => b.price - a.price);
    }
    
    // Apply rating/popularity sorting
    if (ratingSort === "desc") {
      result.sort((a, b) => {
        // Try to sort by averageRating first
        if (a.averageRating !== undefined && b.averageRating !== undefined) {
          return b.averageRating - a.averageRating;
        }
        
        // Then try to sort by rating property
        if (a.rating !== undefined && b.rating !== undefined) {
          return b.rating - a.rating;
        }
        
        // Then try to sort by reviews count/length if available
        const aReviews = a.reviews ? a.reviews.length : 0;
        const bReviews = b.reviews ? b.reviews.length : 0;
        
        return bReviews - aReviews;
      });
    } else if (ratingSort === "asc") {
      result.sort((a, b) => {
        // Try to sort by averageRating first
        if (a.averageRating !== undefined && b.averageRating !== undefined) {
          return a.averageRating - b.averageRating;
        }
        
        // Then try to sort by rating property
        if (a.rating !== undefined && b.rating !== undefined) {
          return a.rating - b.rating;
        }
        
        // Then try to sort by reviews count/length if available
        const aReviews = a.reviews ? a.reviews.length : 0;
        const bReviews = b.reviews ? b.reviews.length : 0;
        
        return aReviews - bReviews;
      });
    }
    
    setFilteredProducts(result);
  }, [allProducts, filterValues, sortOrder, ratingSort]);

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
    
    // Update URL with search query parameter
    const queryParams = new URLSearchParams(location.search);
    if (value) {
      queryParams.set('search', value);
    } else {
      queryParams.delete('search');
    }
    navigate({ search: queryParams.toString() }, { replace: true });
  };

  // Toggle sorting order
  const toggleSortOrder = () => {
    if (sortOrder === "none") {
      setSortOrder("asc");
      setRatingSort("none"); // Reset rating sort when sorting by price
    } else if (sortOrder === "asc") {
      setSortOrder("desc");
    } else {
      setSortOrder("none");
    }
  };

  // Toggle rating sorting order
  const toggleRatingSort = () => {
    if (ratingSort === "none") {
      setRatingSort("desc"); // Start with highest rated first
      setSortOrder("none"); // Reset price sort when sorting by rating
    } else if (ratingSort === "desc") {
      setRatingSort("asc");
    } else {
      setRatingSort("none");
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
    setRatingSort("none");
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
              
              <button 
                className="sort-button"
                onClick={toggleRatingSort}
              >
                <FontAwesomeIcon icon={faStar} />
                <span className="button-text">
                  {ratingSort === "none" && "Sort by Popularity"}
                  {ratingSort === "desc" && "Rating: High to Low"}
                  {ratingSort === "asc" && "Rating: Low to High"}
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