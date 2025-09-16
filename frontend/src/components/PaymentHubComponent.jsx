// components/PaymentHubComponent.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TopUpComponent from './TopUpComponent';
import TrueWalletComponent from './TrueWalletComponent';
import { 
  Wallet, 
  Gift, 
  CreditCard,
  BarChart3,
  History,
  Settings,
  RefreshCw
} from 'lucide-react';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const PaymentHubComponent = ({ userId = 'user_123' }) => {
  const [activeTab, setActiveTab] = useState('promptpay');
  const [credits, setCredits] = useState(0);
  const [stats, setStats] = useState({
    promptpay: { total: 0, count: 0 },
    truewallet: { total: 0, count: 0 }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUserCredits();
    fetchPaymentStats();
  }, [userId]);

  const fetchUserCredits = async () => {
    try {
      const response = await axios.get(`${API_BASE}/user-credits/${userId}`);
      if (response.data.success) {
        setCredits(response.data.credits);
      }
    } catch (error) {
      console.error('Error fetching credits:', error);
    }
  };

  const fetchPaymentStats = async () => {
    setLoading(true);
    try {
      // Get TrueWallet stats
      const twResponse = await axios.get(`${API_BASE}/truewallet/stats`);
      if (twResponse.data.success) {
        setStats(prev => ({
          ...prev,
          truewallet: {
            total: twResponse.data.stats.total_amount || 0,
            count: twResponse.data.stats.total_redeemed || 0
          }
        }));
      }

      // Get PromptPay stats (from general stats)
      const statsResponse = await axios.get(`${API_BASE}/stats`);
      if (statsResponse.data.success) {
        const confirmedTx = statsResponse.data.transaction_stats.find(s => s.status === 'confirmed');
        if (confirmedTx) {
          setStats(prev => ({
            ...prev,
            promptpay: {
              total: confirmedTx.total_amount || 0,
              count: confirmedTx.count || 0
            }
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching payment stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    await fetchUserCredits();
    await fetchPaymentStats();
  };

  const getTotalTransactions = () => {
    return stats.promptpay.count + stats.truewallet.count;
  };

  const getTotalAmount = () => {
    return stats.promptpay.total + stats.truewallet.total;
  };

  const getTabIcon = (tab) => {
    switch (tab) {
      case 'promptpay':
        return <CreditCard className="w-5 h-5" />;
      case 'truewallet':
        return <Gift className="w-5 h-5" />;
      case 'stats':
        return <BarChart3 className="w-5 h-5" />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header with Credits */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Wallet className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">ระบบเติมเงิน</h2>
          </div>
          <div className="text-right">
            <p className="text-purple-100 text-sm">เครดิตทั้งหมด</p>
            <div className="flex items-center space-x-2">
              <p className="text-white text-lg font-bold">{credits.toFixed(2)} บาท</p>
              <button 
                onClick={refreshData}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 text-white ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-gray-50 px-6 py-3">
        <div className="flex space-x-1">
          {[
            { key: 'promptpay', label: 'PromptPay', color: 'blue' },
            { key: 'truewallet', label: 'TrueWallet', color: 'orange' },
            { key: 'stats', label: 'สถิติ', color: 'purple' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? `bg-${tab.color}-500 text-white`
                  : 'text-gray-600 hover:bg-gray-200'
              }`}
            >
              {getTabIcon(tab.key)}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-0">
        {activeTab === 'promptpay' && (
          <div className="bg-white">
            <TopUpComponent userId={userId} />
          </div>
        )}

        {activeTab === 'truewallet' && (
          <div className="bg-white">
            <TrueWalletComponent userId={userId} />
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">สถิติการเติมเงิน</h3>
            
            {/* Overall Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
                <div className="text-center">
                  <p className="text-blue-600 text-2xl font-bold">{getTotalTransactions()}</p>
                  <p className="text-blue-700 text-sm">ครั้งทั้งหมด</p>
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg">
                <div className="text-center">
                  <p className="text-green-600 text-2xl font-bold">{getTotalAmount().toFixed(0)}</p>
                  <p className="text-green-700 text-sm">บาททั้งหมด</p>
                </div>
              </div>
            </div>

            {/* Method Breakdown */}
            <div className="space-y-3">
              <h4 className="text-md font-medium text-gray-700">แยกตามช่องทาง</h4>
              
              {/* PromptPay Stats */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-800">PromptPay</span>
                  </div>
                  <div className="text-right">
                    <p className="text-blue-600 font-bold">{stats.promptpay.count} ครั้ง</p>
                    <p className="text-blue-700 text-sm">{stats.promptpay.total.toFixed(2)} บาท</p>
                  </div>
                </div>
              </div>

              {/* TrueWallet Stats */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Gift className="w-5 h-5 text-orange-600" />
                    <span className="font-medium text-orange-800">TrueWallet</span>
                  </div>
                  <div className="text-right">
                    <p className="text-orange-600 font-bold">{stats.truewallet.count} ครั้ง</p>
                    <p className="text-orange-700 text-sm">{stats.truewallet.total.toFixed(2)} บาท</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <h4 className="text-sm font-medium text-gray-700 mb-2">ข้อมูลเพิ่มเติม</h4>
              <div className="space-y-1 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>เบอร์ PromptPay:</span>
                  <span className="font-mono">0944283381</span>
                </div>
                <div className="flex justify-between">
                  <span>เบอร์ TrueWallet:</span>
                  <span className="font-mono">0944283381</span>
                </div>
                <div className="flex justify-between">
                  <span>อัปเดตล่าสุด:</span>
                  <span>{new Date().toLocaleTimeString('th-TH')}</span>
                </div>
              </div>
            </div>

            {/* Refresh Button */}
            <button
              onClick={refreshData}
              disabled={loading}
              className="w-full py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>กำลังอัปเดต...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>อัปเดตข้อมูล</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentHubComponent;