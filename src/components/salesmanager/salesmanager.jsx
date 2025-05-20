import React, { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartLine,
  faTag,
  faFileInvoice,
  faUndoAlt,
  faBox,
  faPercent,
  faDownload,
  faCheck,
  faTimes,
  faCalendarAlt,
  faSpinner,
  faUser,
  faExclamationTriangle
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import axios from "axios";
import "./salesmanager.css";

// Define the API base URL - adjust this based on your backend setup
// The "/api" prefix must match how your backend routes are mounted
const API_URL = "http://localhost:3000/api";

// Add a custom axios instance with interceptors for debugging
const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add request interceptor for debugging
axiosInstance.interceptors.request.use(
  config => {
    console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
    console.log("Request data:", config.data);
    return config;
  },
  error => {
    console.error("API Request Error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
axiosInstance.interceptors.response.use(
  response => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  error => {
    console.error("API Response Error:", error.response || error);
    return Promise.reject(error);
  }
);

function SalesManagerPanel() {
  console.log("SalesManagerPanel rendering");
  
  // Get auth context
  const { isAuthenticated, user, token } = useAuth();
  
  // States for different functionalities
  const [unpublishedProducts, setUnpublishedProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [price, setPrice] = useState("");
  const [discountProduct, setDiscountProduct] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [startDate, setStartDate] = useState("2024-01-01");
  const [endDate, setEndDate] = useState("2027-01-01");
  const [invoices, setInvoices] = useState([]);
  const [refundRequests, setRefundRequests] = useState([]);
  const [alertMessage, setAlertMessage] = useState({ show: false, text: "", type: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [salesData, setSalesData] = useState({
    labels: [],
    revenue: [],
    profit: []
  });
  
  // Setup axios with auth header
  useEffect(() => {
    if (token) {
      axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log("Authorization token set in axios", token.substring(0, 15) + "...");
    }
    return () => {
      delete axiosInstance.defaults.headers.common['Authorization'];
    };
  }, [token]);
  
  // Fetch data on component mount
  useEffect(() => {
    console.log("SalesManagerPanel useEffect is running");
    
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    
    const fetchAllData = async () => {
      try {
        setIsLoading(true);
        
        // Load each data type separately to handle individual failures
        try {
          await fetchAllProducts();
          console.log("Products fetched successfully");
        } catch (error) {
          console.error("Error fetching products:", error);
          showAlert("Failed to fetch products.", "danger");
        }
        
        try {
          await fetchUnpublishedProducts();
          console.log("Unpublished products fetched successfully");
        } catch (error) {
          console.error("Error fetching unpublished products:", error);
          showAlert("Failed to fetch unpublished products.", "danger");
        }
        
        try {
          // For refund requests, we continue to use mock data
          await fetchRefundRequests();
          console.log("Mock refund requests loaded successfully");
        } catch (error) {
          console.error("Error loading refund request mock data:", error);
          showAlert("Failed to load refund request data.", "danger");
        }
        
        try {
          await fetchInvoices();
          console.log("Invoices fetched successfully");
        } catch (error) {
          console.error("Error fetching invoices:", error);
          showAlert("Failed to fetch invoices.", "danger");
        }
        
        try {
          await fetchSalesData();
          console.log("Sales data fetched successfully");
        } catch (error) {
          console.error("Error fetching sales data:", error);
          showAlert("Failed to fetch sales data.", "danger");
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error in initial data loading:", error);
        setHasError(true);
        setErrorMessage("Failed to load data. Please try refreshing the page.");
        showAlert("Failed to load data", "danger");
        setIsLoading(false);
      }
    };
    
    fetchAllData();
  }, [isAuthenticated]);

  // Get sample data for refund requests only
  const getSampleRefundRequests = () => {
    return [
      { _id: 'r1', order: 'ord123456789', productName: 'Espresso Machine', amount: 599.99, reason: 'Defective product' },
      { _id: 'r2', order: 'ord987654321', productName: 'Coffee Grinder', amount: 129.99, reason: 'Wrong item shipped' }
    ];
  };

  // Fetch all products from the backend
  const fetchAllProducts = async () => {
    try {
      console.log("Fetching all products");
      const response = await axiosInstance.get("/products");
      
      // Handle different possible response structures
      let productsData;
      if (response.data && response.data.data && response.data.data.products) {
        productsData = response.data.data.products;
      } else if (response.data && response.data.data) {
        productsData = response.data.data;
      } else if (Array.isArray(response.data)) {
        productsData = response.data;
      } else {
        throw new Error("Unexpected data structure");
      }
      
      if (Array.isArray(productsData)) {
        console.log("Products fetched successfully:", productsData.length);
        setAllProducts(productsData);
        return productsData;
      } else {
        console.error("Unexpected product data structure:", typeof productsData, productsData);
        throw new Error("Unexpected data structure");
      }
    } catch (error) {
      console.error("Error fetching all products:", error);
      throw error;
    }
  };

  // Filter products without prices from the already fetched products list
  const fetchUnpublishedProducts = async () => {
    try {
      console.log("Fetching unpublished products");
      
      // Use the products already fetched to avoid duplicate requests
      const products = allProducts.length > 0 
        ? allProducts 
        : await fetchAllProducts();
      
      if (!Array.isArray(products)) {
        throw new Error("Products data is not an array");
      }
      
      // Filter products without a price or with price set to 0
      const unpublished = products.filter(p => !p.price || p.price === 0);
      console.log("Unpublished products:", unpublished);
      setUnpublishedProducts(unpublished);
    } catch (error) {
      console.error("Error fetching unpublished products:", error);
      throw error;
    }
  };

  // For refund requests, we'll use mock data as per requirements
  const fetchRefundRequests = async () => {
    try {
      console.log("Using mock data for refund requests (as specified)");
      // Using sample data as specified
      const mockRefundRequests = getSampleRefundRequests();
      setRefundRequests(mockRefundRequests);
    } catch (error) {
      console.error("Error with mock refund data:", error);
      setRefundRequests([]);
    }
  };

  // Fetch invoices with date filtering from backend
  const fetchInvoices = async () => {
    try {
      console.log(`Fetching invoices from ${startDate} to ${endDate}`);
      
      const response = await axiosInstance.get(`/sales/invoices?start=${startDate}&end=${endDate}`);
      
      let invoicesData;
      if (response.data && response.data.data && response.data.data.invoices) {
        invoicesData = response.data.data.invoices;
      } else if (response.data && response.data.data) {
        invoicesData = response.data.data;
      } else if (Array.isArray(response.data)) {
        invoicesData = response.data;
      } else {
        invoicesData = [];
      }
      
      console.log("Invoices fetched successfully:", invoicesData);
      setInvoices(invoicesData);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      throw error;
    }
  };

  // Fetch sales data for charts
  const fetchSalesData = async () => {
    try {
      console.log(`Fetching sales data from ${startDate} to ${endDate}`);
      
      // Initialize with empty data
      let labels = [];
      let revenue = [];
      let profit = [];
      
      // Get revenue data from API
      try {
        const revenueResponse = await axiosInstance.get(`/sales/reports/revenue?start=${startDate}&end=${endDate}`);
        console.log("Revenue response:", revenueResponse.data);
        
        if (revenueResponse.data && revenueResponse.data.data && revenueResponse.data.data.report) {
          const revenueData = revenueResponse.data.data.report;
          
          // Update labels and revenue data
          labels = revenueData.map(item => {
            const date = new Date(item.date);
            return date.toLocaleString('default', { month: 'short' });
          });
          
          revenue = revenueData.map(item => item.revenue);
        }
      } catch (revenueError) {
        console.error("Error fetching revenue data:", revenueError);
        throw revenueError;
      }
      
      // Get profit data from API
      try {
        const profitResponse = await axiosInstance.get(`/sales/reports/profit?start=${startDate}&end=${endDate}`);
        console.log("Profit response:", profitResponse.data);
        
        if (profitResponse.data && profitResponse.data.data && profitResponse.data.data.report) {
          const profitData = profitResponse.data.data.report;
          
          // Update profit data
          profit = profitData.map(item => item.profit);
        }
      } catch (profitError) {
        console.error("Error fetching profit data:", profitError);
        throw profitError;
      }
      
      // Update state with whatever data we have
      setSalesData({
        labels,
        revenue,
        profit
      });
    } catch (error) {
      console.error("Error fetching sales data:", error);
      throw error;
    }
  };

  // Handle setting price for a product
  const handleSetPrice = async (e) => {
    e.preventDefault();
    
    if (!selectedProduct || !price || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
      showAlert("Please select a product and enter a valid price", "danger");
      return;
    }

    try {
      console.log(`Setting price ${price} for product ${selectedProduct}`);
      
      const response = await axiosInstance.patch(`/sales/price/${selectedProduct}`, {
        price: parseFloat(price)
      });
      
      console.log("Price set successfully:", response.data);
      showAlert("Price set successfully!", "success");
      await fetchAllProducts(); // Refresh products list
      await fetchUnpublishedProducts(); // Refresh unpublished products list
      
      // Reset form
      setSelectedProduct("");
      setPrice("");
    } catch (error) {
      console.error("Error setting price:", error);
      showAlert(`Failed to set price: ${error.response?.data?.message || error.message}`, "danger");
    }
  };

  // Handle setting discount for a product
  const handleSetDiscount = async (e) => {
    e.preventDefault();
    
    if (!discountProduct || !discountPercent || 
        isNaN(parseFloat(discountPercent)) || 
        parseFloat(discountPercent) < 0 || 
        parseFloat(discountPercent) > 100) {
      showAlert("Please select a product and enter a valid discount percentage (0-100)", "danger");
      return;
    }

    try {
      const discountValue = parseFloat(discountPercent);
      console.log(`Setting discount ${discountValue}% for product ${discountProduct}`);
      
      // Find the current product to get its original price
      const product = allProducts.find(p => p._id === discountProduct);
      if (!product || !product.price) {
        showAlert("Product price information not available", "danger");
        return;
      }
      
      // Calculate the discounted price instead of sending percentage
      // This fixes the 400 error by matching what the API expects
      const originalPrice = product.price;
      const discountAmount = (originalPrice * discountValue) / 100;
      const discountedPrice = originalPrice - discountAmount;
      
      console.log(`Original price: ${originalPrice}, Discount: ${discountValue}%, New price: ${discountedPrice}`);
      
      // Send the new discounted price to the API instead of percentage
      const response = await axiosInstance.patch(`/sales/price/${discountProduct}`, {
        price: Number(discountedPrice.toFixed(2)) // Round to 2 decimal places and convert to number
      });
      
      console.log("Discount response:", response.data);
      showAlert(`Discount of ${discountValue}% applied successfully!`, "success");
      await fetchAllProducts(); // Refresh products list
      
      // Reset form
      setDiscountProduct("");
      setDiscountPercent("");
    } catch (error) {
      console.error("Error setting discount:", error);
      console.error("Error response:", error.response?.data);
      
      // More detailed error message
      let errorMsg = "Failed to apply discount";
      if (error.response?.data?.message) {
        errorMsg += `: ${error.response.data.message}`;
      } else if (error.message) {
        errorMsg += `: ${error.message}`;
      }
      
      showAlert(errorMsg, "danger");
    }
  };

  // Handle authorizing a refund (using mock data)
  const handleAuthorizeRefund = async (refundId) => {
    try {
      console.log(`Authorizing refund ${refundId}`);
      
      // Since we're using mock data for refunds (as specified)
      // Simply remove the authorized refund from the list
      setRefundRequests(prev => prev.filter(refund => refund._id !== refundId));
      showAlert("Refund authorized successfully!", "success");
    } catch (error) {
      console.error("Error authorizing refund:", error);
      showAlert("Failed to authorize refund", "danger");
    }
  };

  // Handle rejecting a refund (using mock data)
  const handleRejectRefund = async (refundId) => {
    try {
      console.log(`Rejecting refund ${refundId}`);
      
      // Since we're using mock data for refunds (as specified)
      // Simply remove the rejected refund from the list
      setRefundRequests(prev => prev.filter(refund => refund._id !== refundId));
      showAlert("Refund rejected successfully!", "success");
    } catch (error) {
      console.error("Error rejecting refund:", error);
      showAlert("Failed to reject refund", "danger");
    }
  };

  // Download invoice function
  const downloadInvoice = async (invoiceId) => {
    try {
      console.log(`Downloading invoice ${invoiceId}`);
      
      const response = await axiosInstance.get(`/sales/invoices/${invoiceId}/download`, {
        responseType: 'blob'
      });
      
      // Create a download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoiceId}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showAlert("Invoice downloaded successfully", "success");
    } catch (error) {
      console.error("Error downloading invoice:", error);
      showAlert("Failed to download invoice", "danger");
    }
  };

  // Handle date range changes
  const handleDateChange = (e, setter) => {
    setter(e.target.value);
  };

  // Apply date filter
  const applyDateFilter = async () => {
    console.log(`Applying date filter: ${startDate} to ${endDate}`);
    try {
      await Promise.all([
        fetchInvoices(),
        fetchSalesData()
      ]);
      showAlert("Date filter applied", "success");
    } catch (error) {
      showAlert("Failed to apply date filter", "danger");
    }
  };

  // Reset date filter
  const resetDateFilter = () => {
    setStartDate("2024-01-01");
    setEndDate("2027-01-01");
    
    // Wait for state update to complete
    setTimeout(async () => {
      try {
        await Promise.all([
          fetchInvoices(),
          fetchSalesData()
        ]);
        showAlert("Date filter reset", "success");
      } catch (error) {
        showAlert("Failed to reset date filter", "danger");
      }
    }, 0);
  };

  // Show alert message
  const showAlert = (text, type) => {
    setAlertMessage({ show: true, text, type });
    setTimeout(() => {
      setAlertMessage({ show: false, text: "", type: "" });
    }, 5000);
  };
  
  // Function to check if user has sales access
  const hasSalesAccess = () => {
    // Allow access if user has 'sales-manager' role OR has an email with '@sales'
    return user && (
      user.role === 'sales-manager' || 
      (user.email && user.email.includes('@sales'))
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="sales-panel-container loading-container">
        <div className="loading-spinner">
          <FontAwesomeIcon icon={faSpinner} spin />
          <span>Loading Sales Manager Panel...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (hasError) {
    return (
      <div className="sales-panel-container">
        <div className="error-state">
          <FontAwesomeIcon icon={faExclamationTriangle} />
          <p>{errorMessage}</p>
        </div>
      </div>
    );
  }

  // Authentication check
  if (!isAuthenticated) {
    return (
      <div className="sales-panel-container auth-required">
        <div className="auth-message">
          <FontAwesomeIcon icon={faUser} />
          <h2>Login Required</h2>
          <p>Please login to access the Sales Manager Panel.</p>
          <Link to="/login" className="auth-button">Login</Link>
        </div>
      </div>
    );
  }

  // Check for sales access - updated to allow users with '@sales' in their email
  if (!hasSalesAccess()) {
    return (
      <div className="sales-panel-container auth-required">
        <div className="auth-message">
          <FontAwesomeIcon icon={faExclamationTriangle} />
          <h2>Access Denied</h2>
          <p>You do not have permission to access the Sales Manager Panel.</p>
          <Link to="/" className="auth-button">Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="sales-panel-container">
      <h1 className="profile-heading">
        <FontAwesomeIcon icon={faChartLine} className="coffee-icon" /> 
        Sales Manager Panel
      </h1>
      
      {/* Alert message */}
      {alertMessage.show && (
        <div className={`alert alert-${alertMessage.type}`}>
          {alertMessage.text}
        </div>
      )}
      
      {/* Invoices with Integrated Date Filter */}
      <div className="invoices-container">
        <div className="card">
          <div className="card-header">
            <h2>
              <FontAwesomeIcon icon={faFileInvoice} className="me-2" /> 
              Invoices
            </h2>
          </div>
          <div className="card-body">
            {invoices.length === 0 ? (
              <p className="text-center">No invoices found in the selected date range</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(invoice => (
                    <tr key={invoice.orderId || invoice._id}>
                      <td>{(invoice.orderId || invoice._id).substring(0, 8)}...</td>
                      <td>{new Date(invoice.createdAt).toLocaleDateString()}</td>
                      <td>${invoice.total?.toFixed(2) || '0.00'}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => downloadInvoice(invoice.orderId || invoice._id)}
                        >
                          <FontAwesomeIcon icon={faDownload} /> Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        
        {/* Date Range Filter (Connected to Invoices) */}
        <div className="date-filter-container">
          <div className="date-range-control">
            <div className="date-inputs">
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={startDate}
                  onChange={(e) => handleDateChange(e, setStartDate)}
                />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={endDate}
                  onChange={(e) => handleDateChange(e, setEndDate)}
                />
              </div>
            </div>
            <div className="button-group">
              <button className="btn btn-primary" onClick={applyDateFilter}>
                Apply
              </button>
              <button className="btn btn-secondary" onClick={resetDateFilter}>
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Product Management Section */}
      <div className="product-panels">
        {/* Unpublished Products */}
        <div className="product-panel">
          <div className="card">
            <div className="card-header">
              <h2>
                <FontAwesomeIcon icon={faBox} className="me-2" /> 
                Set Price for New Products
              </h2>
            </div>
            <div className="card-body">
              <form onSubmit={handleSetPrice}>
                <div className="mb-3">
                  <label className="form-label">Select Product</label>
                  <select
                    className="form-control"
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                  >
                    <option value="">Choose a product</option>
                    {unpublishedProducts.map(product => (
                      <option key={product._id} value={product._id}>
                        {product.name} ({product.model || 'No Model'})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Set Price</label>
                  <input
                    type="number"
                    className="form-control"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    min="0"
                    step="0.01"
                    placeholder="Enter price"
                  />
                </div>
                <button type="submit" className="btn btn-primary">Set Price</button>
              </form>
            </div>
          </div>
        </div>
        
        {/* Apply Discount */}
        <div className="product-panel">
          <div className="card">
            <div className="card-header">
              <h2>
                <FontAwesomeIcon icon={faPercent} className="me-2" /> 
                Apply Discount
              </h2>
            </div>
            <div className="card-body">
              <form onSubmit={handleSetDiscount}>
                <div className="mb-3">
                  <label className="form-label">Select Product</label>
                  <select
                    className="form-control"
                    value={discountProduct}
                    onChange={(e) => setDiscountProduct(e.target.value)}
                  >
                    <option value="">Choose a product</option>
                    {allProducts.map(product => (
                      <option key={product._id} value={product._id}>
                        {product.name} ({product.model || 'No Model'}) - ${product.price ? product.price.toFixed(2) : '0.00'}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Discount Percentage (%)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                    min="0"
                    max="100"
                    placeholder="Enter percentage (0-100)"
                  />
                </div>
                <button type="submit" className="btn btn-success">Apply Discount</button>
              </form>
            </div>
          </div>
        </div>
      </div>
      
      {/* Refund Requests - Using mock data as specified */}
      <div className="card mb-4">
        <div className="card-header">
          <h2>
            <FontAwesomeIcon icon={faUndoAlt} className="me-2" /> 
            Refund Requests
          </h2>
        </div>
        <div className="card-body">
          {refundRequests.length === 0 ? (
            <p className="text-center">No pending refund requests</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Product</th>
                  <th>Amount</th>
                  <th>Reason</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {refundRequests.map(refund => (
                  <tr key={refund._id}>
                    <td>{typeof refund.order === 'string' ? refund.order.substring(0, 8) : refund.order?.substring(0, 8)}...</td>
                    <td>{refund.productName}</td>
                    <td>${refund.amount?.toFixed(2) || '0.00'}</td>
                    <td>{refund.reason}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-success me-1"
                        onClick={() => handleAuthorizeRefund(refund._id)}
                      >
                        <FontAwesomeIcon icon={faCheck} /> Authorize
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleRejectRefund(refund._id)}
                      >
                        <FontAwesomeIcon icon={faTimes} /> Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      
      {/* Charts */}
      <div className="row mt-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h2>
                <FontAwesomeIcon icon={faChartLine} className="me-2" /> 
                Revenue Chart
              </h2>
            </div>
            <div className="card-body">
              <div className="chart-placeholder">
                {salesData.revenue && salesData.revenue.map((value, index) => (
                  <div 
                    key={`revenue-${index}`}
                    className="chart-bar" 
                    style={{ 
                      height: `${value / 20}px`, 
                      backgroundColor: '#007bff' 
                    }}>
                  </div>
                ))}
              </div>
              <div className="chart-legend">
                <span>Revenue Data {salesData.labels && salesData.labels.length > 0 ? `(${salesData.labels[0]} - ${salesData.labels[salesData.labels.length - 1]})` : ''}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h2>
                <FontAwesomeIcon icon={faChartLine} className="me-2" /> 
                Profit Chart
              </h2>
            </div>
            <div className="card-body">
              <div className="chart-placeholder">
                {salesData.profit && salesData.profit.map((value, index) => (
                  <div 
                    key={`profit-${index}`}
                    className="chart-bar" 
                    style={{ 
                      height: `${value / 20}px`, 
                      backgroundColor: '#28a745' 
                    }}>
                  </div>
                ))}
              </div>
              <div className="chart-legend">
                <span>Profit Data {salesData.labels && salesData.labels.length > 0 ? `(${salesData.labels[0]} - ${salesData.labels[salesData.labels.length - 1]})` : ''}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SalesManagerPanel;