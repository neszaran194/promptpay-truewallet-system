// components/TrueWalletComponent.jsx
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

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const TrueWalletComponent = ({ userId = 'user_123' }) => {
  const [voucherCode, setVoucherCode] = useState('');
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success', 'error', 'info'

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

  const showMessage = (text, type) => {
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
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'เกิดข้อผิดพลาดในการแลกซอง';
      showMessage(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Gift className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">TrueWallet ซองอั่งเปา</h2>
          </div>
          <div className="text-right">
            <p className="text-orange-100 text-sm">เครดิตปัจจุบัน</p>
            <p className="text-white text-lg font-bold">{credits.toFixed(2)} บาท</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Message Display */}
        {message && (
          <div className={`mb-4 p-3 rounded-lg border-l-4 ${
            messageType === 'success' ? 'bg-green-50 border-green-400' :
            messageType === 'error' ? 'bg-red-50 border-red-400' :
            'bg-blue-50 border-blue-400'
          }`}>
            <div className="flex items-center space-x-2">
              {getMessageIcon()}
              <span className={`text-sm ${
                messageType === 'success' ? 'text-green-700' :
                messageType === 'error' ? 'text-red-700' :
                'text-blue-700'
              }`}>
                {message}
              </span>
            </div>
          </div>
        )}

        {/* Voucher Input Section */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              โค้ดซองอั่งเปา หรือ ลิงก์ซอง
            </label>
            <div className="relative">
              <input
                type="text"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
                placeholder="ใส่โค้ดซองหรือลิงก์ที่นี่..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                onKeyPress={(e) => e.key === 'Enter' && !loading && redeemVoucher()}
              />
              <button
                onClick={pasteFromClipboard}
                className="absolute right-2 top-2 p-1 hover:bg-gray-100 rounded transition-colors"
                title="วางจาก Clipboard"
              >
                <Copy className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            <button 
              onClick={validateVoucherCode}
              disabled={loading || !voucherCode.trim()}
              className="flex-1 py-2 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors text-sm"
            >
              ตรวจสอบโค้ด
            </button>
            
            <button 
              onClick={redeemVoucher}
              disabled={loading || !voucherCode.trim()}
              className="flex-2 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-medium rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>กำลังแลก...</span>
                </>
              ) : (
                <>
                  <Gift className="w-4 h-4" />
                  <span>แลกซอง</span>
                </>
              )}
            </button>
          </div>

          {/* Instructions */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <h4 className="text-sm font-medium text-yellow-800 mb-1">วิธีการใช้งาน:</h4>
            <ul className="text-xs text-yellow-700 space-y-1">
              <li>• สามารถใส่โค้ดซอง (เช่น: xxxxhFog10Ijbmg1c)</li>
              <li>• หรือลิงก์ซองโดยตรง (gift.truemoney.com/...)</li>
              <li>• กดตรวจสอบโค้ดก่อนแลกเพื่อความปลอดภัย</li>
              <li>• เครดิตจะเข้าทันทีหลังแลกซองสำเร็จ</li>
            </ul>
          </div>
        </div>

        {/* Voucher History */}
        {history.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-700">ประวัติการแลกซอง</h4>
              <TrendingUp className="w-4 h-4 text-gray-500" />
            </div>
            <div className="space-y-2">
              {history.slice(0, 3).map((voucher, index) => (
                <div key={index} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                  <div className="flex items-center space-x-2">
                    <Gift className="w-4 h-4 text-orange-500" />
                    <div>
                      <div className="font-medium">+{voucher.amount} บาท</div>
                      <div className="text-xs text-gray-500">จาก {voucher.owner_name}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">
                      {formatDate(voucher.redeemed_at)}
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-400">
                        {voucher.type === 'url' ? 'ลิงก์' : 'โค้ด'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TrueWallet Info */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>เบอร์ TrueWallet: {process.env.REACT_APP_TRUEWALLET_PHONE || '0944283381'}</span>
            <div className="flex items-center space-x-1">
              <ExternalLink className="w-3 h-3" />
              <span>TrueWallet</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrueWalletComponent;