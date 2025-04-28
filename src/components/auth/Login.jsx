// src/components/auth/Login.jsx

import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLock,
  faEnvelope,
  faArrowRight
} from "@fortawesome/free-solid-svg-icons";
import axios from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import "./auth.css";

function Login() {
  // 1) redirect parametresini al
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [info, setInfo] = useState("");    // bilgi mesajı için
  const [error, setError] = useState("");  // gerçek hata mesajı için
  const [isLoading, setIsLoading] = useState(false);

  // 2) Eğer redirect varsa, mount olduğunda bilgi mesajı göster
  useEffect(() => {
    if (redirectTo && redirectTo !== "/") {
      setInfo("Please login to continue");
    }
  }, [redirectTo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await axios.post("/api/v1/auth/login", {
        email,
        password
      });

      // Token + user verisini context'e kaydet
      const token = response.data.token;
      const userData = {
        name: response.data.data?.name || email.split('@')[0],
        email: response.data.data?.email || email,
        id:   response.data.data?.id
      };
      login(token, userData);

      // 3) Başarılı girişten sonra redirectTo'ya git
      navigate(redirectTo, { replace: true });

    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Giriş sırasında bir hata oluştu"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container login-container">
      <div className="auth-main">
        <div className="auth-content">
          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to your account to continue</p>

          {/* 4) Bilgi ve hata mesajları */}
          {info && (
            <div className="info-message">
              {info}
            </div>
          )}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <div className="input-with-icon">
                <FontAwesomeIcon icon={faEnvelope} className="input-icon" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-with-icon">
                <FontAwesomeIcon icon={faLock} className="input-icon" />
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  minLength="5"
                />
              </div>
            </div>

            <div className="form-options">
              <div className="remember-me">
                <input type="checkbox" id="remember" />
                <label htmlFor="remember">Remember me</label>
              </div>
              <Link to="/forgot-password" className="forgot-password">
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              className="auth-button"
              disabled={isLoading}
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>

      <div className="auth-secondary">
        <div className="auth-content">
          <h2 className="auth-title">New Here?</h2>
          <p className="auth-subtitle">
            Sign up and discover our amazing products
          </p>
          <Link to="/register" className="auth-alt-button">
            Create Account <FontAwesomeIcon icon={faArrowRight} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
