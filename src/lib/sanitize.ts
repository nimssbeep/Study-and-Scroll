import DOMPurify from 'dompurify';

export function cleanInput(input: string, maxLength = 500): string {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
    .trim()
    .slice(0, maxLength);
}

export function validateEducationalFile(file: File, maxMb = 10): string | null {
  const allowedExtensions = ['.pdf', '.txt', '.md'];
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    return 'Only strictly educational .pdf, .txt, or .md files are allowed.';
  }
  if (file.size > maxMb * 1024 * 1024) {
    return `File size exceeds the ${maxMb} MB security limit.`;
  }
  return null;
}
