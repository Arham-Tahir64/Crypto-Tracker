"use client"

import { useState, useEffect } from 'react'

interface PortfolioData {
  date: string
  value: number
}

interface TooltipData {
  x: number
  y: number
  data: PortfolioData
  visible: boolean
}

export default function PortfolioChart() {
  const [portfolioData, setPortfolioData] = useState<PortfolioData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<TooltipData>({
    x: 0,
    y: 0,
    data: { date: '', value: 0 },
    visible: false
  })
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  useEffect(() => {
    console.log('PortfolioChart component mounted')
    fetchPortfolioHistory()
  }, [])

  const fetchPortfolioHistory = async () => {
    console.log('Fetching portfolio history...')
    setIsLoading(true)
    
    try {
      const token = localStorage.getItem('jwt_token')
      if (!token) {
        setError('Authentication required')
        return
      }

      // Fetch historical portfolio data from backend
      const response = await fetch('http://localhost:5000/portfolio/history', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        setError('Failed to fetch portfolio history')
        return
      }

      const data = await response.json()
      console.log('Portfolio history data:', data)
      
      if (data.length === 0) {
        setError('No portfolio data available')
        return
      }
      
      setPortfolioData(data)
    } catch (error) {
      console.error('Error fetching portfolio history:', error)
      setError('Failed to fetch portfolio history')
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  const formatDateFull = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    const svg = event.currentTarget
    const rect = svg.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    // Find the closest data point
    const index = Math.round((x - padding) / ((chartWidth - 2 * padding) / (portfolioData.length - 1)))
    
    if (index >= 0 && index < portfolioData.length) {
      const data = portfolioData[index]
      setHoveredIndex(index)
      setTooltip({
        x: event.clientX,
        y: event.clientY,
        data,
        visible: true
      })
    }
  }

  const handleMouseLeave = () => {
    setHoveredIndex(null)
    setTooltip(prev => ({ ...prev, visible: false }))
  }

  if (isLoading) {
    return (
      <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold mb-2 text-gray-900">Portfolio Performance</h3>
        <p className="text-sm text-gray-500 mb-4">Your portfolio value over time</p>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-pulse">
            <div className="h-48 w-full bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold mb-2 text-gray-900">Portfolio Performance</h3>
        <p className="text-sm text-gray-500 mb-4">Your portfolio value over time</p>
        <div className="h-64 flex items-center justify-center text-gray-500">
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (portfolioData.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold mb-2 text-gray-900">Portfolio Performance</h3>
        <p className="text-sm text-gray-500 mb-4">Your portfolio value over time</p>
        <div className="h-64 flex items-center justify-center text-gray-500">
          <p className="text-sm">No portfolio data available</p>
        </div>
      </div>
    )
  }

  // Calculate chart dimensions and scaling
  const chartHeight = 200
  const chartWidth = 600
  const padding = 40
  
  const values = portfolioData.map(d => d.value)
  const minValue = Math.min(...values)
  const maxValue = Math.max(...values)
  const valueRange = maxValue - minValue || 1
  
  const points = portfolioData.map((data, index) => {
    const x = padding + (index / (portfolioData.length - 1)) * (chartWidth - 2 * padding)
    const y = padding + ((maxValue - data.value) / valueRange) * (chartHeight - 2 * padding)
    return `${x},${y}`
  }).join(' ')

  const currentValue = portfolioData[portfolioData.length - 1]?.value || 0

  return (
    <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Portfolio Value Over Time</h3>
          <p className="text-sm text-gray-500 mt-1">Last 30 days</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-gray-900">
            {formatCurrency(currentValue)}
          </div>
          <div className="text-sm text-gray-500">
            Current Total Value
          </div>
        </div>
      </div>
      
      <div className="relative h-64 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
        <svg 
          width="100%" 
          height="100%" 
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          preserveAspectRatio="xMidYMid meet"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="cursor-crosshair"
          style={{ overflow: 'visible' }}
        >
          {/* Background with gradient */}
          <defs>
            <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.1"/>
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05"/>
            </linearGradient>
            <pattern id="grid" width="60" height="40" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
            </pattern>
          </defs>
          
          {/* Grid background */}
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Area fill */}
          <polygon
            fill="url(#chartGradient)"
            points={`${padding},${chartHeight - padding} ${points} ${chartWidth - padding},${chartHeight - padding}`}
          />
          
          {/* Chart line with shadow */}
          <defs>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.1"/>
            </filter>
          </defs>
          <polyline
            fill="none"
            stroke="#3b82f6"
            strokeWidth="4"
            points={points}
            filter="url(#shadow)"
            className="transition-all duration-200"
          />
          
          {/* Data points with hover effects */}
          {portfolioData.map((data, index) => {
            const x = padding + (index / (portfolioData.length - 1)) * (chartWidth - 2 * padding)
            const y = padding + ((maxValue - data.value) / valueRange) * (chartHeight - 2 * padding)
            const isHovered = hoveredIndex === index
            
            return (
              <g key={index}>
                {/* Hover area (invisible for better interaction) */}
                <rect
                  x={x - 10}
                  y={padding - 10}
                  width="20"
                  height={chartHeight - 2 * padding + 20}
                  fill="transparent"
                  className="cursor-pointer"
                />
                {/* Data point */}
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? "6" : "4"}
                  fill={isHovered ? "#1d4ed8" : "#3b82f6"}
                  stroke="#ffffff"
                  strokeWidth={isHovered ? "3" : "2"}
                  className="transition-all duration-200"
                />
                {/* Hover indicator line */}
                {isHovered && (
                  <line
                    x1={x}
                    y1={padding}
                    x2={x}
                    y2={chartHeight - padding}
                    stroke="#1d4ed8"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    opacity="0.5"
                  />
                )}
              </g>
            )
          })}
          
          {/* Y-axis labels with better styling */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
            const value = minValue + (valueRange * ratio)
            const y = padding + (valueRange * ratio) * (chartHeight - 2 * padding) / valueRange
            return (
              <text
                key={index}
                x="25"
                y={y + 4}
                fontSize="10"
                fill="#6b7280"
                textAnchor="start"
                className="font-medium"
              >
                {formatCurrency(Math.round(value))}
              </text>
            )
          })}
          
          {/* X-axis labels with better spacing */}
          {portfolioData.map((data, index) => {
            if (index % 10 === 0 || index === portfolioData.length - 1) {
              const x = padding + (index / (portfolioData.length - 1)) * (chartWidth - 2 * padding)
              return (
                <text
                  key={index}
                  x={x}
                  y={chartHeight - 20}
                  fontSize="9"
                  fill="#6b7280"
                  textAnchor="middle"
                  className="font-medium"
                >
                  {formatDate(data.date)}
                </text>
              )
            }
            return null
          })}
        </svg>
        
        {/* Tooltip */}
        {tooltip.visible && (
          <div
            className="absolute z-10 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg pointer-events-none"
            style={{
              left: tooltip.x + 10,
              top: tooltip.y - 40,
              transform: 'translateX(-50%)'
            }}
          >
            <div className="font-semibold">{formatDateFull(tooltip.data.date)}</div>
            <div className="text-blue-300">{formatCurrency(tooltip.data.value)}</div>
          </div>
        )}
      </div>
    </div>
  )
} 