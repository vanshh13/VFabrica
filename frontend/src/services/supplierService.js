import { api } from './api';

export async function onboardSupplier(payload) {
  const { data } = await api.post('/supplier/onboard', payload);
  return data;
}

export async function getSupplierProfile() {
  const { data } = await api.get('/supplier/profile');
  return data;
}

export async function updateSupplierProfile(payload) {
  const { data } = await api.put('/supplier/profile', payload);
  return data;
}

export async function getSupplierDashboard() {
  const { data } = await api.get('/supplier/dashboard');
  return data;
}

export async function getSupplierProducts(options) {
  if (options) {
    const { data } = await api.post('/supplier/products/query', options);
    return data;
  }
  const { data } = await api.get('/supplier/products');
  return data;
}

export async function getSupplierProductDetails(productId) {
  const { data } = await api.get(`/supplier/products/${productId}`);
  return data;
}

export async function createSupplierProduct(payload) {
  const { data } = await api.post('/supplier/products', payload);
  return data;
}

export async function updateSupplierProduct(productId, payload) {
  const { data } = await api.put(`/supplier/products/${productId}`, payload);
  return data;
}

export async function deleteSupplierProduct(productId) {
  const { data } = await api.delete(`/supplier/products/${productId}`);
  return data;
}

export async function updateSupplierStock(payload) {
  const { data } = await api.patch('/supplier/products/stock', payload);
  return data;
}

export async function getSupplierOrders(options) {
  if (options) {
    const { data } = await api.post('/supplier/orders', options);
    return data;
  }
  const { data } = await api.get('/supplier/orders');
  return data;
}

export async function updateSupplierOrderStatus(orderId, status) {
  const { data } = await api.patch(`/supplier/orders/${orderId}/status`, { status });
  return data;
}
