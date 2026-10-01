/**
 * Helper to convert number to Thai Baht text (บาทถ้วน)
 */
export function thaiBahtText(num: number | string): string {
  const number = parseFloat(String(num));
  if (isNaN(number) || number === 0) return 'ศูนย์บาทถ้วน';

  const digits = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const positions = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

  const convertGroup = (nStr: string): string => {
    let res = '';
    const len = nStr.length;
    for (let i = 0; i < len; i++) {
      const digit = parseInt(nStr.charAt(i), 10);
      const pos = len - i - 1;
      if (digit !== 0) {
        if (pos === 1 && digit === 1) {
          res += 'สิบ';
        } else if (pos === 1 && digit === 2) {
          res += 'ยี่สิบ';
        } else if (pos === 0 && digit === 1 && len > 1 && parseInt(nStr.slice(0, -1), 10) > 0) {
          res += 'เอ็ด';
        } else {
          res += digits[digit] + positions[pos];
        }
      }
    }
    return res;
  };

  const [intPart, decPart] = number.toFixed(2).split('.');
  let result = '';

  if (parseInt(intPart, 10) === 0) {
    result = '';
  } else if (intPart.length > 6) {
    const millionGroup = intPart.slice(0, -6);
    const lowerGroup = intPart.slice(-6);
    result = convertGroup(millionGroup) + 'ล้าน' + convertGroup(lowerGroup) + 'บาท';
  } else {
    result = convertGroup(intPart) + 'บาท';
  }

  const satang = parseInt(decPart, 10);
  if (satang === 0) {
    result += 'ถ้วน';
  } else {
    result += convertGroup(decPart) + 'สตางค์';
  }

  return result;
}
