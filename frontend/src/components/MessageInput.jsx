import React, { useState } from 'react'

export default function MessageInput({ onSend, disabled }) {
	const [text, setText] = useState('')

	function submit(e) {
		e.preventDefault()
		if (!text.trim() || disabled) return
		onSend(text)
		setText('')
	}

	return (
		<form onSubmit={submit} style={{ display: 'flex', gap: 8 }}>
			<input
				type="text"
				placeholder="Type a message..."
				value={text}
				onChange={(e) => setText(e.target.value)}
				className="input"
				disabled={disabled}
			/>
			<button type="submit" disabled={disabled} className="button primary">Send</button>
		</form>
	)
} 