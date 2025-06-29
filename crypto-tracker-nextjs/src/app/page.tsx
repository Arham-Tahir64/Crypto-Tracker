"use client"

import { useState } from "react"
import { Plus, TrendingUp, TrendingDown, Wallet, Activity, PieChart } from "lucide-react"

export default function Dashboard() {
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChart className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">CryptoTracker</h1>
            </div>
            <button 
              onClick={() => setIsAddTransactionOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Transaction
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 bg-white">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-900">Total Portfolio Value</h3>
              <Wallet className="h-4 w-4 text-gray-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">$0.00</div>
            <div className="text-xs text-gray-500">No data available</div>
          </div>

          <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-900">Total P&L</h3>
              <TrendingUp className="h-4 w-4 text-gray-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">$0.00</div>
            <div className="text-xs text-gray-500">No data available</div>
          </div>

          <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-900">Holdings</h3>
              <Activity className="h-4 w-4 text-gray-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">0</div>
            <div className="text-xs text-gray-500">No cryptocurrencies</div>
          </div>

          <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-900">Best Performer</h3>
              <TrendingUp className="h-4 w-4 text-gray-500" />
            </div>
            <div className="text-2xl font-bold text-gray-900">-</div>
            <div className="text-xs text-gray-500">No data available</div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex space-x-2 border-b border-gray-200">
            <button className="px-4 py-2 border-b-2 border-blue-600 text-blue-600 font-medium">
              Overview
            </button>
            <button className="px-4 py-2 text-gray-500 hover:text-gray-900">
              Holdings
            </button>
            <button className="px-4 py-2 text-gray-500 hover:text-gray-900">
              Transactions
            </button>
          </div>

          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold mb-2 text-gray-900">Portfolio Performance</h3>
                <p className="text-sm text-gray-500 mb-4">Your portfolio value over time</p>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Chart here
                </div>
              </div>

              <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold mb-2 text-gray-900">Top Holdings</h3>
                <p className="text-sm text-gray-500 mb-4">Your largest positions</p>
                <div className="text-center text-gray-500 py-8">
                  No holdings data available
                </div>
              </div>
            </div>

            <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Recent Transactions</h3>
              <div className="text-center text-gray-500 py-8">
                No transactions available
              </div>
            </div>
          </div>
        </div>
      </div>

      {isAddTransactionOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4 shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Add Transaction</h3>
            <p className="text-sm text-gray-500 mb-4">
              Transaction details here
            </p>
            <div className="flex justify-end space-x-2">
              <button 
                onClick={() => setIsAddTransactionOpen(false)}
                className="px-4 py-2 text-gray-500 hover:text-gray-900"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Add Transaction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
