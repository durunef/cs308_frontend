import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faStar,
  faStarHalfAlt,
  faCartPlus,
  faCheck,
  faXmark,
  faMinus,
  faPlus,
  faSpinner,
  faShield,
  faBuilding,
  faBarcode,
  faInfoCircle
} from "@fortawesome/free-solid-svg-icons";
import { faStar as farStar } from "@fortawesome/free-regular-svg-icons";
import axios from "../../api/axios";
import { API_URL } from "../../config";
import "./ProductInfo.css";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import { submitProductReview } from "../../api/orderService";

function ProductInfo() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user, isAuthenticated, token } = useAuth();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [userReview, setUserReview] = useState({ rating: 0, comment: "" });
  const [hasUserBought, setHasUserBought] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [usernames, setUsernames] = useState({});
  
  // Fetch product data and reviews
  useEffect(() => {
    const fetchProductAndReviews = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(`/api/products/${productId}`);
        const productData = response.data.data.product;
        
        setProduct(productData);

        // Fetch reviews if product exists
        try {
          const reviewsResponse = await axios.get(`/api/products/${productId}/reviews`);
          // Only show approved reviews
          const reviewsData = (reviewsResponse.data.data.reviews || []).filter(r => r.approved === true);
          setReviews(reviewsData);
        } catch (reviewError) {
          if (reviewError.response?.status === 404) {
            setReviews([]);
          } else {
            console.error("Error fetching reviews:", reviewError);
            setReviews([]);
          }
        }
      } catch (error) {
        console.error("Error response:", error.response);
        if (error.response?.status === 404) {
          setError(error.response?.data?.message || "Product not found or not available.");
        } else {
          setError(error.response?.data?.message || "Failed to load product details");
        }
        setProduct(null);
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProductAndReviews();
  }, [productId, reviewSubmitted]);
  
  // Fetch usernames for user IDs
  const fetchUsernames = async (userIds) => {
    if (!userIds.length) return;
    
    const usernameMap = {};
    
    try {
      for (const userId of userIds) {
        try {
          console.log(`Fetching username for user ID: ${userId}`);
          const response = await axios.get(`/api/user/${userId}`);
          
          if (response.data && response.data.status === 'success') {
            usernameMap[userId] = response.data.data.name || 'User';
            console.log(`Found username for ${userId}: ${usernameMap[userId]}`);
          } else {
            usernameMap[userId] = 'User';
          }
        } catch (err) {
          console.error(`Error fetching username for user ${userId}:`, err);
          usernameMap[userId] = 'User';
        }
      }
      
      console.log('All usernames fetched:', usernameMap);
      setUsernames(usernameMap);
    } catch (err) {
      console.error("Error in username fetching process:", err);
    }
  };
  
  // Check if user has bought this product
  useEffect(() => {
    const checkUserPurchase = async () => {
      if (!user) return;
      
      try {
        const response = await axios.get(`${API_URL}/user/${user.id}/purchased-products`);
        
        if (response.data.status === "success") {
          const hasBought = response.data.data.some(p => p.productId === productId);
          setHasUserBought(hasBought);
        }
      } catch (err) {
        console.error("Error checking purchase history:", err);
      }
    };
    
    checkUserPurchase();
  }, [user, productId]);
  
  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    // Get the stock value from either quantityInStock or quantity_in_stocks
    const stockValue = 
      typeof product.quantityInStock === 'number' ? product.quantityInStock : 
      typeof product.quantity_in_stocks === 'number' ? product.quantity_in_stocks : 0;
    
    if (newQuantity >= 1 && newQuantity <= Math.max(stockValue, 1)) {
      setQuantity(newQuantity);
    }
  };
  
  const handleAddToCart = async () => {
    // Check both possible stock field names
    const inStock = 
      (typeof product.quantityInStock === 'number' && product.quantityInStock > 0) || 
      (typeof product.quantity_in_stocks === 'number' && product.quantity_in_stocks > 0);
    
    if (!product || !inStock) return;
    
    setAddingToCart(true);
    try {
      await addToCart(productId, quantity);
      // Show success notification or feedback here
    } catch (err) {
      console.error("Failed to add to cart:", err);
      // Show error notification
    } finally {
      setAddingToCart(false);
    }
  };
  
  const handleReviewChange = (e) => {
    const { name, value } = e.target;
    setUserReview(prev => ({ ...prev, [name]: value }));
  };
  
  const handleRatingSelect = (rating) => {
    setUserReview(prev => ({ ...prev, rating }));
  };
  
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    setReviewSubmitting(true);
    try {
      const response = await submitProductReview(productId, userReview.rating, userReview.comment);
      
      if (response.status === "success") {
        // Show success message
        toast.success("Your review has been submitted successfully!");
        
        // If the review is directly approved, add it to the list
        if (response.data && response.data.approved) {
          setReviews([...reviews, response.data]);
        } else {
          // Otherwise inform user it's pending approval
          toast.info("Your review will be visible after approval.");
        }
        
        // Reset the review form
        setUserReview({ rating: 0, comment: "" });
        // Trigger review refresh
        setReviewSubmitted(prev => !prev);
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      toast.error("Failed to submit review. Please try again.");
    } finally {
      setReviewSubmitting(false);
    }
  };
  
  // Calculate average rating
  const calculateAverageRating = () => {
    if (!reviews.length) return 0;
    
    const sum = reviews.reduce((total, review) => total + review.rating, 0);
    return (sum / reviews.length).toFixed(1);
  };
  
  // Render star rating
  const renderStarRating = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<FontAwesomeIcon key={i} icon={faStar} className="star filled" />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<FontAwesomeIcon key={i} icon={faStarHalfAlt} className="star half" />);
      } else {
        stars.push(<FontAwesomeIcon key={i} icon={farStar} className="star empty" />);
      }
    }
    
    return stars;
  };
  
  // Helper function to generate a random commenter name with just asterisks
  const generateRandomCommenterName = () => {
    // Generate a random number of asterisks between 5 and 12
    const numAsterisks = Math.floor(Math.random() * 8) + 5;
    return '*'.repeat(numAsterisks);
  };
  
  if (loading) {
    return (
      <div className="product-info-loading">
        <FontAwesomeIcon icon={faSpinner} spin />
        <p>Loading product details...</p>
      </div>
    );
  }
  
  if (error) {
    return <div className="product-info-error">{error}</div>;
  }
  
  if (!product) {
    return <div className="product-info-error">Product not found</div>;
  }
  
  // Ensure product has all required fields
  const productWithDefaults = {
    name: product.name || "Unnamed Product",
    model: product.model || "Not specified",
    serial_number: product.serialNumber || product.serial_number || "Not specified",
    distributor: product.distributorInfo || product.distributor || "Not specified",
    warranty: product.warrantyStatus || product.warranty || "Not specified",
    price: product.price || 0,
    discount_price: product.discountPrice || product.discount_price,
    quantity_in_stocks: typeof product.quantityInStock === 'number' ? product.quantityInStock : 
                       (typeof product.quantity_in_stocks === 'number' ? product.quantity_in_stocks : 0),
    description: product.description || "No description available",
    short_description: product.shortDescription || product.short_description || 
                      (product.description ? product.description.substring(0, 150) + "..." : ""),
    images: product.images || (product.image ? [product.image] : []),
    category: product.category || { name: "Uncategorized" },
    specifications: product.specifications || {},
    type: product.type || "Not specified",
    subtype: product.subtype || "Not specified",
    currency: product.currency || "USD"
  };

  // Check the stock status correctly
  const quantityInStock = 
    typeof product.quantityInStock === 'number' ? product.quantityInStock : 
    typeof product.quantity_in_stocks === 'number' ? product.quantity_in_stocks : 0;

  console.log('Stock check:', {
    quantityInStock: product.quantityInStock,
    quantity_in_stocks: product.quantity_in_stocks, 
    calculated: quantityInStock
  });

  const isInStock = quantityInStock > 0;

  const averageRating = calculateAverageRating();

  return (
    <div className="product-info-container">
      {/* Top Section: Product Main Display */}
      <div className="product-main-display">
        {/* Left Side: Product Image Carousel */}
        <div className="product-image-section">
          <div className="product-main-image">
            <img 
              src={productWithDefaults.images && productWithDefaults.images.length > 0 
                ? `${API_URL}${productWithDefaults.images[selectedImage]}` 
                : "https://via.placeholder.com/600x400?text=No+Image+Available"} 
              alt={productWithDefaults.name} 
            />
          </div>
          
          {productWithDefaults.images && productWithDefaults.images.length > 1 && (
            <div className="product-thumbnails">
              {productWithDefaults.images.map((image, index) => (
                <img 
                  key={index}
                  src={`${API_URL}${image}`}
                  alt={`${productWithDefaults.name} - view ${index+1}`}
                  className={selectedImage === index ? "active" : ""}
                  onClick={() => setSelectedImage(index)}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Right Side: Product Details */}
        <div className="product-details-section">
          <h1 className="product-title">{productWithDefaults.name}</h1>
          
          <div className="product-identifiers">
            <div className="product-model">
              <FontAwesomeIcon icon={faBarcode} />
              <span><strong>Model:</strong> {productWithDefaults.model}</span>
            </div>
            <div className="product-serial">
              <FontAwesomeIcon icon={faInfoCircle} />
              <span><strong>Serial:</strong> {productWithDefaults.serial_number}</span>
            </div>
          </div>
          
          <div className="product-distributor">
            <FontAwesomeIcon icon={faBuilding} />
            <span><strong>Distributor:</strong> {productWithDefaults.distributor}</span>
          </div>
          
          <div className="product-warranty">
            <FontAwesomeIcon icon={faShield} />
            <span><strong>Warranty:</strong> {productWithDefaults.warranty}</span>
          </div>

          <div className="product-type-info">
            <span><strong>Type:</strong> {productWithDefaults.type} - {productWithDefaults.subtype}</span>
          </div>
          
          <div className="product-price-section">
            {productWithDefaults.discount_price !== undefined && productWithDefaults.discount_price < productWithDefaults.price ? (
              <>
                <span className="product-original-price">${productWithDefaults.price.toFixed(2)}</span>
                <span className="product-price">${productWithDefaults.discount_price.toFixed(2)}</span>
              </>
            ) : (
              <span className="product-price">${productWithDefaults.price.toFixed(2)} {productWithDefaults.currency}</span>
            )}
          </div>
          
          <div className={`product-stock ${isInStock ? 'in-stock' : 'out-of-stock'}`}>
            <FontAwesomeIcon icon={isInStock ? faCheck : faXmark} />
            <span>{isInStock ? `In Stock (${quantityInStock})` : "Out of Stock"}</span>
          </div>
          
          <div className="product-short-description">
            {productWithDefaults.short_description}
          </div>
          
          <div className="product-actions">
            <div className="quantity-selector">
              <button 
                className="quantity-btn"
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1 || !isInStock}
              >
                <FontAwesomeIcon icon={faMinus} />
              </button>
              <span className="quantity-value">{quantity}</span>
              <button 
                className="quantity-btn"
                onClick={() => handleQuantityChange(1)}
                disabled={quantity >= productWithDefaults.quantity_in_stocks || !isInStock}
              >
                <FontAwesomeIcon icon={faPlus} />
              </button>
            </div>
            
            <button 
              className="add-to-cart-btn"
              onClick={handleAddToCart}
              disabled={!isInStock || addingToCart}
            >
              {addingToCart ? (
                <FontAwesomeIcon icon={faSpinner} spin />
              ) : (
                <FontAwesomeIcon icon={faCartPlus} />
              )}
              {addingToCart ? "Adding..." : "Add to Cart"}
            </button>
          </div>
        </div>
      </div>
      
      {/* Middle Section: Full Product Description */}
      <div className="product-full-description">
        <h2>About This Product</h2>
        <div className="product-description">
          {productWithDefaults.description}
        </div>
        
        <h3>Product Specifications</h3>
        <table className="product-specs-table">
          <tbody>
            <tr>
              <td>Model</td>
              <td>{productWithDefaults.model}</td>
            </tr>
            <tr>
              <td>Serial Number</td>
              <td>{productWithDefaults.serial_number}</td>
            </tr>
            <tr>
              <td>Warranty Status</td>
              <td>{productWithDefaults.warranty}</td>
            </tr>
            <tr>
              <td>Distributor</td>
              <td>{productWithDefaults.distributor}</td>
            </tr>
            <tr>
              <td>Type</td>
              <td>{productWithDefaults.type}</td>
            </tr>
            <tr>
              <td>Subtype</td>
              <td>{productWithDefaults.subtype}</td>
            </tr>
            <tr>
              <td>In Stock</td>
              <td>{quantityInStock} units</td>
            </tr>
            <tr>
              <td>Currency</td>
              <td>{productWithDefaults.currency}</td>
            </tr>
            {Object.entries(productWithDefaults.specifications).map(([key, value]) => (
              <tr key={key}>
                <td>{key}</td>
                <td>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Bottom Section: Reviews & Ratings */}
      <div className="product-reviews-section">
        <h2>Customer Reviews</h2>
        
        <div className="reviews-summary">
          <div className="average-rating">
            <div className="rating-stars">{renderStarRating(averageRating)}</div>
            <span className="rating-value">{averageRating}/5</span>
            <span className="reviews-count">Based on {reviews.length} reviews</span>
          </div>
          
          <div className="rating-breakdown">
            {[5, 4, 3, 2, 1].map(stars => {
              const count = reviews.filter(review => Math.floor(review.rating) === stars).length;
              const percentage = reviews.length ? (count / reviews.length) * 100 : 0;
              
              return (
                <div key={stars} className="rating-bar">
                  <span className="rating-label">{stars} stars</span>
                  <div className="rating-bar-bg">
                    <div 
                      className="rating-bar-fill" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <span className="rating-count">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
        
        {hasUserBought && (
          <div className="review-form-container">
            <h3>Write a Review</h3>
            <form onSubmit={handleReviewSubmit} className="review-form">
              <div className="rating-selector">
                <span>Your Rating:</span>
                <div className="rating-stars-input">
                  {[1, 2, 3, 4, 5].map(rating => (
                    <FontAwesomeIcon
                      key={rating}
                      icon={rating <= userReview.rating ? faStar : farStar}
                      className={`star ${rating <= userReview.rating ? 'filled' : 'empty'}`}
                      onClick={() => handleRatingSelect(rating)}
                    />
                  ))}
                </div>
              </div>
              
              <div className="review-comment">
                <label htmlFor="comment">Your Review:</label>
                <textarea
                  id="comment"
                  name="comment"
                  value={userReview.comment}
                  onChange={handleReviewChange}
                  placeholder="Share your thoughts about this product..."
                  required
                ></textarea>
              </div>
              
              <button 
                type="submit" 
                className="submit-review-btn"
                disabled={userReview.rating === 0 || !userReview.comment || reviewSubmitting}
              >
                {reviewSubmitting ? (
                  <><FontAwesomeIcon icon={faSpinner} spin /> Submitting...</>
                ) : (
                  "Submit Review"
                )}
              </button>
            </form>
          </div>
        )}
        
        <div className="customer-reviews-list">
          {reviews.length === 0 ? (
            <div className="no-reviews">
              <p>This product has no reviews yet. Be the first to leave a review!</p>
            </div>
          ) : (
            reviews.map(review => (
              <div key={review._id} className="review-item">
                <div className="review-header">
                  <div className="reviewer-info">
                    <span className="reviewer-name">
                      {generateRandomCommenterName()}
                    </span>
                    {review.verified_purchase && (
                      <span className="verified-badge">
                        <FontAwesomeIcon icon={faCheck} /> Verified Purchase
                      </span>
                    )}
                  </div>
                  <div className="review-rating">
                    {renderStarRating(review.rating)}
                  </div>
                </div>
                <div className="review-content">
                  <p>{review.comment}</p>
                </div>
                <div className="review-date">
                  {new Date(review.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductInfo;
