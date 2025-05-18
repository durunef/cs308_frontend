import React from "react";
import { NavLink, Routes, Route, Navigate } from "react-router-dom";
import "./ManagerConsole.css"; // optional: bring in your CSS

// placeholder screens
function ProductsManager() {
  return <h2>📦 Manage Products</h2>;
}
function CategoriesManager() {
  return <h2>📁 Manage Categories</h2>;
}

export default function ManagerConsole() {
  console.log("▶︎ ManagerConsole rendered at", window.location.pathname);

  return (
    <div style={{ display: "flex", minHeight: "70vh" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: 200,
          padding: "1rem",
          borderRight: "1px solid rgba(0,0,0,0.1)",
          background: "rgba(0,0,0,0.03)"
        }}
      >
        <h3>Manager Menu</h3>
        <nav>
          <ul style={{ listStyle: "none", padding: 0 }}>
            <li>
              <NavLink to="products">Products</NavLink>
            </li>
            <li>
              <NavLink to="categories">Categories</NavLink>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Content */}
      <main style={{ flex: 1, padding: "1rem" }}>
        <Routes>
          <Route index element={<Navigate to="products" replace />} />
          <Route path="products" element={<ProductsManager />} />
          <Route path="categories" element={<CategoriesManager />} />
          <Route path="*" element={<h2>❓ Not Found</h2>} />
        </Routes>
      </main>
    </div>
  );
}
