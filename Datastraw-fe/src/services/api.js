const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export async function fetchConversations() {
  const res = await fetch(`${API_BASE}/api/conversations`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch conversations');
  return data.data;
}

export async function fetchConversationById(id) {
  const res = await fetch(`${API_BASE}/api/conversations/${id}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch conversation');
  return data.data;
}

export async function fetchCustomerConversation(customerId) {
  const res = await fetch(`${API_BASE}/api/conversations/customer/${customerId}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch customer conversation');
  return data.data;
}

export async function approveAIDraft(conversationId, approvedText, draftId) {
  const res = await fetch(`${API_BASE}/api/conversations/${conversationId}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ approvedText, draftId })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to approve draft');
  return data;
}

export async function sendCustomerMessage({ customerId, customerName, customerPhone, text }) {
  const res = await fetch(`${API_BASE}/api/conversations/customer/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ customerId, customerName, customerPhone, text })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to send message');
  return data.data;
}

export async function fetchCustomers() {
  const res = await fetch(`${API_BASE}/api/conversations/customers/all`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch customers');
  return data.data;
}

export async function loginAgent(email, password) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Invalid credentials');
  return data;
}
