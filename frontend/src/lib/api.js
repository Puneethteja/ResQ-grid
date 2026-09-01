import { API_BASE_URL } from './constants.js'
import { getAuthorityToken, clearAuthoritySession } from './authoritySession.js'
class ApiError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
  }
}
async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (auth) {
    const token = getAuthorityToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }
  let res
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('Cannot reach the server. Check your connection and try again.', 0)
  }
  const isJson = res.headers.get('content-type')?.includes('application/json')
  const data = isJson ? await res.json().catch(() => null) : null
  if (!res.ok) {
    if (res.status === 401 && auth) clearAuthoritySession()
    throw new ApiError(data?.detail || `Request failed (${res.status})`, res.status)
  }
  return data
}
async function sha256(value) {
  if (!window.crypto?.subtle) return `fallback-${Date.now()}`
  const bytes = new TextEncoder().encode(value)
  const digest = await window.crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}
export function getDeviceId() {
  let deviceId = localStorage.getItem('resqgrid.deviceId')
  if (!deviceId) {
    deviceId = `dev-${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2, 12)}`
    localStorage.setItem('resqgrid.deviceId', deviceId)
  }
  return deviceId
}
export async function submitReport({
  userId,
  hazardType,
  description,
  coordinates,
  photo,
  victimCount = 1,
  cellTowerId = 'AUTO',
  sensorTelemetry = null,
}) {
  const capturedAt = new Date().toISOString()
  const deviceId = getDeviceId()
  const captureHash = photo ? await sha256(`${photo.slice(0, 1024)}:${capturedAt}`) : null
  const sensorString = sensorTelemetry
    ? `${coordinates.lat}:${coordinates.lng}:${capturedAt}:${deviceId}:${sensorTelemetry.alpha || 0}:${sensorTelemetry.beta || 0}:${sensorTelemetry.gamma || 0}`
    : `${coordinates.lat}:${coordinates.lng}:${capturedAt}:${deviceId}:${window.screen?.width || 0}x${window.screen?.height || 0}`
  const sensorHash = await sha256(sensorString)
  return request('/api/reports', {
    method: 'POST',
    body: {
      userId: userId || `citizen-${deviceId.slice(-6)}`,
      hazardType,
      description: description || undefined,
      coordinates,
      victimCount,
      photo: photo || undefined,
      metadata: {
        timestamp: capturedAt,
        cellTowerId: cellTowerId || 'AUTO',
        isLiveCapture: !!photo,
        deviceId,
        captureHash,
        sensorHash,
        channel: 'APP',
      },
    },
  }).then((d) => d.report)
}
export function fetchReports() {
  return request('/api/reports').then((d) => d.reports)
}
export function fetchClusters() {
  return request('/api/clusters').then((d) => d.clusters)
}
export function verifyReport(reportId, action, note) {
  return request(`/api/reports/${reportId}/verify`, {
    method: 'PATCH',
    body: { action, note },
    auth: true,
  }).then((d) => d.report)
}
export function batchVerifyReports(reportIds, action = 'VERIFY') {
  return request('/api/reports/batch-verify', {
    method: 'POST',
    body: { reportIds, action },
    auth: true,
  })
}
export function fetchMediaQueue() {
  return request('/api/admin/media-queue', { auth: true }).then((d) => d.queue)
}
export function fetchHazardStatus(lat, lng) {
  return request(`/api/hazard-status?lat=${lat}&lng=${lng}`)
}
export function fetchProximityAlerts(lat, lng, radiusKm = 5.0) {
  return request(`/api/alerts/proximity?lat=${lat}&lng=${lng}&radius_km=${radiusKm}`)
}
export function fetchImdAlerts() {
  return request('/api/imd-alerts').then((d) => d.alerts || [])
}
export function createImdAlert(payload) {
  return request('/api/imd-alerts', { method: 'POST', body: payload, auth: true })
}
export function fetchEmergencyContacts() {
  return request('/api/authority/contacts').then((d) => d.contacts || [])
}
export function createEmergencyContact(payload) {
  return request('/api/authority/contacts', { method: 'POST', body: payload, auth: true })
}
export function citizenSessionLogin({ full_name, phone_number, coordinates }) {
  return request('/api/auth/citizen', {
    method: 'POST',
    body: {
      full_name,
      phone_number,
      last_known_location: coordinates,
    },
  }).then((d) => {
    if (d?.citizen) {
      localStorage.setItem('resqgrid_citizen_user', JSON.stringify(d.citizen))
    }
    return d
  })
}
export function getStoredCitizenSession() {
  try {
    const raw = localStorage.getItem('resqgrid_citizen_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
export function fetchNearestAuthorityCommand(lat = 20.2961, lng = 85.8245) {
  return request(`/api/authority/nearest-command?lat=${lat}&lng=${lng}`)
}
export function clearCitizenSession() {
  localStorage.removeItem('resqgrid_citizen_user')
}
export function simulateFallbackGateway({ channel, fromNumber, rawMessage, coordinates, photoUrl }) {
  return request('/api/gateway/simulate', {
    method: 'POST',
    body: { channel, fromNumber, rawMessage, coordinates, photoUrl },
  })
}
export function computeRoute(start, destination) {
  return request('/api/route', { method: 'POST', body: { start, destination } })
}
export function computeAllocation(coordinates, people = 1, priority = 3, preferredTier = null) {
  return request('/api/allocation', {
    method: 'POST',
    body: { coordinates, people, priority, preferredTier },
  })
}
export function fetchOptimizerPlan() {
  return request('/api/optimizer/plan', { method: 'POST', auth: true })
}
export function batchDispatchOptimizer(allocations) {
  return request('/api/optimizer/batch-dispatch', {
    method: 'POST',
    body: { allocations },
    auth: true,
  })
}
export function fetchShelters() {
  return request('/api/shelters').then((d) => d.shelters)
}
export function registerShelter(payload) {
  return request('/api/shelters', { method: 'POST', body: payload, auth: true }).then((d) => d.shelter)
}
export function updateShelterStatus(shelterId, payload) {
  return request(`/api/shelters/${shelterId}/status`, { method: 'PUT', body: payload, auth: true }).then((d) => d.shelter)
}
export function verifyShelter(shelterId, action = 'VERIFY', notes) {
  return request(`/api/shelters/${shelterId}/verify`, {
    method: 'PATCH',
    body: { action, notes },
    auth: true,
  }).then((d) => d.shelter)
}
export function deleteShelter(shelterId) {
  return request(`/api/shelters/${shelterId}`, {
    method: 'DELETE',
    auth: true,
  })
}
export function registerMicroHaven(payload) {
  return request('/api/micro-havens', { method: 'POST', body: payload }).then((d) => d.shelter)
}
export function fetchMicroHavens() {
  return request('/api/micro-havens').then((d) => d.microHavens)
}
export function pingMicroHavenArrival(havenId, coordinates) {
  const deviceId = getDeviceId()
  return request(`/api/micro-havens/${havenId}/ping-arrival`, {
    method: 'POST',
    body: { deviceId, coordinates },
  })
}
export function fetchOperationsOverview() {
  return request('/api/operations/overview', { auth: true })
}
export function fetchResources() {
  return request('/api/resources')
}
export function dispatchResource(resourceId, reportId, notes) {
  return request('/api/dispatch', {
    method: 'POST',
    body: { resourceId, reportId, notes },
    auth: true,
  })
}
export function submitTeamTelemetry(payload) {
  return request('/api/teams/telemetry', {
    method: 'POST',
    body: payload,
  })
}
export function fetchBlacklist() {
  return request('/api/admin/blacklist', { auth: true }).then((d) => d.blacklist)
}
export function unbanIdentifier(identifier) {
  return request(`/api/admin/blacklist/${encodeURIComponent(identifier)}`, {
    method: 'DELETE',
    auth: true,
  })
}
export function verifyOfficer(email, action = 'VERIFY', notes) {
  return request(`/api/admin/officers/${encodeURIComponent(email)}/verify`, {
    method: 'PATCH',
    body: { action, notes },
    auth: true,
  })
}
export function fetchAuditLog() {
  return request('/api/audit', { auth: true }).then((d) => d.events)
}
export function clearAuditLogs() {
  return request('/api/admin/clear-logs', { method: 'POST', auth: true })
}
export function login(email, password, role) {
  return request('/api/auth/login', { method: 'POST', body: { email, password, role } })
}
export function register(payload) {
  return request('/api/auth/register', { method: 'POST', body: payload })
}
export function logout() {
  return request('/api/auth/logout', { method: 'POST', auth: true }).catch(() => null)
}
export { ApiError }
