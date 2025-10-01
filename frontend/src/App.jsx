import React, { useEffect, useMemo, useState } from 'react'
import { io } from 'socket.io-client'
import MessageList from './components/MessageList'
import MessageInput from './components/MessageInput'
import AuthPanel from './components/AuthPanel'
import { fetchMessages, postMessage, SOCKET_BASE_URL, getStoredUser, setAuthToken, setStoredUser, clearConversation, getUserStatus, logout as apiLogout } from './services/api'

export default function App() {
	const [me, setMe] = useState('')
	const [peer, setPeer] = useState('')
	const [messages, setMessages] = useState([])
	const [connected, setConnected] = useState(false)
	const [user, setUser] = useState(() => getStoredUser())
	const [isPolling, setIsPolling] = useState(false)
	const [peerStatus, setPeerStatus] = useState({ online: false, lastLogoutAt: null })

	const socket = useMemo(
		() => io(import.meta.env.VITE_API_URL, {
			transports: ['websocket', 'polling'],
			reconnection: true,
			reconnectionAttempts: Infinity,
			reconnectionDelay: 1000,
			reconnectionDelayMax: 5000,
			timeout: 20000,
		}),
		[]
	)

	useEffect(() => {
		socket.on('connect', () => setConnected(true))
		socket.on('disconnect', () => setConnected(false))
		socket.on('connect_error', (e) => { /* optional log */ })
		socket.on('new_message', (msg) => {
			const relevant =
				(me && peer && (
					(msg.sender === me && msg.receiver === peer) ||
					(msg.sender === peer && msg.receiver === me)
				)) || !me || !peer
			if (relevant) {
				setMessages((prev) => [...prev, msg])
			}
		})
		socket.on('chat_cleared', (info) => {
			const { sender, receiver } = info || {}
			const relevant =
				(me && peer && (
					(sender === me && receiver === peer) ||
					(sender === peer && receiver === me)
				))
			if (relevant) {
				setMessages([])
			}
		})
		return () => {
			socket.close()
		}
	}, [socket, me, peer])

	useEffect(() => {
		if (user && user.username) {
			setMe(user.username)
		}
	}, [user])

	useEffect(() => {
		if (!isPolling || !me || !peer) return
		const id = setInterval(() => {
			fetchMessages(me, peer).then(setMessages).catch(() => {})
		}, 2000)
		return () => clearInterval(id)
	}, [isPolling, me, peer])

	useEffect(() => {
		if (!peer) { setPeerStatus({ online: false, lastLogoutAt: null }); return }
		let stopped = false
		async function pollOnce() {
			try {
				const s = await getUserStatus(peer)
				if (!stopped) setPeerStatus({ online: !!s.online, lastLogoutAt: s.lastLogoutAt || null })
			} catch {
				if (!stopped) setPeerStatus({ online: false, lastLogoutAt: null })
			}
		}
		pollOnce()
		const id = setInterval(pollOnce, 5000)
		return () => { stopped = true; clearInterval(id) }
	}, [peer])

	async function loadHistory() {
		if (!me || !peer) return
		const data = await fetchMessages(me, peer)
		setMessages(data)
		setIsPolling(true)
	}

	async function handleSend(text) {
		if (!me || !peer || !text.trim()) return
		await postMessage({ sender: me, receiver: peer, message: text })
	}

	async function handleClear() {
		if (!me || !peer) return
		const ok = window.confirm('Clear this conversation for everyone?')
		if (!ok) return
		try {
			await clearConversation(me, peer)
			setMessages([])
			window.alert('Conversation cleared')
		} catch (e) {
			const msg = e?.response?.data?.error || e?.message || 'Failed to clear conversation'
			window.alert(msg)
		}
	}

	async function handleLogout() {
		try { await apiLogout() } catch {}
		try { socket.disconnect() } catch {}
		setAuthToken('')
		setStoredUser(null)
		setUser(null)
		setMe('')
		setPeer('')
		setMessages([])
		setIsPolling(false)
		setPeerStatus({ online: false, lastLogoutAt: null })
	}

	useEffect(() => { setIsPolling(false) }, [me, peer])

	if (!user) {
		return <AuthPanel onAuthed={setUser} />
	}

	const peerStatusText = peerStatus.online ? 'Online' : (peerStatus.lastLogoutAt ? `Last seen: ${new Date(peerStatus.lastLogoutAt).toLocaleString()}` : 'Offline')
	const peerStatusClass = peerStatus.online ? 'badge positive' : 'badge'

	return (
		<div className="app">
			<div className="header">
				<h2 className="title">Simple Two-Person Chat</h2>
				<div className="actions">
					<span className={peerStatusClass}>{peer ? `${peer}: ${peerStatusText}` : ''}</span>
					<button onClick={handleClear} className="button ghost">Clear</button>
					<button onClick={handleLogout} className="button">Logout</button>
				</div>
			</div>
			<div className="controls">
				<input
					type="text"
					placeholder="Your name"
					value={me}
					onChange={(e) => setMe(e.target.value)}
					className="input"
				/>
				<input
					type="text"
					placeholder="Their name"
					value={peer}
					onChange={(e) => setPeer(e.target.value)}
					className="input"
				/>
				<button onClick={loadHistory} className="button primary">Load</button>
			</div>
			<div className={`status ${connected ? 'connected' : 'disconnected'}`}>
				{connected ? 'Connected' : 'Disconnected'}
			</div>
			<MessageList me={me} messages={messages} />
			<MessageInput onSend={handleSend} disabled={!me || !peer} />
		</div>
	)
}