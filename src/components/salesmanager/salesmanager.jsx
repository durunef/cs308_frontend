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
import { toast } from "react-hot-toast";

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
  const [selectedExistingProduct, setSelectedExistingProduct] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [discountProduct, setDiscountProduct] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [startDate, setStartDate] = useState("2024-01-01");
  const [endDate, setEndDate] = useState("2027-01-01");
  const [invoices, setInvoices] = useState([]);
  const [refundRequests, setRefundRequests] = useState([]);
  const [isRefundsLoading, setIsRefundsLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [salesData, setSalesData] = useState({
    labels: [],
    revenue: [],
    profit: []
  });

  // Separate alert states for each section
  const [priceAlert, setPriceAlert] = useState({ show: false, text: "", type: "" });
  const [existingPriceAlert, setExistingPriceAlert] = useState({ show: false, text: "", type: "" });
  const [discountAlert, setDiscountAlert] = useState({ show: false, text: "", type: "" });
  const [refundAlert, setRefundAlert] = useState({ show: false, text: "", type: "" });
  const [dateFilterAlert, setDateFilterAlert] = useState({ show: false, text: "", type: "" });
  const [invoiceAlert, setInvoiceAlert] = useState({ show: false, text: "", type: "" });
  
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
          showAlert("Failed to fetch products.", "danger", "price");
        }
        
        try {
          await fetchUnpublishedProducts();
          console.log("Unpublished products fetched successfully");
        } catch (error) {
          console.error("Error fetching unpublished products:", error);
          showAlert("Failed to fetch unpublished products.", "danger", "price");
        }
        
        try {
          await fetchRefundRequests();
          console.log("Refund requests fetched successfully");
        } catch (error) {
          console.error("Error fetching refund requests:", error);
          showAlert("Failed to fetch refund requests", "danger", "refund");
        }
        
        try {
          await fetchInvoices();
          console.log("Invoices fetched successfully");
        } catch (error) {
          console.error("Error fetching invoices:", error);
          showAlert("Failed to fetch invoices.", "danger", "invoice");
        }
        
        try {
          await fetchSalesData();
          console.log("Sales data fetched successfully");
        } catch (error) {
          console.error("Error fetching sales data:", error);
          showAlert("Failed to fetch sales data.", "danger", "dateFilter");
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error in initial data loading:", error);
        setHasError(true);
        setErrorMessage("Failed to load data. Please try refreshing the page.");
        showAlert("Failed to load data", "danger", "dateFilter");
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
      
      // Filter products without a price or with price set to null
      const unpublished = products.filter(p => p.price === null || p.price === undefined);
      console.log("Unpublished products:", unpublished);
      setUnpublishedProducts(unpublished);
    } catch (error) {
      console.error("Error fetching unpublished products:", error);
      throw error;
    }
  };

  // Fetch refund requests from API
  const fetchRefundRequests = async () => {
    try {
      setIsRefundsLoading(true);
      console.log("Fetching refund requests from API");
      const response = await axiosInstance.get("/sales/refunds/pending");
      console.log("Refund requests response:", response.data);
      
      if (response.data && response.data.data && response.data.data.refunds) {
        const refundsData = response.data.data.refunds;
        console.log("Processed refunds data:", refundsData);
        setRefundRequests(refundsData);
      } else {
        console.log("No refund requests found or unexpected data structure:", response.data);
        setRefundRequests([]);
      }
    } catch (error) {
      console.error("Error fetching refund requests:", error);
      showAlert("Failed to fetch refund requests", "danger", "refund");
      setRefundRequests([]);
    } finally {
      setIsRefundsLoading(false);
    }
  };

  // Fetch invoices with date filtering from backend
  const fetchInvoices = async () => {
    try {
      const response = await axiosInstance.get('/sales/invoices', {
        params: {
          start: startDate,
          end: endDate
        }
      });
      setInvoices(response.data.data.invoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to fetch invoices');
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
        const revenueResponse = await axiosInstance.get('/sales/revenue', {
          params: {
            start: startDate,
            end: endDate
          }
        });
        console.log("Revenue response:", revenueResponse.data);
        
        if (revenueResponse.data && revenueResponse.data.data && revenueResponse.data.data.report) {
          const revenueData = revenueResponse.data.data.report;
          
          if (revenueData.length > 0) {
            // Update labels and revenue data with full date format
            labels = revenueData.map(item => {
              const date = new Date(item.date);
              return date.toLocaleDateString('en-US', { 
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              });
            });
            
            revenue = revenueData.map(item => item.revenue);
            console.log("Processed revenue data:", { labels, revenue });
          } else {
            console.log("Revenue data array is empty");
            showAlert("No revenue data available for the selected date range", "info", "dateFilter");
          }
        } else {
          console.log("Revenue data not in expected format:", revenueResponse.data);
          showAlert("Revenue data format is incorrect", "warning", "dateFilter");
        }
      } catch (revenueError) {
        console.error("Error fetching revenue data:", revenueError);
        showAlert("Failed to fetch revenue data", "danger", "dateFilter");
        throw revenueError;
      }
      
      // Get profit data from API
      try {
        const profitResponse = await axiosInstance.get('/sales/profit', {
          params: {
            start: startDate,
            end: endDate
          }
        });
        console.log("Profit response:", profitResponse.data);
        
        if (profitResponse.data && profitResponse.data.data && profitResponse.data.data.report) {
          const profitData = profitResponse.data.data.report;
          
          if (profitData.length > 0) {
            // Update profit data
            profit = profitData.map(item => item.profit);
            console.log("Processed profit data:", profit);
          } else {
            console.log("Profit data array is empty");
            showAlert("No profit data available for the selected date range", "info", "dateFilter");
          }
        } else {
          console.log("Profit data not in expected format:", profitResponse.data);
          showAlert("Profit data format is incorrect", "warning", "dateFilter");
        }
      } catch (profitError) {
        console.error("Error fetching profit data:", profitError);
        showAlert("Failed to fetch profit data", "danger", "dateFilter");
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
      showAlert("Failed to fetch sales data", "danger", "dateFilter");
      throw error;
    }
  };

  // Handle setting price for a new product
  const handleSetPrice = async (e) => {
    e.preventDefault();
    
    if (!selectedProduct || !price || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
      showAlert("Please select a product and enter a valid price", "danger", "price");
      return;
    }

    try {
      console.log(`Setting price ${price} for product ${selectedProduct}`);
      
      const response = await axiosInstance.patch(`/sales/price/${selectedProduct}`, {
        price: parseFloat(price),
        published: true // Set published to true when price is set
      });
      
      console.log("Price set successfully:", response.data);
      showAlert("Price set successfully! Product is now visible to customers.", "success", "price");
      await fetchAllProducts();
      await fetchUnpublishedProducts();
      
      setSelectedProduct("");
      setPrice("");
    } catch (error) {
      console.error("Error setting price:", error);
      showAlert(`Failed to set price: ${error.response?.data?.message || error.message}`, "danger", "price");
    }
  };

  // Handle updating price for an existing product
  const handleUpdatePrice = async (e) => {
    e.preventDefault();
    
    if (!selectedExistingProduct || !newPrice || isNaN(parseFloat(newPrice)) || parseFloat(newPrice) < 0) {
      showAlert("Please select a product and enter a valid price", "danger", "existingPrice");
      return;
    }

    try {
      console.log(`Updating price to ${newPrice} for product ${selectedExistingProduct}`);
      
      const response = await axiosInstance.patch(`/sales/price/${selectedExistingProduct}`, {
        price: parseFloat(newPrice)
      });
      
      console.log("Price updated successfully:", response.data);
      showAlert("Price updated successfully!", "success", "existingPrice");
      await fetchAllProducts();
      
      setSelectedExistingProduct("");
      setNewPrice("");
    } catch (error) {
      console.error("Error updating price:", error);
      showAlert(`Failed to update price: ${error.response?.data?.message || error.message}`, "danger", "existingPrice");
    }
  };

  // Handle setting discount for a product
  const handleSetDiscount = async (e) => {
    e.preventDefault();
    
    if (!discountProduct || !discountPercent || 
        isNaN(parseFloat(discountPercent)) || 
        parseFloat(discountPercent) < 0 || 
        parseFloat(discountPercent) > 100) {
      showAlert("Please select a product and enter a valid discount percentage (0-100)", "danger", "discount");
      return;
    }

    try {
      const discountValue = parseFloat(discountPercent);
      console.log(`Setting discount ${discountValue}% for product ${discountProduct}`);
      
      const product = allProducts.find(p => p._id === discountProduct);
      if (!product || !product.price) {
        showAlert("Product price information not available", "danger", "discount");
        return;
      }
      
      const originalPrice = product.price;
      const discountAmount = (originalPrice * discountValue) / 100;
      const discountedPrice = originalPrice - discountAmount;
      
      // First apply the discount
      const response = await axiosInstance.patch(`/sales/price/${discountProduct}`, {
        price: Number(discountedPrice.toFixed(2))
      });
      
      // Then notify wishlist users
      try {
        await axiosInstance.post(`/sales/discount/${discountProduct}`, {
          discountPercent: discountValue,
          originalPrice: originalPrice,
          newPrice: discountedPrice
        });
      } catch (notifyError) {
        console.error("Error notifying wishlist users:", notifyError);
        // Continue even if notification fails
      }
      
      console.log("Discount response:", response.data);
      showAlert(`Discount of ${discountValue}% applied successfully!`, "success", "discount");
      await fetchAllProducts();
      
      setDiscountProduct("");
      setDiscountPercent("");
    } catch (error) {
      console.error("Error setting discount:", error);
      let errorMsg = "Failed to apply discount";
      if (error.response?.data?.message) {
        errorMsg += `: ${error.response.data.message}`;
      } else if (error.message) {
        errorMsg += `: ${error.message}`;
      }
      
      showAlert(errorMsg, "danger", "discount");
    }
  };

  // Handle authorizing a refund
  const handleAuthorizeRefund = async (refundId) => {
    try {
      console.log(`Authorizing refund ${refundId}`);
      
      const response = await axiosInstance.patch(`/sales/refunds/${refundId}/approve`);
      console.log("Refund approval response:", response.data);
      
      if (response.data && response.data.status === "success") {
        showAlert("Refund authorized successfully!", "success", "refund");
        await fetchRefundRequests();
      } else {
        throw new Error("Failed to authorize refund");
      }
    } catch (error) {
      console.error("Error authorizing refund:", error);
      showAlert(`Failed to authorize refund: ${error.response?.data?.message || error.message}`, "danger", "refund");
    }
  };

  // Handle rejecting a refund
  const handleRejectRefund = async (refundId) => {
    try {
      console.log(`Rejecting refund ${refundId}`);
      
      const response = await axiosInstance.patch(`/sales/refunds/${refundId}/reject`);
      console.log("Refund rejection response:", response.data);
      
      if (response.data && response.data.status === "success") {
        showAlert("Refund rejected successfully!", "success", "refund");
        await fetchRefundRequests();
      } else {
        throw new Error("Failed to reject refund");
      }
    } catch (error) {
      console.error("Error rejecting refund:", error);
      showAlert(`Failed to reject refund: ${error.response?.data?.message || error.message}`, "danger", "refund");
    }
  };

  // Download invoice function
  const downloadInvoice = async (invoiceUrl) => {
    try {
      console.log(`Original invoice URL: ${invoiceUrl}`);
      
      // Extract the order ID from the invoice URL
      const orderId = invoiceUrl.split('/').pop().replace('invoice-', '').replace('.pdf', '');
      console.log("Extracted order ID:", orderId);
      
      // Use the correct endpoint format
      const fullUrl = `${API_URL}/sales/invoices/${orderId}/download`;
      console.log("Attempting to download from:", fullUrl);
      
      // Make a GET request to download the PDF
      const response = await axiosInstance.get(fullUrl, {
        responseType: 'blob',
        headers: {
          'Accept': 'application/pdf'
        }
      });
      
      if (response.status !== 200) {
        throw new Error(`Failed to download invoice: ${response.status} ${response.statusText}`);
      }
      
      // Create a blob from the PDF data
      const blob = new Blob([response.data], { type: 'application/pdf' });
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Use the order ID for the filename
      link.setAttribute('download', `invoice-${orderId}.pdf`);
      
      // Append to body, click and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      window.URL.revokeObjectURL(url);
      
      showAlert("Invoice downloaded successfully", "success", "invoice");
    } catch (error) {
      console.error("Error downloading invoice:", error);
      let errorMessage = "Failed to download invoice. ";
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        errorMessage += `Server responded with ${error.response.status}: ${error.response.statusText}`;
        console.error("Server response:", error.response.data);
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage += "No response received from server.";
        console.error("No response received:", error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        errorMessage += error.message;
        console.error("Request setup error:", error);
      }
      
      showAlert(errorMessage, "danger", "invoice");
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
      showAlert("Date filter applied", "success", "dateFilter");
    } catch (error) {
      showAlert("Failed to apply date filter", "danger", "dateFilter");
    }
  };

  // Reset date filter
  const resetDateFilter = () => {
    setStartDate("2024-01-01");
    setEndDate("2027-01-01");
    
    setTimeout(async () => {
      try {
        await Promise.all([
          fetchInvoices(),
          fetchSalesData()
        ]);
        showAlert("Date filter reset", "success", "dateFilter");
      } catch (error) {
        showAlert("Failed to reset date filter", "danger", "dateFilter");
      }
    }, 0);
  };

  // Show alert message for specific section
  const showAlert = (text, type, section) => {
    const alertSetter = {
      'price': setPriceAlert,
      'existingPrice': setExistingPriceAlert,
      'discount': setDiscountAlert,
      'refund': setRefundAlert,
      'dateFilter': setDateFilterAlert,
      'invoice': setInvoiceAlert
    }[section];

    if (alertSetter) {
      alertSetter({ show: true, text, type });
      setTimeout(() => {
        alertSetter({ show: false, text: "", type: "" });
      }, 5000);
    }
  };
  
  // Function to check if user has sales access
  const hasSalesAccess = () => {
    // Allow access if user has 'sales-manager' role OR has an email with '@sales'
    return user && (
      user.role === 'sales-manager' || 
      (user.email && user.email.includes('@sales'))
    );
  };

  // Calculate max value for scaling the charts
  const calculateMaxValue = (dataArray) => {
    if (!dataArray || dataArray.length === 0) return 100;
    const max = Math.max(...dataArray);
    return max > 0 ? max : 100;
  };

  // Get bar height as percentage of maximum value (for responsive height)
  const getBarHeight = (value, maxValue) => {
    if (maxValue <= 0) return 0;
    // Calculate as percentage of maximum with scaling factor to fit the container
    // Minimum height of 1px for visibility of small values
    return Math.max(1, (value / maxValue) * 200);  // Scale up to 200px max height
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
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

  // Calculate max values for chart scaling
  const maxRevenueValue = calculateMaxValue(salesData.revenue);
  const maxProfitValue = calculateMaxValue(salesData.profit);

  return (
    <div className="sales-panel-container">
      <h1 className="profile-heading">
        <FontAwesomeIcon icon={faChartLine} className="coffee-icon" /> 
        Sales Manager Panel
      </h1>
      
      {/* Date Range Filter */}
      <div className="date-filter-container">
        <div className="card mb-4">
          <div className="card-header">
            <h2>
              <FontAwesomeIcon icon={faCalendarAlt} className="me-2" />
              Date Range Filter
            </h2>
          </div>
          <div className="card-body">
            {dateFilterAlert.show && (
              <div className={`alert alert-${dateFilterAlert.type} mb-3`}>
                {dateFilterAlert.text}
              </div>
            )}
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
                  <FontAwesomeIcon icon={faCheck} className="me-2" />
                  Apply Filter
                </button>
                <button className="btn btn-secondary" onClick={resetDateFilter}>
                  <FontAwesomeIcon icon={faUndoAlt} className="me-2" />
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Invoices Section */}
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
                    <th className="order-id-column">Order ID</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(invoice => (
                    <tr key={invoice.orderId}>
                      <td className="order-id-column">{invoice.orderId}</td>
                      <td>{new Date(invoice.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => downloadInvoice(invoice.invoiceUrl)}
                        >
                          <FontAwesomeIcon icon={faDownload} /> Download PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
      
      {/* Product Management Section */}
      <div className="product-panels">
        {/* First Row */}
        <div className="product-panel-row">
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
                {priceAlert.show && (
                  <div className={`alert alert-${priceAlert.type} mb-3`}>
                    {priceAlert.text}
                  </div>
                )}
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

          {/* Existing Products Price Update */}
          <div className="product-panel">
            <div className="card">
              <div className="card-header">
                <h2>
                  <FontAwesomeIcon icon={faBox} className="me-2" /> 
                  Update Existing Product Prices
                </h2>
              </div>
              <div className="card-body">
                {existingPriceAlert.show && (
                  <div className={`alert alert-${existingPriceAlert.type} mb-3`}>
                    {existingPriceAlert.text}
                  </div>
                )}
                <form onSubmit={handleUpdatePrice}>
                  <div className="mb-3">
                    <label className="form-label">Select Product</label>
                    <select
                      className="form-control"
                      value={selectedExistingProduct}
                      onChange={(e) => setSelectedExistingProduct(e.target.value)}
                    >
                      <option value="">Choose a product</option>
                      {allProducts.filter(p => p.price !== null && p.price !== undefined).map(product => (
                        <option key={product._id} value={product._id}>
                          {product.name} ({product.model || 'No Model'}) - Current: ${product.price.toFixed(2)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">New Price</label>
                    <input
                      type="number"
                      className="form-control"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      min="0"
                      step="0.01"
                      placeholder="Enter new price"
                    />
                  </div>
                  <button type="submit" className="btn btn-primary">Update Price</button>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Second Row */}
        <div className="product-panel-row">
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
                {discountAlert.show && (
                  <div className={`alert alert-${discountAlert.type} mb-3`}>
                    {discountAlert.text}
                  </div>
                )}
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
      </div>
      
      {/* Refund Requests Section */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h2>
                <FontAwesomeIcon icon={faUndoAlt} className="me-2" /> 
                Refund Requests
              </h2>
            </div>
            <div className="card-body">
              {refundAlert.show && (
                <div className={`alert alert-${refundAlert.type} mb-3`}>
                  {refundAlert.text}
                </div>
              )}
              {isRefundsLoading ? (
                <div className="text-center py-4">
                  <FontAwesomeIcon icon={faSpinner} spin size="2x" className="mb-2" />
                  <p>Loading refund requests...</p>
                </div>
              ) : refundRequests.length === 0 ? (
                <p className="text-center">No pending refund requests</p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Refund ID</th>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Total Amount</th>
                      <th>Reason</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {refundRequests.map(refund => (
                      <tr key={refund._id}>
                        <td className="refund-id-column">{refund._id}</td>
                        <td>{refund.items[0]?.product?.name || 'N/A'}</td>
                        <td>{refund.items[0]?.quantity || 0}</td>
                        <td>{formatCurrency(refund.totalRefundAmount || 0)}</td>
                        <td>{refund.items[0]?.reason || 'No reason provided'}</td>
                        <td>{new Date(refund.createdAt).toLocaleDateString()}</td>
                        <td>
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-sm btn-success action-button"
                              onClick={() => handleAuthorizeRefund(refund._id)}
                            >
                              <FontAwesomeIcon icon={faCheck} /> Accept
                            </button>
                            <button
                              className="btn btn-sm btn-danger action-button"
                              onClick={() => handleRejectRefund(refund._id)}
                            >
                              <FontAwesomeIcon icon={faTimes} /> Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
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
              {salesData.revenue && salesData.revenue.length > 0 ? (
                <div>
                  <div className="chart-container" style={{ height: '250px', position: 'relative' }}>
                    <div className="chart-y-axis">
                      <div className="y-axis-label">{formatCurrency(maxRevenueValue)}</div>
                      <div className="y-axis-label">{formatCurrency(maxRevenueValue * 0.75)}</div>
                      <div className="y-axis-label">{formatCurrency(maxRevenueValue * 0.5)}</div>
                      <div className="y-axis-label">{formatCurrency(maxRevenueValue * 0.25)}</div>
                      <div className="y-axis-label">$0</div>
                    </div>
                    <div className="chart-bars-container">
                      {salesData.revenue.map((value, index) => (
                        <div key={`revenue-bar-${index}`} className="chart-bar-wrapper">
                          <div 
                            className="chart-bar" 
                            style={{ 
                              height: `${getBarHeight(value, maxRevenueValue)}px`,
                              backgroundColor: '#007bff' 
                            }}
                            title={`${salesData.labels[index]}: ${formatCurrency(value)}`}
                          >
                            <div className="bar-value">{formatCurrency(value)}</div>
                          </div>
                          <div className="bar-label">{salesData.labels[index]}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="chart-legend">
                    <span>Revenue Data for {startDate} to {endDate}</span>
                  </div>
                </div>
              ) : (
                <p className="text-center">No revenue data available for the selected date range</p>
              )}
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
              {salesData.profit && salesData.profit.length > 0 ? (
                <div>
                  <div className="chart-container" style={{ height: '250px', position: 'relative' }}>
                    <div className="chart-y-axis">
                      <div className="y-axis-label">{formatCurrency(maxProfitValue)}</div>
                      <div className="y-axis-label">{formatCurrency(maxProfitValue * 0.75)}</div>
                      <div className="y-axis-label">{formatCurrency(maxProfitValue * 0.5)}</div>
                      <div className="y-axis-label">{formatCurrency(maxProfitValue * 0.25)}</div>
                      <div className="y-axis-label">$0</div>
                    </div>
                    <div className="chart-bars-container">
                      {salesData.profit.map((value, index) => (
                        <div key={`profit-bar-${index}`} className="chart-bar-wrapper">
                          <div 
                            className="chart-bar" 
                            style={{ 
                              height: `${getBarHeight(value, maxProfitValue)}px`,
                              backgroundColor: value >= 0 ? '#28a745' : '#dc3545'
                            }}
                            title={`${salesData.labels[index]}: ${formatCurrency(value)}`}
                          >
                            <div className="bar-value">{formatCurrency(value)}</div>
                          </div>
                          <div className="bar-label">{salesData.labels[index]}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="chart-legend">
                    <span>Profit/Loss Data for {startDate} to {endDate}</span>
                  </div>
                </div>
              ) : (
                <p className="text-center">No profit data available for the selected date range</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add some CSS for the charts */}
      <style jsx="true">{`
        .chart-container {
          display: flex;
          align-items: flex-end;
          width: 100%;
          padding-left: 50px;
          border-bottom: 1px solid #ddd;
          margin-bottom: 10px;
        }
        .chart-y-axis {
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 50px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 5px 0;
        }
        .y-axis-label {
          font-size: 10px;
          color: #666;
          text-align: right;
          padding-right: 5px;
        }
        .chart-bars-container {
          display: flex;
          justify-content: space-around;
          align-items: flex-end;
          width: 100%;
          height: 100%;
        }
        .chart-bar-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
          max-width: 60px;
        }
        .chart-bar {
          width: 30px;
          min-height: 1px;
          border-radius: 3px 3px 0 0;
          position: relative;
          transition: height 0.5s ease;
        }
        .bar-value {
          position: absolute;
          top: -20px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 10px;
          white-space: nowrap;
          color: #333;
        }
        .bar-label {
          margin-top: 5px;
          font-size: 12px;
          text-align: center;
        }
        .chart-legend {
          text-align: center;
          margin-top: 10px;
          font-size: 14px;
          color: #666;
        }

        /* Date Filter Styles */
        .date-filter-container {
          margin-bottom: 1rem;
        }
        .date-range-control {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .date-inputs {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .date-inputs .form-group {
          flex: 1;
          min-width: 200px;
          margin-bottom: 0;
        }
        .button-group {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 0.5rem;
        }
        .button-group button {
          min-width: 120px;
          padding: 0.375rem 0.75rem;
        }
        .date-filter-container .card-body {
          padding: 1rem;
        }
        .date-filter-container .card-header {
          padding: 0.75rem 1rem;
        }
        .date-filter-container .form-group label {
          margin-bottom: 0.25rem;
        }
        @media (max-width: 768px) {
          .date-inputs {
            flex-direction: column;
          }
          .button-group {
            flex-direction: column;
          }
          .button-group button {
            width: 100%;
          }
        }

        /* Table styles */
        .order-id-column {
          width: 30%;
          min-width: 200px;
        }
        .refund-id-column {
          width: 25%;
          min-width: 180px;
        }
        .table td {
          vertical-align: middle;
        }
        .action-button {
          min-width: 100px;
          flex: 1;
        }
      `}</style>
    </div>
  );
}

export default SalesManagerPanel;