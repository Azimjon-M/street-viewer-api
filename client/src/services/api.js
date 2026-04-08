import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// ─── Auth Interceptor ─────────────────────────────────────────
// Har bir so'rovga JWT tokenni avtomatik qo'shadi (agar mavjud bo'lsa)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sv-token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// ─── Response Interceptor ─────────────────────────────────────
// 401 xato kelsa tokenni tozalab login sahifasiga yo'naltiradi
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sv-token')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// ─── Auth ─────────────────────────────────────────────────────
export const login = (data) => api.post('/auth/login', data)
export const register = (data) => api.post('/auth/register', data)
export const getMe = () => api.get('/auth/me')

// ════════════════════════════════════════════════════════════════
//  MODULE-SCOPED ENDPOINTS (yangi)
// ════════════════════════════════════════════════════════════════

// ─── Modules ──────────────────────────────────────────────────
export const getAllModules     = () => api.get('/modules')
export const getModuleBySlug   = (slug) => api.get(`/modules/${slug}`)
export const createModule      = (data) => api.post('/modules', data)
export const updateModule      = (slug, data) => api.patch(`/modules/${slug}`, data)
export const deleteModule      = (slug) => api.delete(`/modules/${slug}`)

// ─── Module Scenes ────────────────────────────────────────────
export const getModuleScenes      = (slug) => api.get(`/modules/${slug}/scenes`)
export const getModuleSceneById   = (slug, id) => api.get(`/modules/${slug}/scenes/${id}`)
export const createModuleScene    = (slug, data) => api.post(`/modules/${slug}/scenes`, data)
export const updateModuleScene    = (slug, id, data) => api.patch(`/modules/${slug}/scenes/${id}`, data)
export const deleteModuleScene    = (slug, id) => api.delete(`/modules/${slug}/scenes/${id}`)

// ─── Module MiniMap ───────────────────────────────────────────
export const getModuleMiniMap     = (slug) => api.get(`/modules/${slug}/minimap`)
export const setModuleMiniMap     = (slug, data) => api.post(`/modules/${slug}/minimap`, data)
export const updateModuleMiniMap  = (slug, data) => api.patch(`/modules/${slug}/minimap`, data)

// ─── Module Uploads ───────────────────────────────────────────
export const uploadModuleSceneImages = (slug, formData) =>
  api.post(`/modules/${slug}/upload/scene-images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const uploadModuleMinimapImage = (slug, formData) =>
  api.post(`/modules/${slug}/upload/minimap-image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

// ════════════════════════════════════════════════════════════════
//  LEGACY ENDPOINTS (backward compat — default modul)
// ════════════════════════════════════════════════════════════════

// ─── Scenes (eski, default modul) ─────────────────────────────
export const getAllScenes = () => api.get('/scenes')
export const getSceneById = (id) => api.get(`/scenes/${id}`)
export const createScene  = (data) => api.post('/scenes', data)
export const updateScene  = (id, data) => api.patch(`/scenes/${id}`, data)
export const deleteScene  = (id) => api.delete(`/scenes/${id}`)

// ─── MiniMap (eski, default modul) ────────────────────────────
export const getMiniMap     = () => api.get('/minimap')
export const setMiniMap     = (data) => api.post('/minimap', data)
export const updateMiniMap  = (data) => api.patch('/minimap', data)

// ─── Uploads (eski, default modul) ────────────────────────────
export const uploadSceneImages = (formData) =>
  api.post('/upload/scene-images', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const uploadMinimapImage = (formData) =>
  api.post('/upload/minimap-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export default api
