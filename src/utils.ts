export const maskCPF = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

export const maskPhone = (value: string) => {
  let r = value.replace(/\D/g, "");
  if (r.length > 10) {
    r = r.replace(/^(\d\d)(\d{5})(\d{4}).*/, "($1) $2-$3");
  } else if (r.length > 5) {
    r = r.replace(/^(\d\d)(\d{4})(\d{0,4}).*/, "($1) $2-$3");
  } else if (r.length > 2) {
    r = r.replace(/^(\d\d)(\d{0,5})/, "($1) $2");
  } else {
    r = r.replace(/^(\d*)/, "($1");
  }
  return r;
};

export const classNames = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

export const generateId = () => crypto.randomUUID();

export const parseDMS = (dmsStr: string): number | null => {
  if (!dmsStr) return null;
  const cleanStr = dmsStr.trim().replace(',', '.');
  
  // If it's already a decimal number, parse it directly
  if (/^-?\d+(\.\d+)?$/.test(cleanStr)) {
    const val = parseFloat(cleanStr);
    return isNaN(val) ? null : val;
  }

  // Normalize quotes and spaces
  // Replace smart quotes/various tick characters (like ’, ‘, ´, ` to ' and ”, “ to ")
  // Remove all spaces to simplify regex matching
  const normalized = cleanStr
    .replace(/[‘’´`]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, '');

  // Regex to match: degrees°[minutes'[seconds"]]direction
  // Allows optional minutes and seconds, and decimal numbers for all fields
  const dmsRegex = /^(\d+(?:\.\d+)?)°(?:(\d+(?:\.\d+)?)[’'])?(?:(\d+(?:\.\d+)?)[”"])?([NSEWOL])$/i;
  const match = normalized.match(dmsRegex);
  
  if (!match) return null;
  
  const degrees = parseFloat(match[1]);
  const minutes = match[2] ? parseFloat(match[2]) : 0;
  const seconds = match[3] ? parseFloat(match[3]) : 0;
  const direction = match[4].toUpperCase();
  
  let decimal = degrees + minutes / 60 + seconds / 3600;
  
  if (direction === 'S' || direction === 'W' || direction === 'O') {
    decimal = decimal * -1;
  }
  
  return decimal;
};

const particulasNome = [
  "de",
  "da",
  "do",
  "das",
  "dos",
  "e",
  "d'",
  "d’",
  "del",
  "della",
  "di",
  "van",
  "von",
  "der",
  "den",
  "ter",
  "la",
  "le"
];

export function formatEmployeeName(text: string): string {
  if (!text) return '';
  
  // Collapse duplicate spaces while preserving leading and trailing spaces
  const leadingSpaces = text.match(/^\s+/)?.[0] || '';
  const trailingSpaces = text.match(/\s+$/)?.[0] || '';
  const trimmed = text.trim();
  
  if (!trimmed) return text; // If only whitespace, keep it as is
  
  const collapsed = trimmed.replace(/\s+/g, ' ');
  const parts = collapsed.split(' ');
  
  const formattedParts = parts.map((part) => {
    if (part === '') return '';
    const lower = part.toLowerCase();
    
    // Check if it matches any particle exactly
    if (particulasNome.includes(lower)) {
      return lower;
    }
    
    // Check if it starts with d' or d’ (apostrophe particles)
    if (lower.startsWith("d'") || lower.startsWith("d’")) {
      const quoteChar = part.slice(1, 2);
      const rest = part.slice(2);
      if (rest) {
        return "d" + quoteChar + rest.charAt(0).toUpperCase() + rest.slice(1).toLowerCase();
      }
      return "d" + quoteChar;
    }
    
    // Capitalize first letter, lowercase the rest
    return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
  });
  
  return leadingSpaces + formattedParts.join(' ') + trailingSpaces;
}

