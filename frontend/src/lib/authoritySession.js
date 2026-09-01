const SESSION_KEY = 'resqgrid.session'
export const DEFAULT_AUTHORITY_SESSION = {
  token: 'auth-commander-session-key',
  user: {
    email: 'commander@resqgrid.gov',
    name: 'Command Administrator',
    role: 'authority',
    verified: true,
    designation: 'Disaster Incident Commander',
    department: 'OSDMA Central Command',
  },
}
export function setSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session))
}
export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
  }
  return null
}
export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}
export function getAuthorityToken() {
  return getSession()?.token || DEFAULT_AUTHORITY_SESSION.token
}
export function getAuthorityUsername() {
  return getSession()?.user?.name || DEFAULT_AUTHORITY_SESSION.user.name
}
export function getAuthorityEmail() {
  return getSession()?.user?.email || (isShelterAuthenticated() ? 'shelter@resqgrid.gov' : 'commander@resqgrid.gov')
}
export function isAuthorityAuthenticated() {
  const session = getSession()
  return !!session?.token && (session.user?.role === 'authority' || session.user?.role === 'admin')
}
export function isShelterAuthenticated() {
  const session = getSession()
  return !!session?.token && session.user?.role === 'shelter'
}
export const setAuthoritySession = setSession
export const clearAuthoritySession = clearSession
