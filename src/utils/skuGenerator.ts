const STOP_WORDS = new Set(['EL', 'LA', 'LOS', 'LAS', 'DE', 'DEL', 'Y', 'CON', 'PARA', 'EN', 'UN', 'UNA', 'UNOS', 'UNAS']);

const processText = (text: string): string[] => {
  if (!text) return [];

  // Remove accents
  let cleanText = text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  // Replace ñ
  cleanText = cleanText.replace(/ñ/gi, 'n');
  
  // Replace hyphens with empty string so things like "ENDER-3" become "ENDER3"
  cleanText = cleanText.replace(/-/g, '');
  
  // Replace other special characters with spaces
  cleanText = cleanText.replace(/[^a-zA-Z0-9\s]/g, ' ');
  
  // Split by space
  const words = cleanText.split(/\s+/).filter(Boolean);

  return words
    .map(w => w.toUpperCase())
    .filter(w => !STOP_WORDS.has(w))
    .map(w => {
      // If the original word is short, keep it as is (e.g. 3D, S1, USA)
      if (w.length <= 3) return w;
      
      // Smart abbreviation: first 3 letters + any numbers in the word
      const lettersMatch = w.match(/[A-Z]/g);
      const numbersMatch = w.match(/\d/g);
      
      const firstLetters = lettersMatch ? lettersMatch.slice(0, 3).join('') : '';
      const numbers = numbersMatch ? numbersMatch.join('') : '';
      
      return firstLetters + numbers;
    });
};

export const generateSku = (productName: string, variantName?: string): string => {
  const pTokens = processText(productName);
  const vTokens = variantName ? processText(variantName) : [];
  
  return [...pTokens, ...vTokens].join('-');
};
