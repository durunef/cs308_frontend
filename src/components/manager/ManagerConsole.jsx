import React from 'react'
import { NavLink, Routes, Route, Navigate } from 'react-router-dom'
import ProductsManager from './ProductsManager'

export default function ManagerConsole() {
  return (
    <div
      style={{
        display: 'flex',
        minHeight: '70vh',
        fontFamily: 'Trebuchet MS, sans-serif'
      }}
    >
      {/* Sidebar */}
      <aside
        style={{
          width: 200,
          padding: '1.5rem',
          borderRight: '1px solid rgba(0,0,0,0.1)',
          background: '#fafafa'
        }}
      >
        <h3 style={{ color: '#8B4513', marginBottom: '1rem' }}>
          Manager Menu
        </h3>
        <nav>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ marginBottom: '0.5rem' }}>
              <NavLink
                to="/manager/products"
                end
                style={({ isActive }) => ({
                  textDecoration: 'none',
                  color: isActive ? '#fff' : '#8B4513',
                  background: isActive ? '#8B4513' : 'transparent',
                  padding: '0.4rem 0.8rem',
                  borderRadius: 4,
                  display: 'inline-block'
                })}
              >
                Products
              </NavLink>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Content */}
      <main
        style={{
          flex: 1,
          padding: '2rem',
          background: '#fdf8f0'
        }}
      >
        <Routes>
          {/* /manager → /manager/products */}
          <Route index element={<Navigate to="products" replace />} />

          {/* /manager/products */}
          <Route path="products" element={<ProductsManager />} />

          {/* Not found */}
          <Route path="*" element={<h2>❓ Page Not Found</h2>} />
        </Routes>
      </main>
    </div>
  )
}
