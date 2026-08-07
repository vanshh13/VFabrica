import { api } from './api';

export async function onboardBuyer(payload) {
  const { data } = await api.post('/buyer/onboard', payload);
  return data;
}

export async function getBuyerProfile() {
  const { data } = await api.get('/buyer/profile');
  return data;
}

export async function updateBuyerProfile(payload) {
  const { data } = await api.put('/buyer/profile', payload);
  return data;
}

export async function getBuyerAddresses() {
  const { data } = await api.get('/buyer/addresses');
  return data;
}

export async function addBuyerAddress(payload) {
  const { data } = await api.post('/buyer/addresses', payload);
  return data;
}

export async function deleteBuyerAddress(addressId) {
  const { data } = await api.delete(`/buyer/addresses/${addressId}`);
  return data;
}

export async function getMarketplaceProducts(params) {
  const { data } = await api.get('/buyer/products', { params });
  return data;
}

export async function getProductDetails(id) {
  const { data } = await api.get(`/buyer/products/${id}`);
  return data;
}

export async function getRecommendations(params) {
  const { data } = await api.get('/buyer/products/recommendations', { params });
  return data;
}

export async function getCart() {
  const { data } = await api.get('/buyer/cart');
  return data;
}

export async function addToCartApi(payload) {
  const { data } = await api.post('/buyer/cart', payload);
  return data;
}

export async function updateCartItemApi(payload) {
  const { data } = await api.put('/buyer/cart', payload);
  return data;
}

export async function removeCartItemApi(id) {
  const { data } = await api.delete(`/buyer/cart/items/${id}`);
  return data;
}

export async function clearCartApi() {
  const { data } = await api.delete('/buyer/cart');
  return data;
}

export async function checkoutCart(payload) {
  const { data } = await api.post('/buyer/checkout', payload);
  return data;
}

export async function getBuyerOrders() {
  const { data } = await api.get('/buyer/orders');
  return data;
}

export async function getBuyerOrderDetails(orderId) {
  const { data } = await api.get(`/buyer/orders/${orderId}`);
  return data;
}

export async function cancelBuyerOrder(orderId, remarks) {
  const { data } = await api.put(`/buyer/orders/${orderId}/cancel`, { remarks });
  return data;
}

export async function reorderBuyerOrder(orderId) {
  const { data } = await api.post(`/buyer/orders/${orderId}/reorder`);
  return data;
}

export async function getSuppliers(params) {
  const { data } = await api.get('/buyer/suppliers', { params });
  return data;
}

export async function getFavorites() {
  const { data } = await api.get('/buyer/favorites');
  return data;
}

export async function addFavorite(productId) {
  const { data } = await api.post(`/buyer/favorites/${productId}`);
  return data;
}

export async function removeFavorite(productId) {
  const { data } = await api.delete(`/buyer/favorites/${productId}`);
  return data;
}
