import { useState } from 'react'
import ChatScreen from './ChatScreen'
import "./App.css"
import { Logo } from './Logo'


const App = () => {
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isCadastro, setIsCadastro] = useState(false)
  const [loadingLogin, setLoadingLogin] = useState(false)


  const handleLogin = () => {
    setLoadingLogin(true)
    setError('')
    fetch('http://localhost:3000/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    })
      .then((res) => res.json())
      .then((data) => {
        setLoadingLogin(false)
        if (data.error) {
          setError(data.error)
          return
        }

        if (data.token) {
          localStorage.setItem('token', data.token)
          setIsLoggedIn(true)
        }
      })
  }

  const handleCadastro = () => {
    setLoadingLogin(true)
    setError('')
    fetch('http://localhost:3000/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password, name, phone })
    })
      .then((res) => res.json())
      .then((data) => {
        setLoadingLogin(false)
        if (data.error) {
          setError(data.error)
          return
        }

        if (data.token) {
          localStorage.setItem('token', data.token)
          setIsLoggedIn(true)
        }
      })
  }

  if (isLoggedIn) {
    return <ChatScreen logout={() => {
      setIsLoggedIn(false);
      localStorage.removeItem('token');
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
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
          <label>Email</label>
          <input
            type="text"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}>

          </input>
          <label>Nome</label>
          <input
            type="text"
            placeholder="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}>
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
          <label>Telefone</label>
          <input
            type="text"
            placeholder="Telefone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}>
          </input>
          <div>
            <button onClick={handleCadastro}>Cadastrar</button>
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