import { useState } from 'react'
import './ChatScreen.css';
import { Logo } from './Logo';


type Message = {
    text: string
    isUser: boolean
}

const CHATGPT_API_KEY = 'YOUR_API_KEY'
const CHATGPT_API_URL = 'https://api.openai.com/v1/engines/davinci-codex/completions'
const CHATGPT_PROMPT = 'Voce vai ser um assistente de IA cuja unica funcao é ajudar possiveis alunos e alunos sobre a faculdade UniDrummond. '
const CHATGPT_EXAMPLES = [
    "Onde fica a faculdade?",
    "Qual o telefone da faculdade?",
    "Quais os cursos oferecidos?",
    "Qual o valor da mensalidade?",
    "Qual o horario de funcionamento?",
    "Qual a duracao dos cursos?",
    "Qual a localizacao da faculdade?",
    "Qual o site da faculdade?",
];


const ChatScreen = ({ logout }: { logout: () => void }) => {
    const [messages, setMessages] = useState<Message[]>([{ text: 'Ola', isUser: false }])
    const [input, setInput] = useState('')
    const [loadingResponse, setLoadingResponse] = useState(false)

    const sendMessage = async () => {
        if (input) {
            setMessages([...messages, { text: input, isUser: true }])
            setInput('')
            setLoadingResponse(true)

            try {
                const response = await fetch(CHATGPT_API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${CHATGPT_API_KEY}`
                    },
                    body: JSON.stringify({
                        prompt: CHATGPT_PROMPT,
                        max_tokens: 100
                    })
                })

                const data = await response.json()
                const generatedText = data.choices[0].text.trim()

                setLoadingResponse(false)
                setMessages(prev => [...prev, { text: generatedText, isUser: false }])
            } catch (error) {
                console.error('Error fetching response from ChatGPT:', error)
                setLoadingResponse(false)
                setMessages(prev => [...prev, { text: 'Error fetching response', isUser: false }])
            }
        }
    }

    return (
        <div className="chatScreen">
            <div className="chatContainer">
                <div className="chatHeader">
                    <div className="logoContainer">
                        <Logo />
                    </div>

                    <a onClick={logout}>Sair</a>
                </div>
                <div className="chatMessages">
                    {messages.map((message, index) => (
                        <div className={`chatBubble ${message.isUser ? 'chatColor2' : 'chatColor1'}`} key={index}>
                            {message.text}
                        </div>
                    ))}
                    {loadingResponse && <div className="loading"></div>}
                </div>
                <div>
                    <div className="suggestions">
                        {CHATGPT_EXAMPLES.map((example, index) => (
                            <button className="suggestion" key={index} onClick={() => {
                                setInput(example)
                                setTimeout(() => sendMessage(), 500)
                            }}>{example}</button>
                        ))}
                    </div>
                    <div className="chatInput">
                        <input
                            className="messageInput"
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
                        <button className="sendButton" onClick={sendMessage}>Enviar</button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ChatScreen

