export const getApiKey = (provider = 'default') => {
  const keys = {
    alphaVantage: process.env.NEXT_PUBLIC_ALPHA_VANTAGE_API_KEY || '',
    finnhub: process.env.NEXT_PUBLIC_FINNHUB_API_KEY || '',
    indian: process.env.NEXT_PUBLIC_INDIAN_API_KEY || '',
    default: process.env.NEXT_PUBLIC_DEFAULT_API_KEY || '',
  }
  return keys[provider] || keys.default
}

export const detectApiProvider = (url) => {
  if (!url) return 'default'
  
  const lowerUrl = url.toLowerCase()
  
  if (lowerUrl.includes('alphavantage') || lowerUrl.includes('alpha-vantage')) {
    return 'alphaVantage'
  }
  if (lowerUrl.includes('finnhub')) {
    return 'finnhub'
  }
  if (lowerUrl.includes('indian') || lowerUrl.includes('nse') || lowerUrl.includes('bse')) {
    return 'indian'
  }
  
  return 'default'
}

export const getApiParamName = (provider) => {
  const paramNames = {
    alphaVantage: 'apikey',
    finnhub: 'token',
    indian: 'api_key',
    default: 'apikey',
  }
  return paramNames[provider] || 'apikey'
}

export const requiresApiKey = (url) => {
  if (!url) return false
  
  const hasApiKey = url.includes('api_key') || 
                    url.includes('apikey') || 
                    url.includes('apikey=') ||
                    url.includes('api-key') ||
                    url.includes('token=')
  
  return !hasApiKey
}


