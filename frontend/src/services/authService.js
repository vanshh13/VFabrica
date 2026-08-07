import { api } from './api';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function login(payload) {
  const { data } = await api.post('/auth/login', payload);
  return data;
}

export async function register(payload) {
  const { data } = await api.post('/auth/register', payload);
  return data;
}

export async function requestPasswordReset(payload) {
  try {
    const { data } = await api.post('/auth/forgot-password', payload);
    return data;
  } catch (_error) {
    await delay(750);
    return {
      success: true,
      message:
        'Reset instructions have been prepared for this prototype. Connect the backend reset endpoint to complete delivery.'
    };
  }
}