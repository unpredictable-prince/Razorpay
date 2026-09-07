/**
 * Formats ISO or UTC date strings into human-readable India Standard Time (IST - Asia/Kolkata / Delhi).
 */
export const formatISTDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  let s = String(dateString).trim();

  if (!s.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(s)) {
    s = s.replace(' ', 'T') + 'Z';
  }

  const date = new Date(s);
  if (isNaN(date.getTime())) return dateString;

  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

export const formatISTTimeOnly = (dateString) => {
  if (!dateString) return 'N/A';
  let s = String(dateString).trim();

  if (!s.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(s)) {
    s = s.replace(' ', 'T') + 'Z';
  }

  const date = new Date(s);
  if (isNaN(date.getTime())) return dateString;

  return date.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
};

export const formatISTDate = formatISTDateTime;
