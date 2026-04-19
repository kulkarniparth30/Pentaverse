import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signUpWithEmail, signInWithGoogle } from '../services/supabaseClient'

const SignupPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSignup = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    if (password !== confirmPassword) { setError("Passwords do not match"); setLoading(false); return }
    try { await signUpWithEmail(email, password); setSuccess(true) }
    catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const handleGoogleSignup = async () => {
    try { await signInWithGoogle() } catch (err) { setError(err.message) }
  }

  const inp = {
    width: '100%', padding: '12px 14px',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10, color: '#f1f5f9', fontSize: 14, outline: 'none',
    transition: 'all 0.2s', boxSizing: 'border-box',
  }
  const focus = e => { e.target.style.borderColor = '#6366f1'; e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.12)' }
  const blur = e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.boxShadow = 'none' }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #030712 0%, #0f0a2e 40%, #0c1445 100%)',
      fontFamily: "'Inter', -apple-system, sans-serif", overflow: 'hidden', position: 'relative', padding: 24,
    }}>
      <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.10) 0%, transparent 70%)', top: '-10%', left: '-5%', animation: 'float 8s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)', bottom: '-5%', right: '-3%', animation: 'float 10s ease-in-out infinite reverse' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(99,102,241,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.025) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 420 }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, boxShadow: '0 0 50px rgba(99,102,241,0.3)', fontSize: 30, fontWeight: 900, fontStyle: 'italic', color: '#fff' }}>F</div>
          <h1 style={{ fontSize: 40, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', marginBottom: 8 }}>Forens<span style={{ color: '#818cf8' }}>IQ</span></h1>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>Start your forensic journey today</p>
        </div>

        {/* Card */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 24, padding: '36px 32px', backdropFilter: 'blur(20px)', boxShadow: '0 25px 60px rgba(0,0,0,0.4)' }}>
          {success ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', margin: '0 auto 24px', background: 'rgba(16,185,129,0.1)', border: '2px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>🎉</div>
              <h3 style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', marginBottom: 10 }}>Account Created!</h3>
              <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>Confirmation email sent to <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{email}</span></p>
              <button onClick={() => navigate('/login')} style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Go to Login</button>
            </div>
          ) : (
            <>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', textAlign: 'center', marginBottom: 4 }}>Create account</h2>
              <p style={{ color: '#64748b', fontSize: 14, textAlign: 'center', marginBottom: 28 }}>Start analyzing documents in minutes</p>

              <button onClick={handleGoogleSignup} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '13px 20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 12, color: '#e2e8f0', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}>
                <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#34A853" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#FBBC05" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>Continue with Google
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '22px 0' }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
                <span style={{ color: '#475569', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>or</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
              </div>

              <form onSubmit={handleSignup}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 7 }}>Email</label>
                  <input type="email" required placeholder="name@company.com" value={email} onChange={e => setEmail(e.target.value)} style={inp} onFocus={focus} onBlur={blur} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 7 }}>Password</label>
                  <input type="password" required placeholder="Min 6 characters" value={password} onChange={e => setPassword(e.target.value)} style={inp} onFocus={focus} onBlur={blur} />
                </div>
                <div style={{ marginBottom: 22 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 7 }}>Confirm Password</label>
                  <input type="password" required placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={inp} onFocus={focus} onBlur={blur} />
                </div>

                {error && <div style={{ padding: '11px 14px', borderRadius: 10, marginBottom: 18, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: '#f87171', fontSize: 13, fontWeight: 500 }}>⚠ {error}</div>}

                <button type="submit" disabled={loading} style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, transition: 'all 0.25s', boxShadow: '0 4px 20px rgba(99,102,241,0.25)' }}
                  onMouseEnter={e => { if(!loading) { e.currentTarget.style.boxShadow = '0 8px 30px rgba(99,102,241,0.4)'; e.currentTarget.style.transform = 'translateY(-1px)' }}}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,102,241,0.25)'; e.currentTarget.style.transform = 'translateY(0)' }}>
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </form>
            </>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>
          Already have an account? <Link to="/login" style={{ color: '#818cf8', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>

      <style>{`@keyframes float { 0%, 100% { transform: translateY(0px) scale(1); } 50% { transform: translateY(-30px) scale(1.05); } }`}</style>
    </div>
  )
}

export default SignupPage
