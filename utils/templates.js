export const defaultTemplates = [
  {
    id: 'essential-metrics',
    name: 'Essential Metrics',
    description: 'Few cards with important data',
    icon: 'cards',
    widgets: [
      {
        name: 'IBM Stock Quote',
        apiUrl: 'https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=IBM&apikey=demo',
        refreshInterval: 3600,
        displayMode: 'card',
        selectedFields: [],
        cacheMaxAge: 30000
      },
      {
        name: 'Market Activity',
        apiUrl: 'https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&apikey=demo',
        refreshInterval: 3600,
        displayMode: 'card',
        selectedFields: [],
        cacheMaxAge: 30000
      },
      {
        name: 'Bitcoin Price',
        apiUrl: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
        refreshInterval: 3600,
        displayMode: 'card',
        selectedFields: [],
        cacheMaxAge: 30000
      }
    ]
  },
  {
    id: 'realtime-stock-quotes',
    name: 'Real-Time Stock Quotes',
    description: 'Live bulk market data for multiple equities, including price, volume, and intraday changes',
    icon: 'table',
    widgets: [
      {
        name: 'Stock Quotes Table',
        apiUrl: 'https://www.alphavantage.co/query?function=REALTIME_BULK_QUOTES&symbol=MSFT,AAPL,IBM&apikey=demo',
        refreshInterval: 3600,
        displayMode: 'table',
        selectedFields: [],
        cacheMaxAge: 30000
      }
    ]
  },
  {
    id: 'key-stats',
    name: 'Key Stats',
    description: 'Simple charts illustrating statistics',
    icon: 'chart',
    widgets: [
      {
        name: 'IBM Intraday Chart',
        apiUrl: 'https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=IBM&interval=5min&apikey=demo',
        refreshInterval: 3600,
        displayMode: 'chart',
        selectedFields: [
          {
            path: 'Time Series (5min)_2025-12-26 19:55:00_1. open',
            type: 'number',
            value: 304.91,
            label: 'Open'
          },
          {
            path: 'Time Series (5min)_2025-12-26 19:55:00_2. high',
            type: 'number',
            value: 305.09,
            label: 'High'
          },
          {
            path: 'Time Series (5min)_2025-12-26 19:55:00_3. low',
            type: 'number',
            value: 304.91,
            label: 'Low'
          },
          {
            path: 'Time Series (5min)_2025-12-26 19:55:00_4. close',
            type: 'number',
            value: 305.09,
            label: 'Close'
          }
        ],
        cacheMaxAge: 30000
      },
      {
        name: 'Insider Transactions',
        apiUrl: 'https://www.alphavantage.co/query?function=INSIDER_TRANSACTIONS&symbol=IBM&apikey=demo',
        refreshInterval: 3600,
        displayMode: 'chart',
        selectedFields: [
          {
            path: 'data_0_shares',
            type: 'number',
            value: 1000,
            label: 'Shares'
          }
        ],
        cacheMaxAge: 30000
      }
    ]
  }
]

export const getTemplateById = (id) => {
  return defaultTemplates.find(template => template.id === id)
}
