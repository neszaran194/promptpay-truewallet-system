'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  FunnelIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/Select';
import { Button } from '../../components/ui/Button';

interface Transaction {
  transaction_id: string;
  amount: number;
  status: string;
  type: string;
  created_at: string;
  expires_at: string;
  user_id?: string;
  payment_ref?: string;
}

interface TransactionStats {
  status: string;
  count: number;
  total_amount: number;
}

const API_URL = 'http://localhost:3001';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'incoming' | 'truewallet' | 'outgoing'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'expired'>('all');
  const [userId] = useState('user_123'); // Default user ID
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchTransactions();
    fetchStats();

    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      fetchTransactions();
      fetchStats();
    }, 5000);
    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [filter, statusFilter]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);

      // Fetch both user transactions and system withdrawal transactions
      const [userResponse, withdrawalResponse] = await Promise.all([
        axios.get(`${API_URL}/api/transactions/${userId}?limit=50`),
        axios.get(`${API_URL}/api/transactions/system_withdrawal?limit=50`)
      ]);

      let allTransactions: Transaction[] = [];

      // Add user transactions
      if (userResponse.data.success) {
        allTransactions = [...allTransactions, ...userResponse.data.transactions];
      }

      // Add withdrawal transactions (from SMS)
      if (withdrawalResponse.data.success) {
        allTransactions = [...allTransactions, ...withdrawalResponse.data.transactions];
      }

      // Sort by created_at DESC
      allTransactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Apply filters
      if (filter !== 'all') {
        allTransactions = allTransactions.filter((t: Transaction) =>
          t.type === filter
        );
      }

      if (statusFilter !== 'all') {
        allTransactions = allTransactions.filter((t: Transaction) =>
          t.status === statusFilter
        );
      }

      setTransactions(allTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/stats`);
      if (response.data.success) {
        setStats(response.data.transaction_stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'expired':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClass = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    switch (status) {
      case 'confirmed':
        return `${baseClass} bg-green-100 text-green-800`;
      case 'pending':
        return `${baseClass} bg-yellow-100 text-yellow-800`;
      case 'expired':
        return `${baseClass} bg-red-100 text-red-800`;
      default:
        return `${baseClass} bg-gray-100 text-gray-800`;
    }
  };

  const getTypeBadge = (type: string) => {
    const baseClass = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    switch (type) {
      case 'incoming':
        return `${baseClass} bg-blue-100 text-blue-800`;
      case 'truewallet':
        return `${baseClass} bg-green-100 text-green-800`;
      case 'outgoing':
        return `${baseClass} bg-orange-100 text-orange-800`;
      default:
        return `${baseClass} bg-gray-100 text-gray-800`;
    }
  };

  const exportToCSV = () => {
    const headers = ['Transaction ID', 'Type', 'Amount', 'Status', 'Date', 'User ID'];
    const csvData = transactions.map(t => [
      t.transaction_id,
      t.type || 'incoming',
      t.amount,
      t.status,
      new Date(t.created_at).toLocaleString('th-TH'),
      t.user_id || userId
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const calculateTotals = () => {
    const incoming = transactions
      .filter(t => (t.type === 'incoming' || !t.type) && t.status === 'confirmed')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const truewallet = transactions
      .filter(t => t.type === 'truewallet' && t.status === 'confirmed')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const outgoing = transactions
      .filter(t => t.type === 'outgoing' && t.status === 'confirmed')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalIncoming = incoming + truewallet;

    return { incoming, truewallet, outgoing, totalIncoming, net: totalIncoming - outgoing };
  };

  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">ประวัติการทำรายการ</h1>
          <p className="mt-2 text-sm text-gray-600">
            ดูประวัติการรับและโอนเงินทั้งหมดในระบบ
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">PromptPay</p>
                <p className="text-2xl font-bold text-blue-600">
                  ฿{totals.incoming.toFixed(2)}
                </p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold">P</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">TrueWallet</p>
                <p className="text-2xl font-bold text-green-600">
                  ฿{totals.truewallet.toFixed(2)}
                </p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold">T</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">เงินออก</p>
                <p className="text-2xl font-bold text-red-600">
                  ฿{totals.outgoing.toFixed(2)}
                </p>
              </div>
              <ArrowUpIcon className="h-8 w-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">ยอดสุทธิ</p>
                <p className="text-2xl font-bold text-purple-600">
                  ฿{totals.net.toFixed(2)}
                </p>
              </div>
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-bold">Σ</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">รายการทั้งหมด</p>
                <p className="text-2xl font-bold text-gray-900">
                  {transactions.length}
                </p>
              </div>
              <div className="h-8 w-8 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-gray-600 font-bold">#</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <FunnelIcon className="h-5 w-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">ตัวกรอง:</span>
                </div>

                <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    <SelectItem value="incoming">PromptPay</SelectItem>
                    <SelectItem value="truewallet">TrueWallet</SelectItem>
                    <SelectItem value="outgoing">เงินออก</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกสถานะ</SelectItem>
                    <SelectItem value="pending">รอดำเนินการ</SelectItem>
                    <SelectItem value="confirmed">สำเร็จ</SelectItem>
                    <SelectItem value="expired">หมดอายุ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={fetchTransactions}
                  variant="outline"
                >
                  <ArrowPathIcon className="h-4 w-4 mr-2" />
                  รีเฟรช
                </Button>

                <Button
                  onClick={exportToCSV}
                  variant="default"
                >
                  <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ประเภท
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    จำนวนเงิน
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    วันที่
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    เวลา
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                      <div className="flex justify-center items-center">
                        <ArrowPathIcon className="h-5 w-5 animate-spin mr-2" />
                        กำลังโหลด...
                      </div>
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                      ไม่พบรายการ
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => (
                    <tr key={transaction.transaction_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {transaction.transaction_id.substring(0, 8)}...
                        </code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          {transaction.type === 'outgoing' ? (
                            <ArrowUpIcon className="h-4 w-4 text-red-500 mr-1" />
                          ) : (
                            <ArrowDownIcon className="h-4 w-4 text-green-500 mr-1" />
                          )}
                          <span className={getTypeBadge(transaction.type || 'incoming')}>
                            {transaction.type === 'outgoing' ? 'เงินออก' :
                             transaction.type === 'truewallet' ? 'TrueWallet' : 'PromptPay'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={
                          transaction.type === 'outgoing'
                            ? 'text-red-600 font-semibold'
                            : 'text-green-600 font-semibold'
                        }>
                          {transaction.type === 'outgoing' ? '-' : '+'}
                          ฿{Number(transaction.amount).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center">
                          {getStatusIcon(transaction.status)}
                          <span className={`ml-2 ${getStatusBadge(transaction.status)}`}>
                            {transaction.status === 'confirmed' ? 'สำเร็จ' :
                             transaction.status === 'pending' ? 'รอดำเนินการ' : 'หมดอายุ'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(transaction.created_at).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDistanceToNow(new Date(transaction.created_at), {
                          addSuffix: true,
                          locale: th
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Status Summary */}
        {stats.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">สรุปตามสถานะ</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {stats.map((stat) => (
                <div key={stat.status} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    {getStatusIcon(stat.status)}
                    <span className="ml-2 text-sm font-medium text-gray-900">
                      {stat.status === 'confirmed' ? 'สำเร็จ' :
                       stat.status === 'pending' ? 'รอดำเนินการ' : 'หมดอายุ'}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{stat.count} รายการ</p>
                    <p className="text-sm font-semibold text-gray-900">
                      ฿{stat.total_amount.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}