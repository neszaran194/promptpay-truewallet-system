'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Wallet,
  Gift,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Copy,
  ExternalLink,
  Clock,
  TrendingUp
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface VoucherHistory {
  voucher_code: string;
  amount: number;
  owner_full_name: string;
  redeemed_at: string;
  status: string;
}

interface TrueWalletComponentProps {
  userId?: string;
  onSuccess?: () => void;
}

const TrueWalletComponent: React.FC<TrueWalletComponentProps> = ({ userId = 'user_123', onSuccess }) => {
  const [voucherCode, setVoucherCode] = useState<string>('');
  const [credits, setCredits] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [history, setHistory] = useState<VoucherHistory[]>([]);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info' | ''>('');

  useEffect(() => {
    fetchUserCredits();
    fetchVoucherHistory();
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

  const fetchVoucherHistory = async () => {
    try {
      const response = await axios.get(`${API_BASE}/truewallet/history/${userId}?limit=5`);
      if (response.data.success) {
        setHistory(response.data.history);
      }
    } catch (error) {
      console.error('Error fetching voucher history:', error);
    }
  };

  const showMessage = (text: string, type: 'success' | 'error' | 'info') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  const validateVoucherCode = async () => {
    if (!voucherCode.trim()) {
      showMessage('กรุณาใส่โค้ดซองอั่งเปา', 'error');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}/truewallet/validate`, {
        voucherCode: voucherCode.trim()
      });

      if (response.data.success) {
        const validation = response.data.validation;
        showMessage(
          `โค้ดซองอั่งเปาถูกต้อง (ประเภท: ${validation.type === 'url' ? 'ลิงก์' : 'โค้ด'})`,
          'success'
        );
      }
    } catch (error) {
      showMessage('โค้ดซองอั่งเปาไม่ถูกต้อง', 'error');
    }
  };

  const redeemVoucher = async () => {
    if (!voucherCode.trim()) {
      showMessage('กรุณาใส่โค้ดซองอั่งเปา', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE}/truewallet/redeem`, {
        userId,
        voucherCode: voucherCode.trim()
      });

      if (response.data.success) {
        const { voucher_info } = response.data;
        showMessage(
          `แลกซองสำเร็จ! ได้รับ ${voucher_info.amount} บาท จาก ${voucher_info.owner_full_name}`,
          'success'
        );

        setVoucherCode('');
        await fetchUserCredits();
        await fetchVoucherHistory();
        if (onSuccess) onSuccess();
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'เกิดข้อผิดพลาดในการแลกซอง';
      showMessage(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showMessage('คัดลอกแล้ว!', 'info');
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setVoucherCode(text);
      showMessage('วางโค้ดแล้ว', 'info');
    } catch (error) {
      showMessage('ไม่สามารถวางโค้ดได้', 'error');
    }
  };

  const getMessageIcon = () => {
    switch (messageType) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'info':
        return <Gift className="w-5 h-5 text-blue-500" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">แลกซอง TrueWallet</h2>
        <p className="text-gray-600">ใส่โค้ดซองอั่งเปาเพื่อเติมเงินเข้าระบบ</p>
      </div>

      {/* Message display */}
      {message && (
        <div className={`flex items-center space-x-2 p-4 rounded-lg ${
          messageType === 'success' ? 'bg-green-50 text-green-800' :
          messageType === 'error' ? 'bg-red-50 text-red-800' :
          'bg-blue-50 text-blue-800'
        }`}>
          {getMessageIcon()}
          <span>{message}</span>
        </div>
      )}

      {/* Voucher input */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          โค้ดซองอั่งเปา TrueWallet
        </label>

        <div className="flex space-x-2">
          <input
            type="text"
            value={voucherCode}
            onChange={(e) => setVoucherCode(e.target.value)}
            placeholder="วางโค้ดซองอั่งเปาที่นี่"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-600"
            onKeyPress={(e) => e.key === 'Enter' && redeemVoucher()}
          />
          <button
            onClick={pasteFromClipboard}
            className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            title="วางจาก Clipboard"
          >
            <Copy className="w-5 h-5" />
          </button>
        </div>

        <div className="text-sm text-gray-600 space-y-2">
          <p>รองรับ:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>โค้ดซองอั่งเปา TrueWallet (เช่น ABC123456789)</li>
            <li>ลิงก์ซองอั่งเปา (เช่น https://wallet.truemoney.com/...)</li>
          </ul>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex space-x-4">
        <button
          onClick={validateVoucherCode}
          disabled={loading || !voucherCode.trim()}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          <Gift className="w-5 h-5" />
          <span>ตรวจสอบโค้ด</span>
        </button>

        <button
          onClick={redeemVoucher}
          disabled={loading || !voucherCode.trim()}
          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
        >
          {loading ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Wallet className="w-5 h-5" />
          )}
          <span>{loading ? 'กำลังแลก...' : 'แลกซอง'}</span>
        </button>
      </div>

      {/* Instructions */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-medium text-yellow-800 mb-2">วิธีการใช้งาน:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-700">
          <li>คัดลอกโค้ดซองอั่งเปาจาก TrueWallet</li>
          <li>วางโค้ดในช่องด้านบน</li>
          <li>กด "ตรวจสอบโค้ด" เพื่อยืนยันความถูกต้อง (ไม่บังคับ)</li>
          <li>กด "แลกซอง" เพื่อเติมเงินเข้าระบบ</li>
        </ol>
      </div>

      {/* Voucher history */}
      {history.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">ประวัติการแลกซองล่าสุด</h3>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>

          <div className="space-y-3">
            {history.slice(0, 5).map((item, index) => (
              <div key={index} className="flex justify-between items-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Gift className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-green-800">
                      ฿{item.amount?.toLocaleString() || 'N/A'}
                    </span>
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    จาก: {item.owner_full_name || 'ไม่ระบุ'}
                  </p>
                  <p className="text-xs text-green-500 mt-1">
                    {formatDate(item.redeemed_at)}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => copyToClipboard(item.voucher_code)}
                    className="p-1 text-green-600 hover:text-green-800 transition-colors"
                    title="คัดลอกโค้ด"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                    สำเร็จ
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 mb-2">💡 เคล็ดลับ:</h3>
        <ul className="space-y-1 text-sm text-blue-700">
          <li>• โค้ดแต่ละอันใช้ได้เพียงครั้งเดียว</li>
          <li>• ซองอั่งเปาอาจมีวันหมดอายุ ควรแลกทันที</li>
          <li>• เงินจะเข้าระบบทันทีหลังแลกซองสำเร็จ</li>
        </ul>
      </div>
    </div>
  );
};

export default TrueWalletComponent;