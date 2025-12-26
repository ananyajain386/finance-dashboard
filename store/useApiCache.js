import { create } from 'zustand'

const useApiCache = create((set, get) => ({
  cache: new Map(),
  lastFetch: new Map(),

  getCached: (url, maxAge = 30000) => {
    const cached = get().cache.get(url)
    const lastFetchTime = get().lastFetch.get(url)
    
    if (cached && lastFetchTime) {
      const age = Date.now() - lastFetchTime
      if (age < maxAge) {
        return cached
      }
    }
    return null
  },

  setCached: (url, data) => {
    set((state) => {
      const newCache = new Map(state.cache)
      const newLastFetch = new Map(state.lastFetch)
      newCache.set(url, data)
      newLastFetch.set(url, Date.now())
      return {
        cache: newCache,
        lastFetch: newLastFetch,
      }
    })
  },

  clearCache: (url) => {
    set((state) => {
      const newCache = new Map(state.cache)
      const newLastFetch = new Map(state.lastFetch)
      newCache.delete(url)
      newLastFetch.delete(url)
      return {
        cache: newCache,
        lastFetch: newLastFetch,
      }
    })
  },

  clearAllCache: () => {
    set({
      cache: new Map(),
      lastFetch: new Map(),
    })
  },
}))

export default useApiCache

