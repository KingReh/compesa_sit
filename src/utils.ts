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
  // Matches formats like 8°03'14"S or 34°52'52"W
  const match = dmsStr.match(/(\d+)°(\d+)'(\d+)"([NSEW])/i);
  if (!match) return null;
  
  const degrees = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const seconds = parseInt(match[3], 10);
  const direction = match[4].toUpperCase();

  let decimal = degrees + minutes / 60 + seconds / 3600;
  
  if (direction === 'S' || direction === 'W') {
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

