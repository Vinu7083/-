import axios from 'axios'

export const SOCKET_BASE_URL = window.location.origin

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

// Token storage helpers
const TOKEN_KEY = 'chatapp_token'
const USER_KEY = 'chatapp_user'

export function getAuthToken() {
	return localStorage.getItem(TOKEN_KEY) || ''
}
export function setAuthToken(token) {
	if (token) localStorage.setItem(TOKEN_KEY, token)
	else localStorage.removeItem(TOKEN_KEY)
}
export function getStoredUser() {
	const raw = localStorage.getItem(USER_KEY)
	try {
		return raw ? JSON.parse(raw) : null
	} catch {
		return null
	}
}
export function setStoredUser(user) {
	if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
	else localStorage.removeItem(USER_KEY)
}

// Attach Authorization header if token exists
api.interceptors.request.use((config) => {
	const token = getAuthToken()
	if (token) {
		config.headers = config.headers || {}
		config.headers.Authorization = `Bearer ${token}`
	}
	return config
})

export async function fetchMessages(sender, receiver) {
    const res = await api.get('/api/messages', { params: { sender, receiver } })
    return res.data
}

export async function postMessage(payload) {
    const res = await api.post('/api/messages', payload)
    return res.data
}

export async function register(username, password, passkey) {
    const res = await api.post('/api/auth/register', { username, password, passkey })
    return res.data
}

export async function login(username, password) {
    const res = await api.post('/api/auth/login', { username, password })
    return res.data
}

export async function logout() {
    const res = await api.post('/api/auth/logout')
    return res.data
}

export async function getUserStatus(username) {
    const res = await api.get(`/api/users/${encodeURIComponent(username)}/status`)
    return res.data
}

export async function clearConversation(sender, receiver) {
    const res = await api.delete('/api/messages', { params: { sender, receiver } })
    return res.data
}