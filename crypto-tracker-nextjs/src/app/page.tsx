"use client"

import { useRouter } from "next/navigation"
import { PieChart, TrendingUp, Shield, BarChart3, ArrowRight } from "lucide-react"
import GoogleLoginButton from "../components/Auth/GoogleLoginButton"
import { useAuth } from "../context/AuthContext"

export default function LandingPage() {
  const router = useRouter()
  const { user, login } = useAuth()

  // Redirect to dashboard after successful login
  const handleLogin = (userData: any) => {
    login({
      email: userData.email,
      name: userData.name,
      picture: userData.picture
    })
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChart className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">CryptoTracker</h1>
            </div>
            <GoogleLoginButton onLogin={handleLogin} />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Track Your Crypto Portfolio
            <span className="text-blue-600"> Like a Pro</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Monitor your cryptocurrency investments with real-time data, 
            track your portfolio performance, and make informed decisions.
          </p>
          <div className="flex justify-center gap-4">
            <button 
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              Learn More
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose CryptoTracker?</h2>
          <p className="text-lg text-gray-600">Everything you need to manage your crypto investments</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Portfolio Tracking</h3>
            <p className="text-gray-600">
              Monitor your cryptocurrency holdings with real-time price updates and performance metrics.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Profit & Loss</h3>
            <p className="text-gray-600">
              Track your gains and losses with detailed P&L analysis and performance charts.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure & Private</h3>
            <p className="text-gray-600">
              Your data is secure with Google OAuth authentication and encrypted storage.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Start?</h2>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of crypto investors who trust CryptoTracker to manage their portfolios.
          </p>
          <GoogleLoginButton onLogin={handleLogin} />
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2025 CryptoTracker. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
