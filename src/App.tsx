import { useState } from 'react'
import ChatScreen from './ChatScreen'
import "./App.css"
import { Logo } from './Logo'

type User = {
  username: string
  password: string
}

const predefinedUser: User = {
  username: 'admin',
  password: 'admin',
}

const users: User[] = []



const App = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isCadastro, setIsCadastro] = useState(false)
  const [loadingLogin, setLoadingLogin] = useState(false)


  const handleLogin = () => {
    if (username === predefinedUser.username && password === predefinedUser.password) {
      setError('')
      setLoadingLogin(true)
      setTimeout(() => {
        setLoadingLogin(false)
        setIsLoggedIn(true)
      }, 1500);
      //alert('Login successful!')
    } else {
      setError('Usuario ou senha incorretos')
    }
  }

  if (isLoggedIn) {
    return <ChatScreen logout={() => {
      setIsLoggedIn(false)
    }} />
  }

  return (
    <div className="mainScreen">
      <div className="background">

      </div>
      <div className="loginPartition">
        <Logo />
        {isCadastro ? <h1>Cadastro</h1> : <h1>Login</h1>}

        {!isCadastro && (
          <>
            <div className="loginForm">
              <label>Nome de usuario</label>
              <input
                type="text"
                placeholder="Nome de usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <label>Senha</label>
              <input
                type="password"
                placeholder="Senha"
                value={password}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleLogin()
                  }
                }}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button onClick={handleLogin}>
              {loadingLogin ? <div className="loading"></div> : 'Login'}
            </button>
            <p style={{ color: 'red' }}>{error}</p>
          </>
        )}

        {isCadastro && <div className="loginForm">
          <label>Nome de usuario</label>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <label>Email</label>
          <input
            type="text"
            placeholder="Email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}>

          </input>
          <label>Nome</label>
          <input
            type="text"
            placeholder="Nome"
            value={username}
            onChange={(e) => setUsername(e.target.value)}>

          </input>
          <label>Senha</label>
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
          <div>
            <button onClick={handleLogin}>Cadastrar</button>
            <p style={{ color: 'red' }}>{error}</p>
          </div>
        </div>}
        {isCadastro ? <div>
          Ja possui uma conta? <button onClick={() => {
            setIsCadastro(false)
          }}>Login</button>
        </div> :
          <div>
            Nao tem uma conta? <button onClick={() => {
              setIsCadastro(true)
            }}>Cadastre-se</button>
          </div>}
      </div>
    </div>
  )
}


export default App