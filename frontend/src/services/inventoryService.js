import { api } from './api';

// ─── Warehouse ────────────────────────────────────────────────────────
export async function getWarehouses() {
  const { data } = await api.get('/inventory/warehouses');
  return data;
}

export async function getWarehouseDashboard() {
  const { data } = await api.get('/inventory/warehouses/dashboard');
  return data;
}

export async function createWarehouse(payload) {
  const { data } = await api.post('/inventory/warehouses', payload);
  return data;
}

export async function updateWarehouse(warehouseId, payload) {
  const { data } = await api.put(`/inventory/warehouses/${warehouseId}`, payload);
  return data;
}

export async function deleteWarehouse(warehouseId) {
  const { data } = await api.delete(`/inventory/warehouses/${warehouseId}`);
  return data;
}

// ─── Inventory ────────────────────────────────────────────────────────
export async function getInventory(params = {}) {
  const { data } = await api.get('/inventory', { params });
  return data;
}

export async function assignInventory(payload) {
  const { data } = await api.post('/inventory/assign', payload);
  return data;
}

export async function adjustStock(payload) {
  const { data } = await api.patch('/inventory/stock', payload);
  return data;
}

export async function transferStock(payload) {
  const { data } = await api.post('/inventory/transfer', payload);
  return data;
}

// ─── Transactions ─────────────────────────────────────────────────────
export async function getInventoryTransactions(params = {}) {
  const { data } = await api.get('/inventory/transactions', { params });
  return data;
}
