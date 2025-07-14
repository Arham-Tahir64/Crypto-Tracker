"use client"

import { useState, useEffect } from 'react'
import { X, Plus, Minus } from 'lucide-react'

interface Crypto {
  id: number
  symbol: string
  name: string
  api_id: string
  logo_url?: string
  last_updated_price?: number
}

interface AddTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  onTransactionAdded: () => void
}

export default function AddTransactionModal({ isOpen, onClose, onTransactionAdded }: AddTransactionModalProps) {
  const [transactionType, setTransactionType] = useState<'buy' | 'sell'>('buy')
  const [selectedCrypto, setSelectedCrypto] = useState<Crypto | null>(null)
  const [quantity, setQuantity] = useState('')
  const [pricePerCoin, setPricePerCoin] = useState('')
  const [transactionDate, setTransactionDate] = useState('')
  const [cryptos, setCryptos] = useState<Crypto[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingCryptos, setIsLoadingCryptos] = useState(false)
  const [isLoadingPrice, setIsLoadingPrice] = useState(false)

  // Set default date to today
  useEffect(() => {
    if (isOpen && !transactionDate) {
      const today = new Date().toISOString().split('T')[0]
      setTransactionDate(today)
    }
  }, [isOpen, transactionDate])

  // Fetch available cryptocurrencies from database
  useEffect(() => {
    if (isOpen) {
      fetchCryptos()
    }
  }, [isOpen])

  const fetchCryptos = async () => {
    setIsLoadingCryptos(true)
    try {
      // Get the JWT token from localStorage (you might need to store this when user logs in)
      const token = localStorage.getItem('jwt_token') // You'll need to store this when user logs in
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const response = await fetch('http://localhost:5000/cryptos/db', {
        headers
      })
      
      if (response.ok) {
        const data = await response.json()
        setCryptos(data)
      } else if (response.status === 401) {
        console.error('Authentication required')
        alert('Please log in to add transactions')
        onClose()
      } else {
        console.error('Failed to fetch cryptos')
      }
    } catch (error) {
      console.error('Error fetching cryptos:', error)
    } finally {
      setIsLoadingCryptos(false)
    }
  }

  const fetchHistoricalPrice = async (cryptoId: string, date: string) => {
    setIsLoadingPrice(true)
    try {
      console.log(`Fetching historical price for ${cryptoId} on ${date}`)
      
      // Format date as DD-MM-YYYY for CoinGecko API
      const dateParts = date.split('-')
      const formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`
      
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${cryptoId}/history?date=${formattedDate}`,
        {
          headers: {
            'Accept': 'application/json',
          }
        }
      )
      
      console.log(`CoinGecko API response status: ${response.status}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('CoinGecko API response:', data)
        
        const price = data.market_data?.current_price?.usd
        if (price) {
          setPricePerCoin(price.toString())
          console.log(`Historical price set to: $${price}`)
        } else {
          console.log('No price found in response')
          alert('Could not fetch historical price for this date. Please enter the price manually.')
        }
      } else {
        const errorText = await response.text()
        console.error(`CoinGecko API error: ${response.status} - ${errorText}`)
        
        if (response.status === 429) {
          alert('CoinGecko API rate limit exceeded. Please enter the price manually.')
        } else {
          alert('Could not fetch historical price. Please enter the price manually.')
        }
      }
    } catch (error) {
      console.error('Error fetching historical price:', error)
      alert('Could not fetch historical price. Please enter the price manually.')
    } finally {
      setIsLoadingPrice(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCrypto || !quantity || !pricePerCoin || !transactionDate) {
      alert('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    try {
      const token = localStorage.getItem('jwt_token')
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const response = await fetch('http://localhost:5000/transactions', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          crypto_id: selectedCrypto.id,
          quantity: parseFloat(quantity),
          price_per_coin: parseFloat(pricePerCoin),
          transaction_type: transactionType,
          transaction_date: transactionDate
        }),
      })

      if (response.ok) {
        // Reset form
        setTransactionType('buy')
        setSelectedCrypto(null)
        setQuantity('')
        setPricePerCoin('')
        setTransactionDate('')
        onTransactionAdded()
        onClose()
      } else {
        const error = await response.json()
        alert(`Error: ${error.message}`)
      }
    } catch (error) {
      console.error('Error adding transaction:', error)
      alert('Failed to add transaction')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCryptoSelect = (crypto: Crypto) => {
    setSelectedCrypto(crypto)
    // Fetch historical price for the selected date
    if (transactionDate) {
      fetchHistoricalPrice(crypto.api_id, transactionDate)
    }
  }

  const handleDateChange = (date: string) => {
    setTransactionDate(date)
    // If crypto is selected, fetch new historical price
    if (selectedCrypto) {
      fetchHistoricalPrice(selectedCrypto.api_id, date)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4 shadow-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Add Transaction</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction Type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTransactionType('buy')}
                className={`flex-1 py-2 px-4 rounded-md border ${
                  transactionType === 'buy'
                    ? 'bg-green-100 border-green-500 text-green-700'
                    : 'bg-gray-100 border-gray-300 text-gray-700'
                }`}
              >
                <Plus className="h-4 w-4 inline mr-2" />
                Buy
              </button>
              <button
                type="button"
                onClick={() => setTransactionType('sell')}
                className={`flex-1 py-2 px-4 rounded-md border ${
                  transactionType === 'sell'
                    ? 'bg-red-100 border-red-500 text-red-700'
                    : 'bg-gray-100 border-gray-300 text-gray-700'
                }`}
              >
                <Minus className="h-4 w-4 inline mr-2" />
                Sell
              </button>
            </div>
          </div>

          {/* Transaction Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction Date
            </label>
            <input
              type="date"
              value={transactionDate}
              onChange={(e) => handleDateChange(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Cryptocurrency Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cryptocurrency
            </label>
            {isLoadingCryptos ? (
              <div className="text-center py-4 text-gray-500">Loading cryptocurrencies...</div>
            ) : (
              <div className="max-h-40 overflow-y-auto border rounded-md">
                {cryptos.map((crypto) => (
                  <button
                    key={crypto.id}
                    type="button"
                    onClick={() => handleCryptoSelect(crypto)}
                    className={`w-full p-3 text-left border-b last:border-b-0 hover:bg-gray-50 ${
                      selectedCrypto?.id === crypto.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="flex items-center">
                      <div>
                        <div className="font-medium">{crypto.name}</div>
                        <div className="text-sm text-gray-500">{crypto.symbol.toUpperCase()}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity
            </label>
            <input
              type="number"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Price per Coin */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price per Coin (USD)
              {isLoadingPrice && <span className="text-blue-600 ml-2">Loading...</span>}
            </label>
            <input
              type="number"
              step="any"
              value={pricePerCoin}
              onChange={(e) => setPricePerCoin(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Price is automatically fetched for the selected date, but you can edit it manually.
            </p>
          </div>

          {/* Total Value (calculated) */}
          {quantity && pricePerCoin && (
            <div className="bg-gray-50 p-3 rounded-md">
              <div className="text-sm text-gray-600">Total Value</div>
              <div className="text-lg font-semibold">
                ${(parseFloat(quantity) * parseFloat(pricePerCoin)).toLocaleString()}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !selectedCrypto || !quantity || !pricePerCoin || !transactionDate}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Adding...' : 'Add Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 