"use client"

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface Holding {
  id: number
  user_id: number
  crypto_id: number
  quantity: number
  average_buy_price: number
  last_updated: string
  current_price: number
  current_value: number
  gain_loss: number
  percentage_change: number
  crypto: {
    id: number
    name: string
    symbol: string
    api_id: string
    logo_url?: string
  }
}

export default function HoldingsList() {
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchHoldings()
  }, [])

  const fetchHoldings = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const token = localStorage.getItem('jwt_token')
      if (!token) {
        setError('Authentication required')
        return
      }

      const response = await fetch('http://localhost:5000/portfolio', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        const data = await response.json()
        setHoldings(data)
      } else if (response.status === 401) {
        setError('Authentication required')
      } else {
        setError('Failed to fetch holdings')
      }
    } catch (error) {
      console.error('Error fetching holdings:', error)
      setError('Failed to fetch holdings')
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatPercentage = (percentage: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(percentage / 100)
  }

  const formatQuantity = (quantity: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 8,
    }).format(quantity)
  }

  if (isLoading) {
    return (
      <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Your Holdings</h3>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Your Holdings</h3>
        <div className="text-center text-gray-500 py-8">
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (holdings.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Your Holdings</h3>
        <div className="text-center text-gray-500 py-8">
          <p className="text-sm">No holdings yet. Add your first transaction to get started!</p>
        </div>
      </div>
    )
  }

  // Sort holdings by current value (highest first)
  const sortedHoldings = [...holdings].sort((a, b) => b.current_value - a.current_value)

  return (
    <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Your Holdings</h3>
      <div className="space-y-4">
        {sortedHoldings.map((holding) => (
          <div key={holding.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
            <div className="flex items-center space-x-3">
              {holding.crypto?.logo_url ? (
                <img 
                  src={holding.crypto.logo_url} 
                  alt={holding.crypto.name}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-500">
                    {holding.crypto?.symbol?.charAt(0) || '?'}
                  </span>
                </div>
              )}
              <div>
                <div className="font-medium text-gray-900">{holding.crypto?.name || 'Unknown'}</div>
                <div className="text-sm text-gray-500">{holding.crypto?.symbol || 'N/A'}</div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="font-medium text-gray-900">
                {formatCurrency(holding.current_value)}
              </div>
              <div className="text-sm text-gray-500">
                {formatQuantity(holding.quantity)} {holding.crypto.symbol}
              </div>
            </div>
            
            <div className="text-right">
              <div className={`font-medium ${
                holding.gain_loss >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(holding.gain_loss)}
              </div>
              <div className={`text-sm flex items-center ${
                holding.percentage_change >= 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {holding.percentage_change >= 0 ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {formatPercentage(holding.percentage_change)}
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-500">
                Avg: {formatCurrency(holding.average_buy_price)}
              </div>
              <div className="text-sm text-gray-500">
                Current: {formatCurrency(holding.current_price)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 