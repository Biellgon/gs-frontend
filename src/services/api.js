import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({ baseURL })

export const getDashboard        = ()             => api.get('/dashboard')
export const getFireHotspots     = (days = 7)     => api.get(`/fires/hotspots?days=${days}`)
export const getFireSummary      = ()             => api.get('/fires/summary')
export const getDeforestHistory  = ()             => api.get('/deforestation/history')
export const getDeforestAlerts   = ()             => api.get('/deforestation/alerts')
export const getDeforestPolygons = ()             => api.get('/deforestation/polygons')
export const getAnnualEmissions  = ()             => api.get('/carbon/annual')
export const calculateEmissions  = (area, biome)  => api.get(`/carbon/calculate?area_ha=${area}&biome=${biome}`)
export const getBiomeBiomass     = ()             => api.get('/carbon/biomes')
