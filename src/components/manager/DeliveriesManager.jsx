// src/components/manager/DeliveriesManager.jsx
import React, { useState, useEffect } from 'react'
import { fetchAllDeliveries } from '../../api/managerService'

export default function DeliveriesManager() {
  const [deliveries, setDeliveries] = useState([])

  useEffect(() => {
    async function load() {
      const data = await fetchAllDeliveries()
      setDeliveries(data)
    }
    load()
  }, [])

  return (
    <div>
      <h2>🚚 Teslimatlar</h2>
      <ul>
        {deliveries.map(d => (
          <li key={d._id}>
            ID: {d._id}, Müşteri: {d.user.name}, Ürün: {d.items.length} adet, Durum: {d.status}
          </li>
        ))}
      </ul>
    </div>
  )
}
