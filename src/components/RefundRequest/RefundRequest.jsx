import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUndo, 
  faTimes, 
  faExclamationTriangle,
  faCheckCircle,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import { requestRefund } from '../../api/orderService';
import './RefundRequest.css';

function RefundRequest({ order, onRefundRequested }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleItemSelect = (item) => {
    const existingItem = selectedItems.find(i => i.productId === item.product._id);
    if (existingItem) {
      setSelectedItems(selectedItems.filter(i => i.productId !== item.product._id));
    } else {
      setSelectedItems([...selectedItems, {
        productId: item.product._id,
        quantity: item.quantity,
        reason: ''
      }]);
    }
  };

  const handleQuantityChange = (productId, quantity) => {
    setSelectedItems(selectedItems.map(item => 
      item.productId === productId 
        ? { ...item, quantity: Math.min(quantity, order.items.find(i => i.product._id === productId).quantity) }
        : item
    ));
  };

  const handleReasonChange = (productId, reason) => {
    setSelectedItems(selectedItems.map(item => 
      item.productId === productId 
        ? { ...item, reason }
        : item
    ));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await requestRefund(order._id, selectedItems);
      setSuccess(true);
      setIsOpen(false);
      if (onRefundRequested) {
        onRefundRequested(response.refund);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to submit refund request');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        className="refund-request-button"
        onClick={() => setIsOpen(true)}
        disabled={order.status !== 'delivered'}
      >
        <FontAwesomeIcon icon={faUndo} /> Request Refund
      </button>
    );
  }

  return (
    <div className="refund-request-modal">
      <div className="refund-request-content">
        <div className="refund-request-header">
          <h3>Request Refund</h3>
          <button 
            className="close-button"
            onClick={() => setIsOpen(false)}
            disabled={loading}
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {error && (
          <div className="refund-error">
            <FontAwesomeIcon icon={faExclamationTriangle} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="refund-success">
            <FontAwesomeIcon icon={faCheckCircle} />
            <span>Your refund request has been submitted successfully! It will be reviewed by our team within 2-3 business days.</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="refund-items">
            {order.items.map(item => (
              <div key={item.product._id} className="refund-item">
                <div className="item-header">
                  <label className="item-select">
                    <input
                      type="checkbox"
                      checked={selectedItems.some(i => i.productId === item.product._id)}
                      onChange={() => handleItemSelect(item)}
                      disabled={loading}
                    />
                    <span className="item-name">{item.product.name}</span>
                  </label>
                  <span className="item-price">${item.priceAtPurchase.toFixed(2)}</span>
                </div>

                {selectedItems.some(i => i.productId === item.product._id) && (
                  <div className="item-details">
                    <div className="quantity-selector">
                      <label>Quantity:</label>
                      <input
                        type="number"
                        min="1"
                        max={item.quantity}
                        value={selectedItems.find(i => i.productId === item.product._id)?.quantity || 1}
                        onChange={(e) => handleQuantityChange(item.product._id, parseInt(e.target.value))}
                        disabled={loading}
                      />
                    </div>
                    <div className="reason-input">
                      <label>Reason for return (optional):</label>
                      <textarea
                        value={selectedItems.find(i => i.productId === item.product._id)?.reason || ''}
                        onChange={(e) => handleReasonChange(item.product._id, e.target.value)}
                        placeholder="Please provide a reason for returning this item (optional)"
                        disabled={loading}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="refund-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={() => setIsOpen(false)}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={loading || selectedItems.length === 0}
            >
              {loading ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin /> Submitting...
                </>
              ) : (
                'Submit Refund Request'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RefundRequest; 