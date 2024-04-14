import { useState } from 'react'
import './ChatScreen.css';


type Message = {
    text: string
    isUser: boolean
}

const ChatScreen = () => {
    const [messages, setMessages] = useState<Message[]>([{ text: 'Ola', isUser: false }])
    const [input, setInput] = useState('')
    const [loadingResponse, setLoadingResponse] = useState(false)

    const sendMessage = () => {
        if (input) {
            setMessages([...messages, { text: input, isUser: true }])
            setInput('')
            setLoadingResponse(true)
            setTimeout(() => {
                setLoadingResponse(false)
                setMessages((prev) => [...prev, { text: 'nao implementado', isUser: false }])
            }, 2000)
            // chamar a API aqui
        }
    }

    return (
        <div>
            <h1>Chat</h1>
            <div>
                {messages.map((message, index) => (
                    <div key={index} style={{ textAlign: message.isUser ? 'right' : 'left' }}>
                        {message.text}
                    </div>
                ))}
                {loadingResponse && <div className="loading"></div>}
            </div>
            <input
                type="text"
                placeholder="Type a message"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        sendMessage()
                    }
                }}
            />
            <button onClick={sendMessage}>Enviar</button>
        </div>
    )
}

export default ChatScreen

