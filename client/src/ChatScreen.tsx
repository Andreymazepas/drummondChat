import { useEffect, useState } from 'react'
import './ChatScreen.css';
import { Logo } from './Logo';
import { decodeJwt, jwtDecrypt } from 'jose';


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
        <>
            <Overlay />
            <div className="popup">
                <div className="popupContent">
                    {children}
                </div>
            </div>
        </>
    )
}

const baseUrl = 'http://localhost:3000'

const Overlay = () => {
    return (
        <div className="overlay" > </div>

    )
}

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
            // remove the quotes from the text
            .then(text => text.replace(/"/g, ''))
            .then(text => text.replace(/\\n/g, '\n'))
            .then(text => text.replace(/\\t/g, '\t'))
            .then(text => text.replace(/\\'/g, '\''))
            // remove the
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
        <>
            <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                rows={30}
                cols={100}

            />
            <div>
                <button onClick={onClose}>Cancelar</button>
                <button onClick={submitTrainingText}>Enviar</button>
            </div>
        </>
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
                                <button onClick={() => deleteUser(user._id)}>Apagar</button>
                                <button onClick={() => toggleAdmin(user._id)}>
                                    {user.isAdmin ? 'Remover Admin' : 'Tornar Admin'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <button onClick={onClose}>Fechar</button>
        </div>
    )
}




const initial_message = "Olá, eu sou o assistente virtual da faculdade UniDrummond. Como posso te ajudar?"
const ChatScreen = ({ logout }: { logout: () => void }) => {
    const [messages, setMessages] = useState<Message[]>([{ text: initial_message, isUser: false }])
    const [input, setInput] = useState('')
    const [loadingResponse, setLoadingResponse] = useState(false)
    const [showEditUsers, setShowEditUsers] = useState(false)
    const [showTrainingText, setShowTrainingText] = useState(false)
    const [isAdmin, setIsAdmin] = useState(false)

    const sendMessage = async (message?: string) => {
        if (!message && !input) {
            return
        }
        const _message = message || input || '';
        if (_message.trim() === '') {
            return
        }
        setMessages([...messages, { text: _message, isUser: true }])
        setInput('')
        setLoadingResponse(true)

        try {
            // call /answer api with the input
            const response = await fetch(baseUrl + '/answer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ question: _message })
            })

            if (!response.ok) {
                throw new Error('Error fetching response from ChatGPT')
            }

            const data = await response.json()

            const generatedText = data.answer;

            setLoadingResponse(false)
            setMessages(prev => [...prev, { text: generatedText, isUser: false }])
        } catch (error) {
            console.error('Error fetching response from server:', error)
            setLoadingResponse(false)
            setMessages(prev => [...prev, { text: 'Estou passando por dificuldades tecnicas', isUser: false }])
        }
    }

    useEffect(() => {
        // find last message and scroll into view
        const lastMessage = document.getElementById('lastMessage')
        if (lastMessage) {
            lastMessage.scrollIntoView({ behavior: 'smooth' })
        }
    }, [messages])

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token === null) {
            logout();
        }
        const decoded = decodeJwt(String(token));
        if (decoded.isAdmin === true) {
            setIsAdmin(true);
        }


    }, []);



    return (
        <>
            {showTrainingText && <Popup><TrainingText onClose={() => setShowTrainingText(false)} /></Popup>}
            {showEditUsers && <Popup><EditUsers onClose={() => setShowEditUsers(false)} /></Popup>}

            <div className={`chatScreen ${showEditUsers || showTrainingText ? 'popupOpen' : ''} `}>

                <div className="chatContainer">
                    <div className="chatHeader">
                        <div className="logoContainer">
                            <Logo />
                        </div>
                        <div style={{ display: "flex", alignItems: "center" }}>
                            {isAdmin && (
                                <div style={{ display: "flex" }}>
                                    <button onClick={() => setShowEditUsers(true)}>Editar usuarios</button>
                                    <button onClick={() => setShowTrainingText(true)}>Texto de treinamento</button>
                                </div>
                            )}
                            <a onClick={logout} style={{ cursor: "pointer" }}>Sair</a>
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
                                    sendMessage(example)
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
        </>
    )
}

export default ChatScreen

