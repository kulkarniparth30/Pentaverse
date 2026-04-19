/**
 * API Service
 * ===========
 * Centralized API calls to the FastAPI backend.
 *
 * Base URL is proxied via Vite dev server:
 *   /api/* → http://localhost:8000/*
 *
 * Owner: Frontend Dev
 * Dependencies: axios
 */

import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 300000, // 5 min for first-time large model download
  headers: { 'Content-Type': 'application/json' },
})

/**
 * Upload a document file for analysis.
 * @param {File} file - PDF/DOCX/TXT File object
 * @returns {{ file_id, filename, size_bytes, status }}
 */
export async function uploadPDF(file) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

/**
 * Upload raw text for analysis (pasted text).
 * @param {string} text - Raw text content
 * @returns {{ file_id, filename, size_bytes, status }}
 */
export async function uploadText(text) {
  const response = await api.post('/upload-text', { text })
  return response.data
}

/**
 * Trigger full forensic analysis pipeline.
 * @param {string} fileId - UUID from upload
 * @returns {{ file_id, status, report }}
 */
export async function analyzeFile(fileId) {
  const response = await api.post(`/analyze/${fileId}`)
  return response.data
}

export async function getReport(fileId) {
  const response = await api.get(`/report/${fileId}`)
  return response.data
}

/**
 * Fetch history of all past analyses.
 * @returns {Array<{file_id, filename, created_at, status}>}
 */
export async function getHistory() {
  const response = await api.get('/history')
  return response.data
}

export async function deleteHistory(fileId) {
  const response = await api.delete(`/history/${fileId}`)
  return response.data
}

/**
 * Health check.
 */
export async function healthCheck() {
  const response = await api.get('/health')
  return response.data
}

export default api
