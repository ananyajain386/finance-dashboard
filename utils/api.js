import axios from 'axios'
import useApiCache from '@/store/useApiCache'
import { getApiKey, detectApiProvider, getApiParamName, requiresApiKey } from './apiConfig'

// Create axios instance with default config
const apiClient = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for API key management
apiClient.interceptors.request.use(
  (config) => {
    if (!config.url) return config

    // Only add API key if not already present in URL
    if (requiresApiKey(config.url)) {
      const provider = detectApiProvider(config.url)
      const apiKey = getApiKey(provider)

      // Only add API key if we have one (skip if empty)
      if (apiKey && apiKey !== 'demo') {
        const paramName = getApiParamName(provider)
        
        // Add API key to query string
        const separator = config.url.includes('?') ? '&' : '?'
        config.url = `${config.url}${separator}${paramName}=${apiKey}`
      }
    }

    // Some APIs require API key in headers (e.g., Finnhub)
    const provider = detectApiProvider(config.url)
    if (provider === 'finnhub' && !config.headers['X-Finnhub-Token']) {
      const apiKey = getApiKey('finnhub')
      if (apiKey && apiKey !== 'demo') {
        config.headers['X-Finnhub-Token'] = apiKey
      }
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle rate limiting
      if (error.response.status === 429) {
        return Promise.reject(new Error('Rate limit exceeded. Please try again later.'))
      }
      // Handle API quota
      if (error.response.status === 403) {
        return Promise.reject(new Error('API quota exceeded. Please check your API key limits.'))
      }
    }
    return Promise.reject(error)
  }
)

/**
 * Fetch data from API with caching
 * @param {string} url - API endpoint URL
 * @param {number} cacheMaxAge - Cache max age in milliseconds (default: 30 seconds)
 * @returns {Promise} - API response data
 */
export const fetchApiData = async (url, cacheMaxAge = 30000) => {
  const cache = useApiCache.getState()
  
  // Check cache first
  const cached = cache.getCached(url, cacheMaxAge)
  if (cached) {
    return cached
  }

  try {
    const response = await apiClient.get(url)
    const data = response.data
    
    // Cache the response
    cache.setCached(url, data)
    
    return data
  } catch (error) {
    if (error.response) {
      throw new Error(`API Error: ${error.response.status} - ${error.response.statusText}`)
    } else if (error.request) {
      throw new Error('Network Error: Unable to reach the API')
    } else {
      throw new Error(`Error: ${error.message}`)
    }
  }
}

/**
 * Test API connection
 * @param {string} url - API endpoint URL
 * @returns {Promise<Object>} - Test result with success status and data/error
 */
