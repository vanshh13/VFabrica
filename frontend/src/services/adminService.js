import { api } from './api';

let categoriesCachePromise = null;
let mastersCachePromise = null;

export async function getAdminDashboard() {
  const { data } = await api.get('/admin/dashboard');
  return data;
}

export async function getPendingSuppliers() {
  const { data } = await api.get('/admin/suppliers/pending');
  return data;
}

export async function reviewSupplier(payload) {
  const { data } = await api.patch('/admin/suppliers/review', payload);
  return data;
}

export async function getUsers() {
  const { data } = await api.get('/admin/users');
  return data;
}

export async function updateUserStatus(payload) {
  const { data } = await api.patch('/admin/users/status', payload);
  return data;
}

export async function getCategories(forceRefresh = false) {
  if (!categoriesCachePromise || forceRefresh) {
    categoriesCachePromise = api.get('/categories')
      .then(res => res.data)
      .catch(err => {
        categoriesCachePromise = null;
        throw err;
      });
  }
  return categoriesCachePromise;
}

export async function getCatalogMasters(forceRefresh = false) {
  if (!mastersCachePromise || forceRefresh) {
    mastersCachePromise = api.get('/categories/masters')
      .then(res => res.data)
      .catch(err => {
        mastersCachePromise = null;
        throw err;
      });
  }
  return mastersCachePromise;
}

export async function createCategory(payload) {
  categoriesCachePromise = null;
  const { data } = await api.post('/admin/categories', payload);
  return data;
}

export async function updateCategory(categoryId, payload) {
  categoriesCachePromise = null;
  const { data } = await api.patch(`/admin/categories/${categoryId}`, payload);
  return data;
}

export async function deleteCategory(categoryId) {
  categoriesCachePromise = null;
  const { data } = await api.delete(`/admin/categories/${categoryId}`);
  return data;
}

export async function seedMarketplaceData() {
  categoriesCachePromise = null;
  mastersCachePromise = null;
  const { data } = await api.post('/admin/seed/sample-data');
  return data;
}