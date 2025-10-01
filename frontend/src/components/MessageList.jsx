import React from 'react'

export default function MessageList({ me, messages }) {
	return (
		<div className="panel">
			{messages.length === 0 ? (
				<div style={{ color: '#9ca3af' }}>No messages yet.</div>
			) : (
				messages.map((m) => (
					<div key={m._id || `${m.sender}-${m.timestamp}-${Math.random()}`} className={`msg-row ${m.sender === me ? 'right' : ''}`}>
						<div className={`bubble ${m.sender === me ? 'me' : 'peer'}`}>
							<div className="meta">{m.sender}</div>
							<div>{m.message}</div>
							<div className="time">{new Date(m.timestamp).toLocaleTimeString()}</div>
						</div>
					</div>
				))
			)}
		</div>
	)
} 