export const testApiConnection = async (url) => {
  try {
    const data = await fetchApiData(url, 0) // No cache for testing
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

/**
 * Check if a value is a timestamp
 * @param {*} value - Value to check
 * @param {string} key - Key name (for context)
 * @returns {boolean} - True if value appears to be a timestamp
 */
const isTimestamp = (value, key = '') => {
  if (typeof value !== 'string' && typeof value !== 'number') {
    return false
  }
  
  const keyLower = key.toLowerCase()
  const timestampKeywords = ['time', 'timestamp', 'date', 'published', 'created', 'updated', 'trading day', 'tradingday']
  
  // Check if key contains timestamp-related keywords
  if (timestampKeywords.some(keyword => keyLower.includes(keyword))) {
    return true
  }
  
  // Check for common timestamp patterns
  const strValue = String(value)
  
  // ISO date format: 2024-10-18T19:59:55.291 or 20251226T091138
  if (/^\d{4}-\d{2}-\d{2}/.test(strValue) || /^\d{8}T\d{6}/.test(strValue)) {
    return true
  }
  
  // Unix timestamp (10 or 13 digits)
  if (/^\d{10}$/.test(strValue) || /^\d{13}$/.test(strValue)) {
    return true
  }
  
  return false
}

/**
 * Check if a value is a percentage
 * @param {*} value - Value to check
 * @param {string} key - Key name (for context)
 * @returns {boolean} - True if value appears to be a percentage
 */
const isPercentage = (value, key = '') => {
  const keyLower = key.toLowerCase()
  const percentageKeywords = ['percent', 'percentage', 'pct', 'change_percent', 'sentiment_score']
  
  // Check if key contains percentage-related keywords
  if (percentageKeywords.some(keyword => keyLower.includes(keyword))) {
    return true
  }
  
  // Check if value ends with %
  if (typeof value === 'string' && value.endsWith('%')) {
    return true
  }
  
  return false
}

/**
 * Extract all fields from nested JSON object
 * Extracts each element of arrays with indexed paths (e.g., feed_0_title, feed_1_title)
 * Converts timestamps and percentages to strings, keeps numbers as numbers
 * @param {Object} obj - JSON object
 * @param {string} prefix - Field path prefix
 * @returns {Array} - Array of field objects with path, type, and value
 */
export const extractFields = (obj, prefix = '') => {
  const fields = []
  
  if (obj === null || obj === undefined) {
    return fields
  }

  if (Array.isArray(obj)) {
    // For arrays, extract each element with index notation
    obj.forEach((item, index) => {
      const itemPath = prefix ? `${prefix}_${index}` : `${index}`
      
      if (typeof item === 'object' && item !== null) {
        // Recursively extract fields from the object element
        const itemFields = extractFields(item, itemPath)
        fields.push(...itemFields)
      } else {
        // Primitive value in array
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
        // Extract each element of the array with index
        value.forEach((item, index) => {
          const itemPath = `${newPath}_${index}`
          
          if (typeof item === 'object' && item !== null) {
            // Recursively extract from object in array
            const itemFields = extractFields(item, itemPath)
            fields.push(...itemFields)
          } else {
            // Primitive value in array
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
        // Recursively extract nested fields
        fields.push(...extractFields(value, newPath))
      } else {
        // Primitive value - check if it's timestamp or percentage
        const isTs = isTimestamp(value, key)
        const isPct = isPercentage(value, key)
        let finalType = typeof value
        let finalValue = value
        
        // Convert timestamps and percentages to strings, keep numbers as numbers
        if (isTs || isPct) {
          finalType = 'string'
          finalValue = String(value)
        } else if (typeof value === 'number') {
          // Keep numbers as numbers
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
    // Primitive root value
    fields.push({
      path: prefix || 'root',
      type: typeof obj,
      value: obj,
    })
  }
  
  return fields
}

/**
 * Get nested value from object using path notation
 * Supports:
 * - Simple paths: 'data.rates.USD' or 'data_rates_USD'
 * - Array indices with underscore: 'feed_0_title', 'feed_0_authors_0'
 * - Array indices with bracket: 'data[0].field' or 'data.items[0].name'
 * - Mixed paths: 'data.items[0].rates.USD' or 'feed_0_topics_0_topic'
 * @param {Object} obj - Object to extract value from
 * @param {string} path - Path notation (e.g., 'feed_0_title' or 'data.rates.USD')
 * @returns {*} - Value at path or undefined
 */
export const getNestedValue = (obj, path) => {
  if (!path || path === '' || path === null) return obj
  if (obj === null || obj === undefined) return undefined
  
  // Handle root path
  if (path === 'root' || path === '.') return obj
  
  // Trim whitespace
  path = path.trim()
  if (path === '') return obj
  
  // Convert underscore array notation to bracket notation for processing
  // e.g., 'feed_0_title' -> 'feed[0].title'
  // Strategy: 
  // 1. Replace _NUMBER_ (number between underscores) with [NUMBER].
  // 2. Replace _NUMBER followed by letter (number before property) with [NUMBER].
  // 3. Replace _NUMBER at end with [NUMBER]
  let normalizedPath = path
  
  // Special case: If underscore is followed by NUMBER. (dot), it's a key separator, not array index
  // Convert _NUMBER. to .NUMBER. (preserve the dot)
  normalizedPath = normalizedPath.replace(/_(\d+)\./g, '.$1.')
  
  // Now handle array indices: _NUMBER_ (between underscores, not followed by dot)
  normalizedPath = normalizedPath.replace(/_(\d+)_([^.\s])/g, '[$1].$2')
  // Pattern: _NUMBER at end -> [NUMBER]
  normalizedPath = normalizedPath.replace(/_(\d+)$/g, '[$1]')
  // Pattern: _NUMBER followed by letter (not dot) -> [NUMBER].letter
  normalizedPath = normalizedPath.replace(/_(\d+)([a-zA-Z_])/g, '[$1].$2')
  
  // Convert remaining underscores to dots (for object key separation)
  normalizedPath = normalizedPath.replace(/_/g, '.')
  
  // Now split by dots and process
  const parts = normalizedPath.split('.').filter(p => p !== '' && p !== null)
  let current = obj
  
  for (let i = 0; i < parts.length; i++) {
    let part = parts[i]
    
    if (!part) continue
    
    if (current === null || current === undefined) {
      return undefined
    }
    
    // Check if this part contains an array index like 'items[0]' or '[0]'
    if (part.includes('[') && part.includes(']')) {
      const match = part.match(/^([^\[]*)\[(\d+)\]$/)
      
      if (match) {
        const [, key, indexStr] = match
        const index = parseInt(indexStr, 10)
        
        if (isNaN(index) || index < 0) {
          return undefined
        }
        
        // If there's a key before the bracket (e.g., 'items[0]')
        if (key && key.trim() !== '') {
          if (typeof current === 'object' && current !== null) {
            current = current[key]
          } else {
            return undefined
          }
          
          if (current === null || current === undefined) {
            return undefined
          }
        }
        
        // Access the array index
        if (Array.isArray(current)) {
          if (index >= current.length) {
            return undefined
          }
          current = current[index]
        } else if (typeof current === 'object' && current !== null) {
          current = current[index]
        } else {
          return undefined
        }
      } else {
        if (typeof current === 'object' && current !== null) {
          current = current[part]
        } else {
          return undefined
        }
      }
    } else {
      // Regular property access
      // Handle keys that contain dots and spaces (e.g., "01. symbol", "02. open")
      if (typeof current === 'object' && current !== null) {
        const trimmedPart = part.trim()
        if (trimmedPart in current) {
          current = current[trimmedPart]
        } else if (part in current) {
          current = current[part]
        } else {
          // Try joining with subsequent parts
          let joinedPart = part
          let found = false
          let j = i + 1
          
          while (j < parts.length && !found) {
            const nextPart = parts[j]
            const testKey = joinedPart + '.' + nextPart
            
            if (testKey in current) {
              current = current[testKey]
              i = j
              found = true
              break
            }
            
            const testKeyTrimmed = joinedPart + '.' + nextPart.trim()
            if (testKeyTrimmed in current) {
              current = current[testKeyTrimmed]
              i = j
              found = true
              break
            }
            
            joinedPart = testKey
            j++
          }
          
          if (!found && joinedPart) {
            if (joinedPart in current) {
              current = current[joinedPart]
              i = parts.length - 1
              found = true
            } else if (joinedPart.trim() in current) {
              current = current[joinedPart.trim()]
              i = parts.length - 1
              found = true
            }
          }
          
          if (!found) {
            return undefined
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

