"use client"

import { useState, useEffect } from 'react'
import { Plus, Minus } from 'lucide-react'

interface Transaction {
  id: number
  user_id: number
  crypto_id: number
  transaction_type: string
  quantity: number
  price_per_coin: number
  fiat_value: number
  transaction_date: string
  crypto_symbol: string
  crypto_name: string
}

export default function TransactionsList() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchTransactions()
  }, [])

  const fetchTransactions = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const token = localStorage.getItem('jwt_token')
      if (!token) {
        setError('Authentication required')
        return
      }

      const response = await fetch('http://localhost:5000/transactions', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        const data = await response.json()
        setTransactions(data)
      } else if (response.status === 401) {
        setError('Authentication required')
      } else {
        setError('Failed to fetch transactions')
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
      setError('Failed to fetch transactions')
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

  const formatQuantity = (quantity: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 8,
    }).format(quantity)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Recent Transactions</h3>
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
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Recent Transactions</h3>
        <div className="text-center text-gray-500 py-8">
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Recent Transactions</h3>
        <div className="text-center text-gray-500 py-8">
          <p className="text-sm">No transactions yet. Add your first transaction to get started!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">Recent Transactions</h3>
      <div className="space-y-3">
        {transactions.slice(0, 10).map((transaction) => (
          <div key={transaction.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-full ${
                transaction.transaction_type === 'buy' 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-red-100 text-red-600'
              }`}>
                {transaction.transaction_type === 'buy' ? (
                  <Plus className="h-4 w-4" />
                ) : (
                  <Minus className="h-4 w-4" />
                )}
              </div>
              <div>
                <div className="font-medium text-gray-900">
                  {transaction.transaction_type === 'buy' ? 'Bought' : 'Sold'} {transaction.crypto_name}
                </div>
                <div className="text-sm text-gray-500">
                  {formatDate(transaction.transaction_date)}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="font-medium text-gray-900">
                {formatQuantity(transaction.quantity)} {transaction.crypto_symbol}
              </div>
              <div className="text-sm text-gray-500">
                @ {formatCurrency(transaction.price_per_coin)}
              </div>
            </div>
            
            <div className="text-right">
              <div className="font-medium text-gray-900">
                {formatCurrency(transaction.fiat_value)}
              </div>
              <div className={`text-sm ${
                transaction.transaction_type === 'buy' ? 'text-green-600' : 'text-red-600'
              }`}>
                {transaction.transaction_type === 'buy' ? 'Purchase' : 'Sale'}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {transactions.length > 10 && (
        <div className="text-center mt-4">
          <p className="text-sm text-gray-500">
            Showing 10 of {transactions.length} transactions
          </p>
        </div>
      )}
    </div>
  )
} 