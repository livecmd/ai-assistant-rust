export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = (error) => reject(error);
  });
};

export const stripBase64Prefix = (base64: string): string => {
  return base64.replace(/^data:image\/[a-z]+;base64,/, '');
};

export const getMimeTypeFromBase64 = (base64: string): string => {
    const match = base64.match(/^data:(image\/[a-z]+);base64,/);
    return match ? match[1] : 'image/jpeg';
};

export const generateId = (): string => {
  // Robust fallback for ID generation
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch (e) {
      // Fallback if crypto.randomUUID fails (e.g. non-secure context)
    }
  }
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};