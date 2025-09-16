// อัปเดต TopUpComponent.jsx - เพิ่มเวลาถอยหลัง

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

const API_BASE = 'http://localhost:3001/api';

const TopUpComponent = ({ userId = 'user_123' }) => {
  const [amount, setAmount] = useState('');
  const [transaction, setTransaction] = useState(null);
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    fetchUserCredits();
    fetchTransactionHistory();
  }, [userId]);

  useEffect(() => {
    let interval;
    if (transaction && transaction.status === 'pending') {
      interval = setInterval(() => {
        checkTransactionStatus();
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [transaction]);

  // เวลาถอยหลัง
  useEffect(() => {
    let countdownInterval;
    if (transaction && transaction.expiresAt && transaction.status === 'pending') {
      countdownInterval = setInterval(() => {
        const now = new Date().getTime();
        const expiry = new Date(transaction.expiresAt).getTime();
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
    if (!amount || amount <= 0) {
      alert('กรุณาใส่จำนวนเงินที่ถูกต้อง');
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

        // ตั้งเวลาเริ่มต้น
        const remaining = response.data.timeRemaining || 5 * 60 * 1000;
        setTimeRemaining(remaining);
      }
    } catch (error) {
      console.error('Error generating QR:', error);
      alert('เกิดข้อผิดพลาดในการสร้าง QR Code');
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
          setTransaction(prev => ({ ...prev, status: 'confirmed' }));
          await fetchUserCredits();
          await fetchTransactionHistory();
          alert('🎉 การเติมเงินสำเร็จแล้ว!');
        } else if (status === 'expired' || apiExpired) {
          setTransaction(prev => ({ ...prev, status: 'expired' }));
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
    setTimeRemaining(0);
    setIsExpired(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('คัดลอกแล้ว!');
  };

  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'confirmed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'expired':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'รอการยืนยัน';
      case 'confirmed':
        return 'สำเร็จ';
      case 'expired':
        return 'หมดเวลา';
      default:
        return 'ไม่สำเร็จ';
    }
  };

  const getTimeColor = () => {
    if (timeRemaining <= 60000) return 'text-red-500'; // < 1 นาที
    if (timeRemaining <= 120000) return 'text-orange-500'; // < 2 นาที  
    return 'text-green-500';
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Wallet className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">เติมเงิน PromptPay</h2>
          </div>
          <div className="text-right">
            <p className="text-blue-100 text-sm">เครดิตปัจจุบัน</p>
            <p className="text-white text-lg font-bold">{credits.toFixed(2)} บาท</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {!transaction ? (
          // Input Section
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                จำนวนเงิน (บาท)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="ใส่จำนวนเงิน"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
              />
            </div>

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-3 gap-2">
              {[100, 500, 1000].map((quickAmount) => (
                <button
                  key={quickAmount}
                  onClick={() => setAmount(quickAmount.toString())}
                  className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  {quickAmount} บาท
                </button>
              ))}
            </div>

            <button
              onClick={generateQR}
              disabled={loading || !amount}
              className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>กำลังสร้าง QR Code...</span>
                </>
              ) : (
                <>
                  <QrCode className="w-5 h-5" />
                  <span>สร้าง QR Code</span>
                </>
              )}
            </button>
          </div>
        ) : (
          // QR Code Section
          <div className="space-y-4">
            {/* Countdown Timer */}
            {transaction.status === 'pending' && !isExpired && (
              <div className={`text-center p-3 rounded-lg border-2 ${timeRemaining <= 60000 ? 'border-red-200 bg-red-50' :
                  timeRemaining <= 120000 ? 'border-orange-200 bg-orange-50' :
                    'border-green-200 bg-green-50'
                }`}>
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Timer className={`w-5 h-5 ${getTimeColor()}`} />
                  <span className="text-sm font-medium text-gray-600">เวลาที่เหลือ</span>
                </div>
                <div className={`text-2xl font-bold ${getTimeColor()}`}>
                  {formatTime(timeRemaining)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  QR Code จะหมดอายุในอีก {formatTime(timeRemaining)}
                </div>
              </div>
            )}

            {/* Expired Notice */}
            {(isExpired || transaction.status === 'expired') && (
              <div className="text-center p-4 rounded-lg border-2 border-red-200 bg-red-50">
                <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-700 font-medium">QR Code หมดอายุแล้ว</p>
                <p className="text-red-600 text-sm">กรุณาสร้าง QR Code ใหม่</p>
              </div>
            )}

            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                สแกน QR Code เพื่อโอนเงิน
              </h3>

              {/* QR Code */}
              <div className={`bg-white p-4 rounded-lg border-2 inline-block ${isExpired || transaction.status === 'expired' ?
                  'border-red-200 opacity-50' : 'border-gray-200'
                }`}>
                <img
                  src={transaction.qrCodeDataURL}
                  alt="QR Code"
                  className="w-48 h-48 mx-auto"
                />
                {(isExpired || transaction.status === 'expired') && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-red-500 text-white px-3 py-1 rounded text-sm font-bold">
                      หมดอายุ
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Transaction Details */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">จำนวนที่ต้องโอน:</span>
                  <span className="font-bold text-lg text-yellow-700">
                    {transaction.expectedAmount} บาท
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">เบอร์ PromptPay:</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono">{transaction.phoneNumber}</span>
                    <button
                      onClick={() => copyToClipboard(transaction.phoneNumber)}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {transaction.expiresAt && (
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>หมดอายุ:</span>
                    <span>{new Date(transaction.expiresAt).toLocaleString('th-TH')}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center justify-center space-x-2">
              {getStatusIcon(transaction.status)}
              <span className="text-sm font-medium">
                {transaction.status === 'pending' && checking ? 'กำลังตรวจสอบ...' : getStatusText(transaction.status)}
              </span>
              {checking && <RefreshCw className="w-4 h-4 animate-spin" />}
            </div>

            {transaction.status === 'pending' && !isExpired && (
              <div className="text-center text-sm text-gray-500">
                ระบบจะตรวจสอบการโอนเงินอัตโนมัติทุก 3 วินาที
              </div>
            )}

            {transaction.status === 'confirmed' && (
              <div className="text-center">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-green-700 font-medium">การเติมเงินสำเร็จแล้ว!</p>
                </div>
              </div>
            )}

            <div className="flex space-x-2">
              <button
                onClick={resetForm}
                className="flex-1 py-2 bg-gray-500 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                เติมเงินใหม่
              </button>

              {(isExpired || transaction.status === 'expired') && (
                <button
                  onClick={() => {
                    setAmount(transaction.amount.toString());
                    resetForm();
                  }}
                  className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
                >
                  สร้าง QR ใหม่
                </button>
              )}
            </div>
          </div>
        )}

        {/* Transaction History */}
        {transactions.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3">ประวัติการเติมเงิน</h4>
            <div className="space-y-2">
              {transactions.slice(0, 3).map((tx, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(tx.status)}
                      <div>
                        <div className="text-sm font-medium">
                          {new Date(tx.created_at).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        {tx.status === 'expired' && (
                          <span className="text-xs text-red-500">(หมดเวลา)</span>
                        )}
                        {tx.status === 'pending' && (
                          <span className="text-xs text-yellow-600">(รอการยืนยัน)</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`font-bold text-lg ${tx.status === 'confirmed' ? 'text-green-600' :
                          tx.status === 'expired' ? 'text-red-600' : 'text-yellow-600'
                        }`}>
                        +{parseFloat(tx.amount).toFixed(2)} บาท
                      </span>
                      {tx.expected_amount && tx.status === 'confirmed' && (
                        <div className="text-xs text-gray-500">
                          จ่ายจริง: {parseFloat(tx.expected_amount).toFixed(2)} บาท
                        </div>
                      )}
                      {tx.expected_amount && tx.status === 'pending' && (
                        <div className="text-xs text-gray-600 font-medium">
                          โอนจำนวน: {parseFloat(tx.expected_amount).toFixed(2)} บาท
                        </div>
                      )}
                    </div>
                  </div>

                  {/* แสดงรายละเอียดเพิ่มเติมสำหรับ pending transactions */}
                  {tx.status === 'pending' && tx.expected_amount && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>จำนวนเดิม:</span>
                        <span>{parseFloat(tx.amount).toFixed(2)} บาท</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>สตางค์เพิ่ม:</span>
                        <span>+{((tx.expected_amount - tx.amount) * 100).toFixed(0)} สตางค์</span>
                      </div>
                      <div className="flex justify-between text-xs font-medium text-gray-700">
                        <span>รวมที่ต้องโอน:</span>
                        <span>{parseFloat(tx.expected_amount).toFixed(2)} บาท</span>
                      </div>
                    </div>
                  )}

                  {/* แสดงรายละเอียดสำหรับ confirmed transactions */}
                  {tx.status === 'confirmed' && tx.expected_amount && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="flex justify-between text-xs text-green-700">
                        <span>ได้รับเครดิต:</span>
                        <span>{parseFloat(tx.amount).toFixed(2)} บาท</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>สตางค์ที่เพิ่ม:</span>
                        <span>+{((tx.expected_amount - tx.amount) * 100).toFixed(0)} สตางค์</span>
                      </div>
                      {tx.confirmed_at && (
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>ยืนยันเมื่อ:</span>
                          <span>
                            {new Date(tx.confirmed_at).toLocaleString('th-TH', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopUpComponent;