import { useState, type FormEvent } from 'react'

import { PixelIcon } from './components/PixelIcon'
import './auth-flow.css'

type LoginPageProps = {
  onLogin: (caretakerName: string) => void
}

type OnboardingPageProps = {
  caretakerName: string
  onComplete: (petName: string) => void
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [caretakerName, setCaretakerName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const trimmed = caretakerName.trim()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (trimmed.length < 2) {
      setError('请输入至少 2 个字符。')
      return
    }

    onLogin(trimmed)
  }

  return (
    <main className='auth-shell'>
      <section className='auth-panel' aria-labelledby='login-title'>
        <div className='auth-mark' aria-hidden='true'>
          <PixelIcon name='spark' />
        </div>
        <p className='auth-kicker'>Tamakey</p>
        <h1 id='login-title'>照护者登录</h1>
        <p className='auth-copy'>
          创建一个本地身份，用来保存这台设备上的宠物进度。
        </p>

        <form className='auth-form' onSubmit={handleSubmit}>
          <label htmlFor='caretaker-name'>照护者名字</label>
          <input
            id='caretaker-name'
            maxLength={16}
            placeholder='例如 小钥匙'
            value={caretakerName}
            onChange={(event) => {
              setCaretakerName(event.target.value)
              setError(null)
            }}
          />
          {error ? <p className='auth-error'>{error}</p> : null}
          <button type='submit'>进入</button>
        </form>
      </section>
    </main>
  )
}

export function OnboardingPage({
  caretakerName,
  onComplete,
}: OnboardingPageProps) {
  const [petName, setPetName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const trimmed = petName.trim()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (trimmed.length < 2) {
      setError('宠物名字至少需要 2 个字符。')
      return
    }

    onComplete(trimmed)
  }

  return (
    <main className='auth-shell'>
      <section className='auth-panel' aria-labelledby='onboarding-title'>
        <div className='auth-mark auth-mark--egg' aria-hidden='true'>
          <PixelIcon name='care' />
        </div>
        <p className='auth-kicker'>欢迎，{caretakerName}</p>
        <h1 id='onboarding-title'>给宠物命名</h1>
        <p className='auth-copy'>
          这个名字会写入本地存档，之后会显示在状态和菜单里。
        </p>

        <form className='auth-form' onSubmit={handleSubmit}>
          <label htmlFor='pet-name'>宠物名字</label>
          <input
            id='pet-name'
            maxLength={16}
            placeholder='例如 塔塔'
            value={petName}
            onChange={(event) => {
              setPetName(event.target.value)
              setError(null)
            }}
          />
          {error ? <p className='auth-error'>{error}</p> : null}
          <button type='submit'>开始照护</button>
        </form>
      </section>
    </main>
  )
}
