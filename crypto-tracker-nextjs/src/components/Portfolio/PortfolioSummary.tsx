"use client"

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Wallet, Activity } from 'lucide-react'

interface PortfolioSummary {
  total_current_value: number
  total_cost_basis: number
  total_gain_loss: number
  total_percentage_change: number
  num_holdings: number
}

export default function PortfolioSummary() {
  const [summary, setSummary] = useState<PortfolioSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPortfolioSummary()
  }, [])

  const fetchPortfolioSummary = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const token = localStorage.getItem('jwt_token')
      if (!token) {
        setError('Authentication required')
        return
      }

      const response = await fetch('http://localhost:5000/portfolio/summary', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSummary(data)
      } else if (response.status === 401) {
        setError('Authentication required')
      } else {
        setError('Failed to fetch portfolio summary')
      }
    } catch (error) {
      console.error('Error fetching portfolio summary:', error)
      setError('Failed to fetch portfolio summary')
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

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="text-center text-gray-500">
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="text-center text-gray-500">
            <p className="text-sm">No portfolio data available</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
      {/* Total Portfolio Value */}
      <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-900">Total Portfolio Value</h3>
          <Wallet className="h-4 w-4 text-gray-500" />
        </div>
        <div className="text-2xl font-bold text-gray-900">
          {formatCurrency(summary.total_current_value)}
        </div>
        <div className="text-xs text-gray-500">
          {summary.num_holdings} {summary.num_holdings === 1 ? 'holding' : 'holdings'}
        </div>
      </div>

      {/* Total P&L */}
      <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-900">Total P&L</h3>
          {summary.total_gain_loss >= 0 ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
        </div>
        <div className={`text-2xl font-bold ${
          summary.total_gain_loss >= 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          {formatCurrency(summary.total_gain_loss)}
        </div>
        <div className={`text-xs ${
          summary.total_percentage_change >= 0 ? 'text-green-500' : 'text-red-500'
        }`}>
          {formatPercentage(summary.total_percentage_change)}
        </div>
      </div>

      {/* Cost Basis */}
      <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-900">Total Cost Basis</h3>
          <Wallet className="h-4 w-4 text-gray-500" />
        </div>
        <div className="text-2xl font-bold text-gray-900">
          {formatCurrency(summary.total_cost_basis)}
        </div>
        <div className="text-xs text-gray-500">
          Total invested
        </div>
      </div>

      {/* Holdings Count */}
      <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-900">Holdings</h3>
          <Activity className="h-4 w-4 text-gray-500" />
        </div>
        <div className="text-2xl font-bold text-gray-900">
          {summary.num_holdings}
        </div>
        <div className="text-xs text-gray-500">
          {summary.num_holdings === 1 ? 'Cryptocurrency' : 'Cryptocurrencies'}
        </div>
      </div>
    </div>
  )
} 