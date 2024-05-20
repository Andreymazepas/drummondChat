import { useEffect, useState } from 'react'
import './ChatScreen.css';
import { Logo } from './Logo';


type Message = {
    text: string
    isUser: boolean
}

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

const Popup = ({ children }) => {
    return (
        <div className="popup">
            <div className="popupContent">
                {children}
            </div>
        </div>
    )
}

const baseUrl = 'http://localhost:3000'

const TrainingText = ({ onClose }) => {
    // load training text from the /training-text api
    // show as a textarea
    // two buttons: cancel and submit
    // submit will send the text to the /train-text api

    const [text, setText] = useState('')

    useEffect(() => {
        fetch(baseUrl + '/training-text', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
            .then(response => response.text())
            .then(text => setText(text))
            .catch(error => console.error('Error fetching training text:', error))
    }, [])

    const submitTrainingText = () => {
        fetch(baseUrl + '/training-text', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ text })
        })
            .then(response => response.json())
            .then(data => {

                onClose()

            })
            .catch(error => console.error('Error submitting training text:', error))
    }

    return (
        <div>
            <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                rows={10}
                cols={50}
            />
            <div>
                <button onClick={onClose}>Cancelar</button>
                <button onClick={submitTrainingText}>Enviar</button>
            </div>
        </div>
    )
}

const EditUsers = ({ onClose }) => {
    // fetch all users from the /users api
    // show as a list of usernames with two icons: delete and a toggle for admin status
    // clicking on delete will delete the user
    // clicking on the toggle will toggle the admin status
    // close button
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch(baseUrl + '/users', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
            .then(response => response.json())
            .then(data => {
                setUsers(data)
                setLoading(false)
            })
            .catch(error => console.error('Error fetching users:', error))
    }, [])

    const deleteUser = (id) => {
        fetch(baseUrl + `/users/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
            .then(response => response.json())
            .then(data => {
                setUsers(users.filter(user => user.id !== id))
            })
            .catch(error => console.error('Error deleting user:', error))
    }

    const toggleAdmin = (id) => {
        fetch(baseUrl + `/users/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ isAdmin: !users.find(user => user._id === id).isAdmin })
        })
            .then(response => response.json())
            .then(data => {

                setUsers(users.map(user => {
                    if (user._id === id) {
                        user.isAdmin = !user.isAdmin
                    }
                    return user
                }))

            })
            .catch(error => console.error('Error toggling admin status:', error))
    }

    return (
        <div>
            {loading ? (
                <div>Loading...</div>
            ) : (
                <div style={{ width: '100%' }}>
                    {users.map(user => (
                        <div key={user.id} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '10px',
                            border: '1px solid #ccc',
                            margin: '5px'

                        }}>
                            <span>{user.name} - ({user.email}) {user.isAdmin ? 'ADMIN' : ''}</span>
                            <div>
                                <button onClick={() => deleteUser(user._id)}>Delete</button>
                                <button onClick={() => toggleAdmin(user._id)}>Toggle Admin</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <button onClick={onClose}>Close</button>
        </div>
    )
}





const ChatScreen = ({ logout }: { logout: () => void }) => {
    const [messages, setMessages] = useState<Message[]>([{ text: 'Ola', isUser: false }])
    const [input, setInput] = useState('')
    const [loadingResponse, setLoadingResponse] = useState(false)
    const [showEditUsers, setShowEditUsers] = useState(false)
    const [showTrainingText, setShowTrainingText] = useState(false)

    const sendMessage = async () => {
        if (input) {
            setMessages([...messages, { text: input, isUser: true }])
            setInput('')
            setLoadingResponse(true)

            try {
                // call /answer api with the input
                const response = await fetch(baseUrl + '/answer', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ question: input })
                })

                const data = await response.json()
                const generatedText = data.answer;

                setLoadingResponse(false)
                setMessages(prev => [...prev, { text: generatedText, isUser: false }])
            } catch (error) {
                console.error('Error fetching response from ChatGPT:', error)
                setLoadingResponse(false)
                setMessages(prev => [...prev, { text: 'Error fetching response', isUser: false }])
            }
        }
    }

    useEffect(() => {
        // find last message and scroll into view
        const lastMessage = document.getElementById('lastMessage')
        if (lastMessage) {
            lastMessage.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages])

    const isAdmin = true;

    return (
        <div className="chatScreen">
            {showEditUsers && <Popup><EditUsers onClose={() => setShowEditUsers(false)} /></Popup>}
            {showTrainingText && <Popup><TrainingText onClose={() => setShowTrainingText(false)} /></Popup>}
            <div className="chatContainer">
                <div className="chatHeader">
                    <div className="logoContainer">
                        <Logo />
                    </div>
                    <div style={{ display: "flex", alignItems: "center" }}>
                        {isAdmin && (
                            <div style={{ display: "flex" }}>
                                <button onClick={() => setShowEditUsers(true)}>Edit Users</button>
                                <button onClick={() => setShowTrainingText(true)}>Training Text</button>
                            </div>
                        )}
                        <a onClick={logout}>Sair</a>
                    </div>
                </div>
                <div className="chatMessages">
                    {messages.map((message, index) => (
                        <div id={index === messages.length - 1 ? 'lastMessage' : ''}
                            className={`chatBubble ${message.isUser ? 'chatColor2' : 'chatColor1'}`} key={index}>
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

