'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TopUpComponent from './TopUpComponent';
import TrueWalletComponent from './TrueWalletComponent';
import { Button } from './ui/Button';
import {
  Wallet,
  Gift,
  CreditCard,
  BarChart3,
  History,
  Settings,
  RefreshCw
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface PaymentStats {
  promptpay: { total: number; count: number };
  truewallet: { total: number; count: number };
}

interface PaymentHubComponentProps {
  userId?: string;
}

const PaymentHubComponent: React.FC<PaymentHubComponentProps> = ({ userId = 'user_123' }) => {
  const [activeTab, setActiveTab] = useState<string>('promptpay');
  const [credits, setCredits] = useState<number>(0);
  const [stats, setStats] = useState<PaymentStats>({
    promptpay: { total: 0, count: 0 },
    truewallet: { total: 0, count: 0 }
  });
  const [loading, setLoading] = useState<boolean>(false);

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

      // Get PromptPay stats
      const statsResponse = await axios.get(`${API_BASE}/stats`);
      if (statsResponse.data.success) {
        const confirmedTx = statsResponse.data.transaction_stats.find((s: any) => s.status === 'confirmed');
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

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'promptpay':
        return <CreditCard className="w-5 h-5" />;
      case 'truewallet':
        return <Gift className="w-5 h-5" />;
      case 'stats':
        return <BarChart3 className="w-5 h-5" />;
      default:
        return <Wallet className="w-5 h-5" />;
    }
  };

  const tabs = [
    { id: 'promptpay', label: 'PromptPay QR', icon: 'promptpay' },
    { id: 'truewallet', label: 'TrueWallet', icon: 'truewallet' },
    { id: 'stats', label: 'สถิติ', icon: 'stats' }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header with balance and refresh */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Wallet className="w-6 h-6 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">ยอดเงินคงเหลือ</p>
                <p className="text-2xl font-bold text-gray-800">
                  ฿{credits.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">ธุรกรรมทั้งหมด</p>
                <p className="text-xl font-semibold text-gray-800">
                  {getTotalTransactions().toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">จำนวนเงินรวม</p>
                <p className="text-xl font-semibold text-green-600">
                  ฿{getTotalAmount().toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <Button
            onClick={refreshData}
            disabled={loading}
            variant="default"
            size="default"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            <span>รีเฟรช</span>
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                variant="ghost"
                className={`flex items-center space-x-2 px-6 py-4 border-b-2 font-medium text-sm rounded-none transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {getTabIcon(tab.icon)}
                <span>{tab.label}</span>
              </Button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-md">
        {activeTab === 'promptpay' && (
          <TopUpComponent
            userId={userId}
            onSuccess={refreshData}
          />
        )}

        {activeTab === 'truewallet' && (
          <TrueWalletComponent
            userId={userId}
            onSuccess={refreshData}
          />
        )}

        {activeTab === 'stats' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-600">สถิติการใช้งาน</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* PromptPay Stats */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-blue-800">PromptPay</h4>
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-blue-600">
                    ธุรกรรม: {stats.promptpay.count.toLocaleString()} ครั้ง
                  </p>
                  <p className="text-lg font-semibold text-blue-800">
                    ฿{stats.promptpay.total.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* TrueWallet Stats */}
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-green-800">TrueWallet</h4>
                  <Gift className="w-5 h-5 text-green-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-green-600">
                    ธุรกรรม: {stats.truewallet.count.toLocaleString()} ครั้ง
                  </p>
                  <p className="text-lg font-semibold text-green-800">
                    ฿{stats.truewallet.total.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentHubComponent;