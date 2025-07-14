"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Plus, TrendingUp, TrendingDown, Wallet, Activity, PieChart } from "lucide-react"
import GoogleLoginButton from "../../components/Auth/GoogleLoginButton";
import { useAuth } from "../../context/AuthContext"
import AddTransactionModal from "../../components/Transactions/AddTransactionModal"
import PortfolioSummary from "../../components/Portfolio/PortfolioSummary"
import HoldingsList from "../../components/Portfolio/HoldingsList"
import TransactionsList from "../../components/Portfolio/TransactionsList"

export default function Dashboard() {
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, login, logout } = useAuth();
  const router = useRouter();

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleLogin = (userData: any) => {
    login({
      email: userData.email,
      name: userData.name,
      picture: userData.picture
    });
  };

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    router.push('/');
  };

  const handleTransactionAdded = () => {
    // Refresh portfolio data by triggering a page reload
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieChart className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">CryptoTracker</h1>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsAddTransactionOpen(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Transaction
              </button>
              {user && user.picture ? (
                <div className="relative ml-2" ref={dropdownRef}>
                  <img
                    src={user.picture}
                    alt="Profile"
                    className="w-10 h-10 rounded-full border border-gray-300 cursor-pointer"
                    onClick={() => setDropdownOpen((open) => !open)}
                  />
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      <div className="px-4 py-2 text-gray-900 font-medium border-b border-gray-100">
                        {user.name || user.email}
                      </div>
                      <button
                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 rounded-b-lg"
                        onClick={handleLogout}
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <GoogleLoginButton onLogin={handleLogin} />
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 bg-white">
        <PortfolioSummary />

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
            <HoldingsList />
            <TransactionsList />
          </div>
        </div>
      </div>

      <AddTransactionModal
        isOpen={isAddTransactionOpen}
        onClose={() => setIsAddTransactionOpen(false)}
        onTransactionAdded={handleTransactionAdded}
      />
    </div>
  )
} 