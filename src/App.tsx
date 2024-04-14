import { useState } from 'react'
import ChatScreen from './ChatScreen'

type User = {
  username: string
  password: string
}

const predefinedUser: User = {
  username: 'admin',
  password: 'admin',
}


const App = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)


  const handleLogin = () => {
    if (username === predefinedUser.username && password === predefinedUser.password) {
      setError('')
      alert('Login successful!')
      setIsLoggedIn(true)
    } else {
      setError('Usuario ou senha incorretos')
    }
  }

  return (
    <div>
      {isLoggedIn ? <><h1>Oi {username}</h1>
        <button onClick={() => setIsLoggedIn(false)}>Logout</button>
        <ChatScreen />
      </>
        : <>
          <h1>Login</h1>
          <div>
            <label>Username</label>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <label>Password</label>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleLogin()
                }
              }}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button onClick={handleLogin}>Login</button>
          <p style={{ color: 'red' }}>{error}</p>
        </>
      }
    </div>
  )
}


export default App