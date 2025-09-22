'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Wallet,
  QrCode,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Copy,
  AlertTriangle,
  Timer
} from 'lucide-react';
import Modal from './Modal';
import { useModal } from './useModal';
import { Button } from './ui/Button';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface Transaction {
  transactionId: string;
  qrCodeUrl: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'expired';
  expiresAt?: string;
  timeRemaining?: number;
}

interface TopUpComponentProps {
  userId?: string;
  onSuccess?: () => void;
}

const TopUpComponent: React.FC<TopUpComponentProps> = ({ userId = 'user_123', onSuccess }) => {
  const [amount, setAmount] = useState<string>('');
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isExpired, setIsExpired] = useState<boolean>(false);

  const { modalState, hideModal, showSuccess, showError, showInfo } = useModal();

  useEffect(() => {
    fetchUserCredits();
    fetchTransactionHistory();
  }, [userId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (transaction && transaction.status === 'pending') {
      interval = setInterval(() => {
        checkTransactionStatus();
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [transaction]);

  useEffect(() => {
    let countdownInterval: NodeJS.Timeout;
    if (transaction && transaction.expiresAt && transaction.status === 'pending') {
      countdownInterval = setInterval(() => {
        const now = new Date().getTime();
        const expiry = new Date(transaction.expiresAt!).getTime();
        const remaining = Math.max(0, expiry - now);

        setTimeRemaining(remaining);

        if (remaining <= 0) {
          setIsExpired(true);
          clearInterval(countdownInterval);
        }
      }, 1000);
    }

    return () => clearInterval(countdownInterval);
  }, [transaction]);

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

  const fetchTransactionHistory = async () => {
    try {
      const response = await axios.get(`${API_BASE}/transactions/${userId}?limit=5`);
      if (response.data.success) {
        setTransactions(response.data.transactions);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const generateQR = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      showError('กรุณาใส่จำนวนเงินที่ถูกต้อง');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/create-transaction`, {
        userId,
        amount: parseFloat(amount)
      });

      if (response.data.success) {
        setTransaction({
          ...response.data,
          status: 'pending'
        });
        setIsExpired(false);

        const remaining = response.data.timeRemaining || 5 * 60 * 1000;
        setTimeRemaining(remaining);
      }
    } catch (error) {
      console.error('Error generating QR:', error);
      showError('เกิดข้อผิดพลาดในการสร้าง QR Code');
    } finally {
      setLoading(false);
    }
  };

  const checkTransactionStatus = async () => {
    if (!transaction) return;

    setChecking(true);
    try {
      const response = await axios.get(`${API_BASE}/transaction-status/${transaction.transactionId}`);

      if (response.data.success) {
        const { status, timeRemaining: apiTimeRemaining, isExpired: apiExpired } = response.data.transaction;

        if (status === 'confirmed') {
          setTransaction(prev => prev ? { ...prev, status: 'confirmed' } : null);
          await fetchUserCredits();
          await fetchTransactionHistory();
          if (onSuccess) onSuccess();
          showSuccess('🎉 การเติมเงินสำเร็จแล้ว!');
        } else if (status === 'expired' || apiExpired) {
          setTransaction(prev => prev ? { ...prev, status: 'expired' } : null);
          setIsExpired(true);
          setTimeRemaining(0);
        } else if (apiTimeRemaining !== undefined) {
          setTimeRemaining(apiTimeRemaining);
        }
      }
    } catch (error) {
      console.error('Error checking status:', error);
    } finally {
      setChecking(false);
    }
  };

  const resetForm = () => {
    setAmount('');
    setTransaction(null);
    setIsExpired(false);
    setTimeRemaining(0);
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showInfo('คัดลอกแล้ว!');
  };

  const presetAmounts = [50, 100, 300, 500, 1000, 2000];

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">เติมเงินผ่าน PromptPay</h2>
        <p className="text-gray-600">สแกน QR Code เพื่อเติมเงินเข้าระบบ</p>
      </div>

      {!transaction ? (
        <div className="space-y-6">
          {/* Amount input */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              จำนวนเงินที่ต้องการเติม (บาท)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="ใส่จำนวนเงิน"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-600"
              min="1"
            />

            {/* Preset amounts */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
              {presetAmounts.map((preset) => (
                <Button
                  key={preset}
                  onClick={() => setAmount(preset.toString())}
                  variant="ghost"
                  size="sm"
                >
                  ฿{preset}
                </Button>
              ))}
            </div>
          </div>

          {/* Generate QR button */}
          <Button
            onClick={generateQR}
            disabled={loading || !amount}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <RefreshCw className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <QrCode className="w-5 h-5 mr-2" />
            )}
            <span>{loading ? 'กำลังสร้าง QR Code...' : 'สร้าง QR Code'}</span>
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* QR Code display */}
          <div className="bg-white border-2 border-gray-200 rounded-lg p-6 text-center">
            {transaction.status === 'pending' && !isExpired && (
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2">
                  <Timer className="w-5 h-5 text-orange-500" />
                  <span className="text-lg font-semibold text-orange-600">
                    เหลือเวลา: {formatTime(timeRemaining)}
                  </span>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg inline-block">
                  <img
                    src={transaction.qrCodeUrl}
                    alt="PromptPay QR Code"
                    className="w-64 h-64 mx-auto"
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-lg font-semibold text-gray-600">จำนวนเงิน: ฿{transaction.amount.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">
                    ID: {transaction.transactionId}
                    <Button
                      onClick={() => copyToClipboard(transaction.transactionId)}
                      variant="ghost"
                      size="sm"
                      className="ml-2 h-auto p-1"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </p>
                </div>

                <div className="flex items-center justify-center space-x-2 text-blue-600">
                  <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
                  <span className="text-sm">กำลังรอการชำระเงิน...</span>
                </div>
              </div>
            )}

            {transaction.status === 'confirmed' && (
              <div className="space-y-4">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                <h3 className="text-xl font-semibold text-green-600">การเติมเงินสำเร็จ!</h3>
                <p className="text-lg text-gray-600">จำนวนเงิน: ฿{transaction.amount.toLocaleString()}</p>
              </div>
            )}

            {(transaction.status === 'expired' || isExpired) && (
              <div className="space-y-4">
                <AlertTriangle className="w-16 h-16 text-red-500 mx-auto" />
                <h3 className="text-xl font-semibold text-red-600">QR Code หมดอายุ</h3>
                <p className="text-gray-600">กรุณาสร้าง QR Code ใหม่</p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex space-x-4">
            <Button
              onClick={resetForm}
              variant="secondary"
              className="flex-1"
              size="lg"
            >
              สร้างใหม่
            </Button>
            {transaction.status === 'pending' && !isExpired && (
              <Button
                onClick={checkTransactionStatus}
                disabled={checking}
                className="flex-1"
                size="lg"
              >
                <RefreshCw className={`w-5 h-5 mr-2 ${checking ? 'animate-spin' : ''}`} />
                <span>ตรวจสอบสถานะ</span>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Transaction history */}
      {transactions.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">ประวัติการเติมเงินล่าสุด</h3>
          <div className="space-y-2">
            {transactions.slice(0, 3).map((tx: any, index: number) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-600">฿{tx.amount?.toLocaleString() || 'N/A'}</p>
                  <p className="text-sm text-gray-600">{new Date(tx.created_at).toLocaleString('th-TH')}</p>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  tx.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  tx.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {tx.status === 'confirmed' ? 'สำเร็จ' :
                   tx.status === 'pending' ? 'รอชำระ' : 'หมดอายุ'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={hideModal}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        onConfirm={modalState.onConfirm}
        onCancel={modalState.onCancel}
        showCancel={modalState.showCancel}
      />
    </div>
  );
};

export default TopUpComponent;