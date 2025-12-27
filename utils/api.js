import axios from 'axios'
import useApiCache from '@/store/useApiCache'
import { getApiKey, detectApiProvider, getApiParamName, requiresApiKey } from './apiConfig'

const apiClient = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use(
  (config) => {
    if (!config.url) return config

    const provider = detectApiProvider(config.url)
    if (provider === 'finnhub') {
      return Promise.reject(new Error('Finnhub requests must use proxy. This should not happen.'))
    }

    if (requiresApiKey(config.url)) {
      const apiKey = getApiKey(provider)

      if (apiKey && apiKey !== 'demo') {
        const paramName = getApiParamName(provider)
        
        const separator = config.url.includes('?') ? '&' : '?'
        config.url = `${config.url}${separator}${paramName}=${apiKey}`
      }
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      if (error.response.status === 429) {
        return Promise.reject(new Error('Rate limit exceeded. Please try again later.'))
      }
      if (error.response.status === 403) {
        return Promise.reject(new Error('API quota exceeded. Please check your API key limits.'))
      }
    }
    return Promise.reject(error)
  }
)

export const fetchApiData = async (url, cacheMaxAge = 30000) => {
  const cache = useApiCache.getState()
  
  const cached = cache.getCached(url, cacheMaxAge)
  if (cached) {
    return cached
  }

  try {
    const provider = detectApiProvider(url)
    let data
    
    if (provider === 'finnhub') {
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`
      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `API Error: ${response.status} - ${response.statusText}`)
      }
      
      data = await response.json()
    } else {
      const response = await apiClient(url)
      data = response.data
    }
    
    cache.setCached(url, data)
    
    return data
  } catch (error) {
    if (error.response) {
      throw new Error(`API Error: ${error.response.status} - ${error.response.statusText}`)
    } else if (error.request) {
      throw new Error('Network Error: Unable to reach the API')
    } else {
      throw new Error(error.message || `Error: ${error.message}`)
    }
  }
}

export const testApiConnection = async (url) => {
  try {
    const data = await fetchApiData(url,0) 
    return {
      success: true,
      data,
      message: 'API connection successful!',
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      message: `API connection failed: ${error.message}`,
    }
  }
}

const isTimestamp = (value, key = '') => {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return false
  }
  
  const keyLower = key.toLowerCase()
  const timestampKeywords = ['time', 'timestamp', 'date', 'published', 'created', 'updated', 'trading day', 'tradingday']
  
  if (timestampKeywords.some(keyword => keyLower.includes(keyword))) {
    return true
  }
  
  const strValue = String(value)
  
  if (/^\d{4}-\d{2}-\d{2}/.test(strValue) || /^\d{8}T\d{6}/.test(strValue)) {
    return true
  }
  
  if (/^\d{10}$/.test(strValue) || /^\d{13}$/.test(strValue)) {
    return true
  }
  
  return false
}

const isPercentage = (value, key = '') => {
  const keyLower = key.toLowerCase()
  const percentageKeywords = ['percent', 'percentage', 'pct', 'change_percent', 'sentiment_score']
  
  if (percentageKeywords.some(keyword => keyLower.includes(keyword))) {
    return true
  }
  
  if (typeof value === 'string' && value.endsWith('%')) {
    return true
  }
  
  return false
}

export const extractFields = (obj, prefix = '') => {
  const fields = []
  
  if (obj === null || obj === undefined) {
    return fields
  }

  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      const itemPath = prefix ? `${prefix}_${index}` : `${index}`
      
      if (typeof item === 'object' && item !== null) {
        const itemFields = extractFields(item, itemPath)
        fields.push(...itemFields)
      } else {
        const key = itemPath.split('_').pop() || ''
        const isTs = isTimestamp(item, key)
        const isPct = isPercentage(item, key)
        const finalType = isTs || isPct ? 'string' : typeof item
        const finalValue = isTs || isPct ? String(item) : item
        
        fields.push({
          path: itemPath,
          type: finalType,
          value: finalValue,
        })
      }
    })
  } else if (typeof obj === 'object') {
    Object.keys(obj).forEach((key) => {
      const newPath = prefix ? `${prefix}_${key}` : key
      const value = obj[key]
      
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          const itemPath = `${newPath}_${index}`
          
          if (typeof item === 'object' && item !== null) {
            const itemFields = extractFields(item, itemPath)
            fields.push(...itemFields)
          } else {
            const itemKey = itemPath.split('_').pop() || ''
            const isTs = isTimestamp(item, itemKey)
            const isPct = isPercentage(item, itemKey)
            const finalType = isTs || isPct ? 'string' : typeof item
            const finalValue = isTs || isPct ? String(item) : item
            
            fields.push({
              path: itemPath,
              type: finalType,
              value: finalValue,
            })
          }
        })
      } else if (typeof value === 'object' && value !== null) {
        const keys = Object.keys(value)
        const isTimeSeries = keys.length > 0 && keys.every(k => 
          isTimestamp(k) || /^\d{4}-\d{2}-\d{2}/.test(String(k))
        )
        
        if (isTimeSeries && keys.length > 0) {
          const firstKey = keys[0]
          const firstValue = value[firstKey]
          if (typeof firstValue === 'object' && firstValue !== null) {
            const tsPath = `${newPath}_${firstKey}`
            const tsFields = extractFields(firstValue, tsPath)
            fields.push(...tsFields)
          }
        } else {
          const nestedFields = extractFields(value, newPath)
          fields.push(...nestedFields)
        }
      } else {
        const isTs = isTimestamp(value, key)
        const isPct = isPercentage(value, key)
        let finalType = typeof value
        let finalValue = value
        
        if (isTs || isPct) {
          finalType = 'string'
          finalValue = String(value)
        } else if (typeof value === 'number') {
          finalType = 'number'
          finalValue = value
        }
        
        fields.push({
          path: newPath,
          type: finalType,
          value: finalValue,
        })
      }
    })
  } else {
    fields.push({
      path: prefix || 'root',
      type: typeof obj,
      value: obj,
    })
  }
  
  return fields
}


export const getNestedValue = (obj, path) => {
  if (!path || path === '' || path === null) return obj
  if (obj === null || obj === undefined) return undefined
  
  if (path === 'root' || path === '.') return obj
  
  path = path.trim()
  if (path === '') return obj
  
  if (typeof obj === 'object' && obj !== null && path in obj) {
    return obj[path]
  }
  
  const decodedPath = path.replace(/%20/g, ' ').replace(/%28/g, '(').replace(/%29/g, ')')
  if (decodedPath !== path && typeof obj === 'object' && obj !== null && decodedPath in obj) {
    return obj[decodedPath]
  }
  
  const arrayIndexPattern = /^([a-zA-Z_]+)_(\d+)_(.+)$/
  const arrayMatch = path.match(arrayIndexPattern)
  if (arrayMatch) {
    const [, propName, index, restPath] = arrayMatch
    if (obj && typeof obj === 'object' && propName in obj) {
      const arrayValue = obj[propName]
      if (Array.isArray(arrayValue)) {
        const idx = parseInt(index, 10)
        if (idx >= 0 && idx < arrayValue.length) {
          return getNestedValue(arrayValue[idx], restPath)
        }
      }
    }
  }
  
  const parts = []
  let currentPart = ''
  let inBrackets = false
  
  for (let i = 0; i < path.length; i++) {
    const char = path[i]
    
    if (char === '[') {
      inBrackets = true
      currentPart += char
    } else if (char === ']') {
      inBrackets = false
      currentPart += char
    } else if (char === '_' && !inBrackets) {
      if (currentPart) {
        parts.push(currentPart)
        currentPart = ''
      }
    } else {
      currentPart += char
    }
  }
  
  if (currentPart) {
    parts.push(currentPart)
  }
  
  if (parts.length === 0) {
    parts.push(path)
  }
  
  let current = obj
  
  for (let i = 0; i < parts.length; i++) {
    let part = parts[i]
    
    if (!part) continue
    
    if (current === null || current === undefined) {
      return undefined
    }
    
    if (part.includes('[') && part.includes(']')) {
      const match = part.match(/^([^\[]*)\[(\d+)\]$/)
      
      if (match) {
        const [, key, indexStr] = match
        const index = parseInt(indexStr, 10)
        
        if (isNaN(index) || index < 0) {
          return undefined
        }
        
        if (key && key.trim() !== '') {
          if (typeof current === 'object' && current !== null) {
            if (key in current) {
              current = current[key]
            } else {
              const trimmedKey = key.trim()
              if (trimmedKey in current) {
                current = current[trimmedKey]
              } else {
                return undefined
              }
            }
          } else {
            return undefined
          }
          
          if (current === null || current === undefined) {
            return undefined
          }
        }
        
        if (Array.isArray(current)) {
          if (index >= current.length) {
            return undefined
          }
          current = current[index]
        } else if (typeof current === 'object' && current !== null) {
          const keys = Object.keys(current)
          if (index < keys.length) {
            current = current[keys[index]]
          } else {
            return undefined
          }
        } else {
          return undefined
        }
      } else {
        return undefined
      }
    } else {
      if (typeof current === 'object' && current !== null) {
        if (part in current) {
          current = current[part]
        } else {
          const trimmedPart = part.trim()
          if (trimmedPart in current) {
            current = current[trimmedPart]
          } else {
            let remainingParts = parts.slice(i)
            let joinedKey = remainingParts.join('_')
            
            const strategies = [
              joinedKey,
              remainingParts.join('.'), 
              remainingParts.join(' '), 
            ]
            
            let found = false
            for (const strategy of strategies) {
              if (strategy in current) {
                current = current[strategy]
                i = parts.length - 1
                found = true
                break
              }
            }
            
            if (!found) {
              return undefined
            }
          }
        }
      } else {
        return undefined
      }
    }
    
    if (current === undefined) {
      return undefined
    }
  }
  
  return current
}

