import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faUser, 
  faEnvelope, 
  faMapMarkerAlt, 
  faHistory,
  faCog,
  faCoffee,
  faShoppingBag,
  faEye,
  faSpinner,
  faExclamationTriangle
} from "@fortawesome/free-solid-svg-icons";
import "./profile.css";
import { useAuth } from "../../context/AuthContext";
import { getOrderHistory } from "../../api/orderService";

function Profile() {
  const { user, token, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("personal");
  const [address, setAddress] = useState({ street: "", city: "", postalCode: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState("");
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(null);
  const [addressCheckResult, setAddressCheckResult] = useState(null);

  // Profil bilgisini çek
  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await fetch("http://localhost:3000/api/user/profile", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const { data, status } = await res.json();
        if (status === "success" && data.user) {
          setAddress({
            street: data.user.address.street || "",
            city: data.user.address.city || "",
            postalCode: data.user.address.postalCode || ""
          });
        }
      } catch (err) {
        console.error(err);
        setMessage("Profil bilgisi yüklenemedi.");
        setMessageType("error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [token]);

  // Sipariş geçmişini çek
  useEffect(() => {
    if (activeTab === "orders" && isAuthenticated) {
      const fetchOrders = async () => {
        setOrdersLoading(true);
        setOrdersError(null);
        try {
          const res = await getOrderHistory();
          if (res.status === "success") {
            setOrders(res.data);
          } else {
            throw new Error("Başarısız");
          }
        } catch (err) {
          console.error(err);
          setOrdersError("Sipariş geçmişi yüklenemedi.");
        } finally {
          setOrdersLoading(false);
        }
      };
      fetchOrders();
    }
  }, [activeTab, isAuthenticated]);

  const handleAddressChange = e => {
    const { name, value } = e.target;
    setAddress(prev => ({ ...prev, [name]: value }));
  };

  const handleAddressSubmit = async e => {
    e.preventDefault();
    if (!token) {
      setMessage("Giriş yapmalısınız.");
      setMessageType("error");
      return;
    }
    if (!address.street || !address.city || !address.postalCode) {
      setMessage("Lütfen tüm alanları doldurun.");
      setMessageType("error");
      return;
    }
    try {
      const res = await fetch("http://localhost:3000/api/user/address", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(address)
      });
      const { status } = await res.json();
      if (status === "success") {
        setMessage("Adres güncellendi.");
        setMessageType("success");
      } else {
        throw new Error("Adres güncellenemedi");
      }
    } catch (err) {
      console.error(err);
      setMessage("Adres güncellenemedi.");
      setMessageType("error");
    }
  };

  const formatDate = dateStr =>
    new Date(dateStr).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric"
    });

  const getStatusClass = status => {
    if (status === "processing") return "status-processing";
    if (status === "in-transit") return "status-in-transit";
    if (status === "delivered") return "status-delivered";
    return "";
  };

  if (isLoading) {
    return (
      <div className="profile-container">
        <FontAwesomeIcon icon={faSpinner} spin /> Profil yükleniyor…
      </div>
    );
  }

  if (!isAuthenticated) {
    return <div className="profile-container">Lütfen giriş yapın.</div>;
  }

  return (
    <div className="profile-container">
      <h1>
        <FontAwesomeIcon icon={faCoffee} /> Profilim
      </h1>

      <div className="profile-tabs">
        <button
          className={activeTab === "personal" ? "active" : ""}
          onClick={() => setActiveTab("personal")}
        >
          Kişisel Bilgiler
        </button>
        <button
          className={activeTab === "orders" ? "active" : ""}
          onClick={() => setActiveTab("orders")}
        >
          Sipariş Geçmişi
        </button>
        <button
          className={activeTab === "settings" ? "active" : ""}
          onClick={() => setActiveTab("settings")}
        >
          Ayarlar
        </button>
      </div>

      {activeTab === "personal" && (
        <form className="profile-form" onSubmit={handleAddressSubmit}>
          <div>
            <label>İsim</label>
            <input type="text" value={user.name} readOnly />
          </div>
          <div>
            <label>Email</label>
            <input type="email" value={user.email} readOnly />
          </div>
          <div>
            <label>Sokak</label>
            <input
              name="street"
              value={address.street}
              onChange={handleAddressChange}
            />
          </div>
          <div>
            <label>Şehir</label>
            <input
              name="city"
              value={address.city}
              onChange={handleAddressChange}
            />
          </div>
          <div>
            <label>Posta Kodu</label>
            <input
              name="postalCode"
              value={address.postalCode}
              onChange={handleAddressChange}
            />
          </div>

          {message && (
            <div className={`message ${messageType}`}>{message}</div>
          )}
          <button type="submit">Adresi Güncelle</button>
        </form>
      )}

      {activeTab === "orders" && (
        <div className="order-history">
          {ordersLoading ? (
            <FontAwesomeIcon icon={faSpinner} spin />
          ) : ordersError ? (
            <div className="error-state">
              <FontAwesomeIcon icon={faExclamationTriangle} /> {ordersError}
            </div>
          ) : orders.length === 0 ? (
            <p>Henüz sipariş yok. <Link to="/products">Alışverişe başla</Link></p>
          ) : (
            orders.map(o => (
              <div key={o._id} className="order-item">
                <div>
                  <strong>#{o._id}</strong> {formatDate(o.createdAt)}
                </div>
                <div>
                  {o.items.map((it, i) => (
                    <span key={i}>
                      {it.product.name} × {it.quantity}
                      {i < o.items.length - 1 && ", "}
                    </span>
                  ))}
                </div>
                <div>
                  <span>${o.total.toFixed(2)}</span>{" "}
                  <span className={getStatusClass(o.status)}>{o.status}</span>{" "}
                  <Link to={`/order-confirmation/${o._id}`}>
                    <FontAwesomeIcon icon={faEye} /> Detay
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "settings" && (
        <div className="account-settings">
          <p>Ayarlar sayfası (gelecek)</p>
        </div>
      )}
    </div>
  );
}

export default Profile;
