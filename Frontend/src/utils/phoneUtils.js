/**
 * Formats a phone number into an international Sri Lankan number suitable for WhatsApp wa.me links
 * e.g., "078 866 8851" -> "94788668851"
 */
export function formatWhatsAppNumber(phone) {
  if (!phone) return '';
  // Remove all non-digit characters except leading plus if any
  let digits = phone.replace(/\D/g, '');

  // If local format starting with 0 (e.g. 0771234567), replace leading 0 with 94
  if (digits.startsWith('0')) {
    digits = '94' + digits.substring(1);
  } else if (!digits.startsWith('94') && digits.length === 9) {
    digits = '94' + digits;
  }

  return digits;
}

/**
 * Builds a direct click-to-chat WhatsApp URL with a pre-filled inquiry message
 */
export function getWhatsAppUrl(phone, title, price, isNegotiable) {
  const formattedNumber = formatWhatsAppNumber(phone);
  if (!formattedNumber) return '#';

  const priceText = price && price > 0
    ? `LKR ${Number(price).toLocaleString()}${isNegotiable ? ' (Negotiable)' : ''}`
    : 'Negotiable';

  const message = `Hi, I'm interested in your listing: "${title || 'Property'}" (Price: ${priceText}) listed on Sasrika.`;
  return `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`;
}

/**
 * Formats a phone number for clean human readability
 * e.g., "0788668851" -> "+94 78 866 8851"
 */
export function formatDisplayPhone(phone) {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0') && digits.length === 10) {
    return `+94 ${digits.substring(1, 3)} ${digits.substring(3, 6)} ${digits.substring(6)}`;
  }
  if (digits.startsWith('94') && digits.length === 11) {
    return `+94 ${digits.substring(2, 4)} ${digits.substring(4, 7)} ${digits.substring(7)}`;
  }
  return phone;
}
