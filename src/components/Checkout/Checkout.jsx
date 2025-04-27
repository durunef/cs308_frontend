// src/components/Checkout/Checkout.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate }        from 'react-router-dom';
import { useCart }            from '../../context/CartContext';
import { useAuth }            from '../../context/AuthContext';
import { checkout as doCheckout } from '../../api/orderService';
import axios                  from '../../api/axios';
import './Checkout.css';

export default function Checkout() {
  const navigate    = useNavigate();
  const { cartItems, getCartTotalPrice, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [step, setStep]     = useState(1);
  const [form, setForm]     = useState({
    fullName:'', email:'', street:'', city:'', postalCode:'',
    cardName:'', cardNumber:'', expiryDate:'', cvv:''
  });
  const [error, setError]         = useState('');
  const [invoiceUrl, setInvoiceUrl] = useState('');
  const [message, setMessage]       = useState('');

  // 1) Profilden adresi çekip kargoya doldur
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login?redirect=checkout');
      return;
    }
    axios.get('/api/user/profile')
      .then(res => {
        const u = res.data.data.user;
        setForm(f => ({
          ...f,
          fullName: u.name,
          email: u.email,
          street: u.address.street,
          city: u.address.city,
          postalCode: u.address.postalCode
        }));
      })
      .catch(() => {});
  }, [isAuthenticated, navigate]);

  // Input değişimi
  const handle = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  // Adım 1 → 2 geçişi
  const next = () => {
    const { fullName, email, street, city, postalCode } = form;
    if (!fullName||!email||!street||!city||!postalCode) {
      setError('Lütfen kargo bilgilerini tam doldurun');
      return;
    }
    setError(''); setStep(2);
  };

  // Ödeme işlemi simülasyonu
  const processPayment = () =>
    new Promise(resolve => setTimeout(() => resolve({ success: true, transactionId: 'tx-'+Date.now() }), 1000));

  // Siparişi tamamla
  const placeOrder = async e => {
    e.preventDefault();
    setError('');
    if (cartItems.length === 0) {
      setError('Sepet boş.');
      return;
    }
    const pay = await processPayment();
    if (!pay.success) {
      setError('Ödeme başarısız.');
      return;
    }
    try {
      const resp = await doCheckout({
        paymentDetails: {
          ...form,
          transactionId: pay.transactionId
        },
        shippingDetails: {
          fullName: form.fullName,
          email: form.email,
          street: form.street,
          city: form.city,
          postalCode: form.postalCode
        },
        cartItems
      });
      // Gelen invoiceUrl’i full path’e çevir
      setInvoiceUrl(`http://localhost:3000${resp.data.invoiceUrl}`);
      setMessage('Siparişiniz başarılı! Faturanız aşağıda görünüyor ve e-posta ile gönderildi.');
      clearCart();
    } catch (err) {
      setError(err.response?.data?.message || 'Sipariş hatası.');
    }
  };

  // Eğer fatura URL’si varsa, PDF’i <iframe> ile göster
  if (invoiceUrl) {
    return (
      <div className="checkout-container">
        <h1>Fatura</h1>
        <p>{message}</p>
        <iframe
          title="Invoice"
          src={invoiceUrl}
          width="100%"
          height="700px"
        />
      </div>
    );
  }

  // Normal checkout form
  return (
    <div className="checkout-container">
      <h1>Checkout</h1>
      {error && <div className="checkout-error">{error}</div>}

      <form onSubmit={placeOrder}>
        {step === 1 ? (
          <>
            <h2>Kargo Bilgileri</h2>
            <input name="fullName"    placeholder="Ad Soyad"      value={form.fullName}    onChange={handle}/>
            <input name="email"       placeholder="E-posta"        value={form.email}       onChange={handle}/>
            <input name="street"      placeholder="Sokak, No"      value={form.street}      onChange={handle}/>
            <input name="city"        placeholder="Şehir"          value={form.city}        onChange={handle}/>
            <input name="postalCode"  placeholder="Posta Kodu"     value={form.postalCode}  onChange={handle}/>
            <button type="button" onClick={next}>Ödeme Bilgilerine Geç</button>
          </>
        ) : (
          <>
            <h2>Ödeme Bilgileri</h2>
            <input name="cardName"     placeholder="Kart Üzerindeki İsim" value={form.cardName}    onChange={handle}/>
            <input name="cardNumber"   placeholder="Kart Numarası"          value={form.cardNumber}  onChange={handle}/>
            <input name="expiryDate"   placeholder="MM/YY"                  value={form.expiryDate}  onChange={handle}/>
            <input name="cvv"          placeholder="CVV"                    value={form.cvv}         onChange={handle}/>
            <div className="order-summary">
              <p>Toplam: ${getCartTotalPrice().toFixed(2)}</p>
            </div>
            <button type="button" onClick={() => setStep(1)}>Geri</button>
            <button type="submit">Siparişi Tamamla</button>
          </>
        )}
      </form>
    </div>
  );
}
