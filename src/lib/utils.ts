import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getCategoryClass = (cat: string) => {
  const normalized = cat.toLowerCase();
  if (normalized.includes('financ')) return 'tag-financing';
  if (normalized.includes('lifestyle')) return 'tag-lifestyle';
  if (normalized.includes('community')) return 'tag-community';
  if (normalized.includes('wellness')) return 'tag-wellness';
  if (normalized.includes('travel')) return 'tag-travel';
  if (normalized.includes('creativ')) return 'tag-creativity';
  if (normalized.includes('growth')) return 'tag-growth';
  return 'tag-lifestyle';
};
