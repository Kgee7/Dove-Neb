
export type Currency = {
  name: string;
  code: string;
  symbol: string;
};

export const currencies: Currency[] = [
  { name: 'United States Dollar', code: 'USD', symbol: '$' },
  { name: 'Euro', code: 'EUR', symbol: '€' },
  { name: 'Japanese Yen', code: 'JPY', symbol: '¥' },
  { name: 'British Pound', code: 'GBP', symbol: '£' },
  { name: 'Australian Dollar', code: 'AUD', symbol: '$' },
  { name: 'Canadian Dollar', code: 'CAD', symbol: '$' },
  { name: 'Swiss Franc', code: 'CHF', symbol: 'CHF' },
  { name: 'Chinese Yuan', code: 'CNY', symbol: '¥' },
  { name: 'Indian Rupee', code: 'INR', symbol: '₹' },
  { name: 'Brazilian Real', code: 'BRL', symbol: 'R$' },
  { name: 'Russian Ruble', code: 'RUB', symbol: '₽' },
  { name: 'South African Rand', code: 'ZAR', symbol: 'R' },
  { name: 'Nigerian Naira', code: 'NGN', symbol: '₦' },
  { name: 'Kenyan Shilling', code: 'KES', symbol: 'KSh' },
  { name: 'Ghanaian Cedi', code: 'GHS', symbol: 'GH₵' },
];
