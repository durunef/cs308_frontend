import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faTh, 
  faThList, 
  faSearch,
  faSortAmountDown,
  faSortAmountUp,
  faStar
} from "@fortawesome/free-solid-svg-icons";
import ProductCard from "../productCard/ProductCard";
import { getProductsByCategory } from "../../api/categoryService";
import "./CategoryPage.css";

function CategoryPage() {
  const { categoryId } = useParams();
  const [columns, setColumns] = useState(3);
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState({});
  const [sortOrder, setSortOrder] = useState("none");
  const [ratingSort, setRatingSort] = useState("none");
  const [filterValues, setFilterValues] = useState({
    searchQuery: ""
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load products from the category
  useEffect(() => {
    const fetchCategoryProducts = async () => {
      if (!categoryId) return;
      
      try {
        setIsLoading(true);
        const response = await getProductsByCategory(categoryId);
        
        if (response.status === 'success') {
          setCategory({
            name: response.data.category,
            description: response.data.description
          });
          setProducts(response.data.products || []);
        } else {
          throw new Error('Failed to fetch category products');
        }
      } catch (err) {
        console.error('Error fetching category products:', err);
        setError('Failed to load products. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategoryProducts();
  }, [categoryId]);

  // Filter products based on search query
  const filteredProducts = products.filter(product => {
    const searchQuery = filterValues.searchQuery.toLowerCase();
    return (
      !searchQuery ||
      product.name.toLowerCase().includes(searchQuery) ||
      product.description.toLowerCase().includes(searchQuery)
    );
  });

  // Sort products based on sort order
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortOrder !== "none") {
      if (sortOrder === "asc") return a.price - b.price;
      if (sortOrder === "desc") return b.price - a.price;
    }
    
    if (ratingSort !== "none") {
      if (ratingSort === "desc") return (b.rating || 0) - (a.rating || 0);
      if (ratingSort === "asc") return (a.rating || 0) - (b.rating || 0);
    }
    
    return 0;
  });

  const handleSearchChange = (e) => {
    setFilterValues({
      ...filterValues,
      searchQuery: e.target.value
    });
  };

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

  const handleGridViewChange = (cols) => {
    setColumns(cols);
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="products-page-container">
      <div className="category-header-section">
        <h1>{category.name || 'Category Products'}</h1>
        {category.description && <p>{category.description}</p>}
      </div>
      
      <div className="controls-container">
        <div className="view-controls">
          <button 
            className={`view-button ${columns === 2 ? 'active' : ''}`}
            onClick={() => handleGridViewChange(2)}
          >
            <FontAwesomeIcon icon={faThList} />
          </button>
          <button 
            className={`view-button ${columns === 3 ? 'active' : ''}`}
            onClick={() => handleGridViewChange(3)}
          >
            <FontAwesomeIcon icon={faTh} />
          </button>
          <button 
            className={`view-button ${columns === 4 ? 'active' : ''}`}
            onClick={() => handleGridViewChange(4)}
          >
            <FontAwesomeIcon icon={faTh} />
          </button>
        </div>
        
        <div className="search-sort-container">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search products..."
              value={filterValues.searchQuery}
              onChange={handleSearchChange}
            />
            <button className="search-button">
              <FontAwesomeIcon icon={faSearch} />
            </button>
          </div>
          
          <button 
            className={`sort-button ${sortOrder !== 'none' ? 'active' : ''}`}
            onClick={toggleSortOrder}
          >
            <FontAwesomeIcon 
              icon={sortOrder === 'asc' ? faSortAmountUp : faSortAmountDown} 
            />
            {sortOrder === 'none' && 'Sort by Price'}
            {sortOrder === 'asc' && 'Price: Low to High'}
            {sortOrder === 'desc' && 'Price: High to Low'}
          </button>
          
          <button 
            className={`sort-button ${ratingSort !== 'none' ? 'active' : ''}`}
            onClick={toggleRatingSort}
          >
            <FontAwesomeIcon icon={faStar} />
            {ratingSort === 'none' && 'Sort by Popularity'}
            {ratingSort === 'desc' && 'Rating: High to Low'}
            {ratingSort === 'asc' && 'Rating: Low to High'}
          </button>
        </div>
      </div>
      
      <div 
        className="products-grid" 
        style={{ 
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
        }}
      >
        {sortedProducts.length > 0 ? (
          sortedProducts.map(product => (
            <ProductCard key={product._id} product={product} />
          ))
        ) : (
          <div className="no-products-message">
            <p>No products found in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CategoryPage; 