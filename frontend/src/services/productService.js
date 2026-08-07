import { api } from './api';

const productDetailsCache = new Map();

export async function getProducts(params = {}) {
  try {
    const { data } = await api.post('/products', params);
    return data;
  } catch (e) {
    const { data } = await api.get('/products', { params });
    return data;
  }
}

export async function getProductDetails(productId) {
  if (productDetailsCache.has(productId)) {
    return productDetailsCache.get(productId);
  }
  const promise = api.get(`/products/${productId}`)
    .then(res => res.data)
    .catch(err => {
      productDetailsCache.delete(productId);
      throw err;
    });
  productDetailsCache.set(productId, promise);
  return promise;
}

export function prefetchProductDetails(productId) {
  if (!productId || productDetailsCache.has(productId)) return;
  getProductDetails(productId).catch(() => {});
}
