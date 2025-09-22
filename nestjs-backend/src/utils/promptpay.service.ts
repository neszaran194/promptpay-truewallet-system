import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';

@Injectable()
export class PromptPayService {

  static generateRandomCents(): number {
    return Math.floor(Math.random() * 99) + 1;
  }

  static generatePromptPayQR(phoneNumber: string, amount: number): string {
    try {
      // แปลงเบอร์โทรเป็น format ที่ถูกต้อง
      let formattedPhone = phoneNumber;
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '66' + formattedPhone.substring(1);
      }

      // แปลง amount เป็น string ที่ถูกต้อง
      const amountStr = parseFloat(amount.toString()).toFixed(2);

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
      const crc = PromptPayService.calculateCRC16(qrData);
      qrData = qrData.substring(0, qrData.length - 4) + '63' + '04' + crc;

      console.log('✅ Generated QR string:', qrData.substring(0, 50) + '...');
      return qrData;

    } catch (error) {
      console.error('❌ Error generating PromptPay QR:', error);
      throw new Error('Failed to generate PromptPay QR');
    }
  }

  static async generateQRCodeImage(qrString: string): Promise<string> {
    try {
      const qrCodeDataURL = await QRCode.toDataURL(qrString, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      console.log('✅ Generated QR Code image');
      return qrCodeDataURL;

    } catch (error) {
      console.error('❌ Error generating QR Code image:', error);
      throw new Error('Failed to generate QR Code image');
    }
  }

  private static calculateCRC16(data: string): string {
    const polynomial = 0x1021;
    let crc = 0xFFFF;

    for (let i = 0; i < data.length; i++) {
      crc ^= (data.charCodeAt(i) << 8);

      for (let j = 0; j < 8; j++) {
        if (crc & 0x8000) {
          crc = (crc << 1) ^ polynomial;
        } else {
          crc = crc << 1;
        }
        crc &= 0xFFFF;
      }
    }

    return crc.toString(16).toUpperCase().padStart(4, '0');
  }

  static formatPhoneNumber(phoneNumber: string): string {
    // Clean and format phone number
    let cleaned = phoneNumber.replace(/\D/g, '');

    if (cleaned.startsWith('0')) {
      cleaned = '66' + cleaned.substring(1);
    } else if (!cleaned.startsWith('66')) {
      cleaned = '66' + cleaned;
    }

    return cleaned;
  }

  static validateAmount(amount: number): boolean {
    return amount > 0 && amount <= 1000000;
  }

  static generateExpectedAmount(originalAmount: number): { expectedAmount: number; randomCents: number } {
    const randomCents = this.generateRandomCents();
    const expectedAmount = originalAmount + (randomCents / 100);

    return {
      expectedAmount: parseFloat(expectedAmount.toFixed(2)),
      randomCents
    };
  }
}