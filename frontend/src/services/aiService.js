import { api } from './api';

export async function sendAIChatMessage({ message, history = [] }) {
  const { data } = await api.post('/ai/chat', { message, history });
  return data;
}
