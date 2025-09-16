// utils/promptpay.js
const QRCode = require('qrcode');

class PromptPayUtils {
  static generateRandomCents() {
    return Math.floor(Math.random() * 99) + 1;
  }

  static generatePromptPayQR(phoneNumber, amount) {
    try {
      // แปลงเบอร์โทรเป็น format ที่ถูกต้อง
      let formattedPhone = phoneNumber;
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '66' + formattedPhone.substring(1);
      }
      
      // แปลง amount เป็น string ที่ถูกต้อง
      const amountStr = parseFloat(amount).toFixed(2);
      
      console.log('🔧 Generating PromptPay QR:', { phoneNumber, formattedPhone, amount: amountStr });
      
      // สร้าง QR data ตาม EMV standard
      let qrData = '';
      
      // Payload Format Indicator (ID 00)
      qrData += '00' + '02' + '01';
      
      // Point of Initiation Method (ID 01) 
      qrData += '01' + '02' + '11';
      
      // Merchant Account Information (ID 29) - PromptPay
      const promptPayData = '0016A000000677010111' + 
                           '01' + formattedPhone.length.toString().padStart(2, '0') + formattedPhone;
      qrData += '29' + promptPayData.length.toString().padStart(2, '0') + promptPayData;
      
      // Transaction Currency (ID 53) - THB = 764
      qrData += '53' + '03' + '764';
      
      // Transaction Amount (ID 54)
      if (amount > 0) {
        qrData += '54' + amountStr.length.toString().padStart(2, '0') + amountStr;
      }
      
      // Country Code (ID 58) - Thailand = TH
      qrData += '58' + '02' + 'TH';
      
      // CRC placeholder (ID 63)
      qrData += '6304';
      
      // คำนวด CRC16
      const crc = this.calculateCRC16(qrData);
      qrData = qrData.substring(0, qrData.length - 4) + '63' + '04' + crc;
      
      console.log('✅ Generated QR data:', qrData);
      console.log('📏 QR data length:', qrData.length);
      
      return qrData;
    } catch (error) {
      console.error('❌ Error generating PromptPay QR:', error);
      throw new Error(`QR generation failed: ${error.message}`);
    }
  }

  static calculateCRC16(data) {
    let crc = 0xFFFF;
    
    for (let i = 0; i < data.length; i++) {
      crc ^= data.charCodeAt(i) << 8;
      
      for (let j = 0; j < 8; j++) {
        if (crc & 0x8000) {
          crc = (crc << 1) ^ 0x1021;
        } else {
          crc = crc << 1;
        }
      }
    }
    
    crc = crc & 0xFFFF;
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }

  static async generateQRCodeImage(qrString) {
    try {
      return await QRCode.toDataURL(qrString, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });
    } catch (error) {
      console.error('❌ QR image generation error:', error);
      throw new Error('Failed to generate QR image');
    }
  }
}

module.exports = PromptPayUtils;