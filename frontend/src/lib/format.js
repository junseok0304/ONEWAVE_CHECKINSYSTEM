export const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '-';

  // 숫자만 추출
  const digits = phoneNumber.replace(/\D/g, '');

  // 11자리: XXX-XXXX-XXXX (010-1234-1234)
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }

  // 10자리: XXX-XXX-XXXX
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  // 그 외: 원본 반환
  return phoneNumber;
};
