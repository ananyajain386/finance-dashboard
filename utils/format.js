export const formatCurrency = (value, currency = 'USD') => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(numValue)) return value
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  }).format(numValue)
}

export const formatPercentage = (value, decimals = 2) => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(numValue)) return value
  
  return `${numValue.toFixed(decimals)}%`
}


export const formatNumber = (value, decimals = 2) => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(numValue)) return value
  
  return numValue.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export const formatDate = (date, format = 'short') => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(dateObj.getTime())) return date
  
  const options = {
    short: { year: 'numeric', month: 'short', day: 'numeric' },
    long: { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' },
    time: { hour: '2-digit', minute: '2-digit', second: '2-digit' },
  }
  
  return dateObj.toLocaleString('en-US', options[format] || options.short)
}

export const autoFormat = (value, format = 'auto') => {
  if (value === null || value === undefined) return 'N/A'
  
  if (format === 'auto') {
    // First check for dates/timestamps - must be checked before number parsing
    if (typeof value === 'string') {
      // Check for date patterns: YYYY-MM-DD, YYYY-MM-DD HH:MM:SS, etc.
      if (value.match(/^\d{4}-\d{2}-\d{2}/) || value.match(/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}/)) {
        return value // Return date string as-is, don't format
      }
      // Check for timestamps with keywords
      if (value.toLowerCase().includes('trading day') || 
          value.toLowerCase().includes('timestamp') ||
          value.toLowerCase().includes('date') ||
          value.match(/^\d{4}-\d{2}-\d{2}/)) {
        return value // Return timestamp as-is
      }
    }
    
    // Then check for numbers
    if (typeof value === 'number' || (typeof value === 'string' && !isNaN(parseFloat(value)) && value.trim() !== '')) {
      const numValue = parseFloat(value)
      // Don't format as currency - just use number formatting
      if (Math.abs(numValue) < 1 && numValue !== 0) {
        return formatNumber(numValue, 4) // More decimals for small numbers
      }
      // Use number formatting without currency symbol
      return formatNumber(numValue)
    }
    
    return String(value)
  }
  
  switch (format) {
    case 'currency':
      return formatCurrency(value)
    case 'percentage':
      return formatPercentage(value)
    case 'number':
      return formatNumber(value)
    case 'date':
      return formatDate(value)
    default:
      return String(value)
  }
}

