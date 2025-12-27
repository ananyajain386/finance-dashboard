import { NextResponse } from 'next/server'
import axios from 'axios'

const getApiKey = (provider) => {
  const keys = {
    finnhub: process.env.NEXT_PUBLIC_FINNHUB_API_KEY || '',
  }
  return keys[provider] || ''
}

const detectApiProvider = (url) => {
  if (!url) return null
  const lowerUrl = url.toLowerCase()
  if (lowerUrl.includes('finnhub')) {
    return 'finnhub'
  }
  return null
}

const hasToken = (url) => {
  return url.includes('token=')
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  let targetUrl = searchParams.get('url')

  if (!targetUrl) {
    return NextResponse.json(
      { error: 'URL parameter is required' },
      { status: 400 }
    )
  }

  try {
    if (!targetUrl.startsWith('https://')) {
      return NextResponse.json(
        { error: 'Only HTTPS URLs are allowed' },
        { status: 400 }
      )
    }

    const provider = detectApiProvider(targetUrl)
    if (provider === 'finnhub' && !hasToken(targetUrl)) {
      const apiKey = getApiKey('finnhub')
      if (apiKey && apiKey !== 'demo') {
        const separator = targetUrl.includes('?') ? '&' : '?'
        targetUrl = `${targetUrl}${separator}token=${apiKey}`
      }
    }

    const response = await axios.get(targetUrl, {
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
      },
    })

    return NextResponse.json(response.data)
  } catch (error) {
    if (error.response) {
      return NextResponse.json(
        { 
          error: `API Error: ${error.response.status} - ${error.response.statusText}`,
          status: error.response.status 
        },
        { status: error.response.status }
      )
    } else if (error.request) {
      return NextResponse.json(
        { error: 'Network Error: Unable to reach the API' },
        { status: 503 }
      )
    } else {
      return NextResponse.json(
        { error: `Error: ${error.message}` },
        { status: 500 }
      )
    }
  }
}

