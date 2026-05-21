/**
 * Generates a unique Order ID for Kefas Food orders
 * Format: KF-YYYYMMDD-XXXXXX
 * Where:
 * - KF = Kefas Food prefix
 * - YYYYMMDD = Current date
 * - XXXXXX = Random alphanumeric string (6 characters)
 */
export function generateOrderId(): string {
  const now = new Date();
  
  // Format date as YYYYMMDD
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateString = `${year}${month}${day}`;
  
  // Generate random alphanumeric string (6 characters)
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomString = '';
  for (let i = 0; i < 6; i++) {
    randomString += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  // Combine all parts
  return `KF-${dateString}-${randomString}`;
}

/**
 * Formats order timestamp for display
 */
export function formatOrderTimestamp(): string {
  const now = new Date();
  
  // Format as: "23 Mar 2026, 14:30"
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  };
  
  return now.toLocaleString('en-GB', options);
}
