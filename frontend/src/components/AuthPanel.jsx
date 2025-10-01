import React, { useState } from 'react'
import { login, register, setAuthToken, setStoredUser } from '../services/api'

export default function AuthPanel({ onAuthed }) {
	const [username, setUsername] = useState('')
	const [password, setPassword] = useState('')
	const [passkey, setPasskey] = useState('')
	const [mode, setMode] = useState('login')
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(false)

	async function handleSubmit(e) {
		e.preventDefault()
		setError('')
		setLoading(true)
		try {
			if (mode === 'register') {
				await register(username, password, passkey)
			}
			const res = await login(username, password)
			setAuthToken(res.token)
			setStoredUser(res.user)
			onAuthed(res.user)
		} catch (err) {
			setError(err?.response?.data?.error || 'Authentication failed')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="auth">
			<div className="auth-hero">
				<div className="auth-logo">Humraaz</div>
				<h1 className="auth-title">Cricket Watching LIVE</h1>
			</div>
			<div className="auth-card">
				<h3 style={{ marginTop: 0 }}>{mode === 'login' ? 'Login to APP' : 'Create your account'}</h3>
				<form onSubmit={handleSubmit} className="auth-form">
					<input
						type="text"
						placeholder="Username"
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						className="input"
					/>
					<input
						type="password"
						placeholder="Password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						className="input"
					/>
					{mode === 'register' ? (
						<input
							type="text"
							placeholder="Passkey"
							value={passkey}
							onChange={(e) => setPasskey(e.target.value)}
							className="input"
						/>
					) : null}
					<button type="submit" disabled={loading || !username || !password || (mode==='register' && !passkey)} className="button primary" style={{ width: '100%' }}>
						{loading ? 'Please wait…' : (mode === 'login' ? 'Login' : 'Register & Login')}
					</button>
				</form>
				{error ? <div style={{ color: 'crimson', marginTop: 8 }}>{error}</div> : null}
				<div className="auth-foot">
					{mode === 'login' ? (
						<span>New here? <button onClick={() => setMode('register')} className="link">Create an account</button></span>
					) : (
						<span>Have an account? <button onClick={() => setMode('login')} className="link">Log in</button></span>
					)}
				</div>
			</div>
		</div>
	)
} 