import { type FormEvent, useState } from 'react'
import { signInWithEmailPassword } from '../auth'

type LoginPanelProps = {
  heading?: string
  message?: string
  onSignedIn?: () => void
}

const LoginPanel = ({
  heading = 'Customer login',
  message = 'Sign in with the account Jeremy created for your garden.',
  onSignedIn,
}: LoginPanelProps) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      await signInWithEmailPassword(email.trim(), password)
      setPassword('')
      onSignedIn?.()
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Login failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="login-panel" onSubmit={handleSubmit}>
      <div className="login-panel-heading">
        <h2>{heading}</h2>
        <span>{message}</span>
      </div>

      <label>
        <span>Email</span>
        <input
          autoComplete="email"
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
      </label>

      <label>
        <span>Password</span>
        <input
          autoComplete="current-password"
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </label>

      {error ? <p className="login-panel-error">{error}</p> : null}

      <button disabled={isSubmitting} type="submit">
        {isSubmitting ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  )
}

export default LoginPanel
