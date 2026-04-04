
export type Job = {
  id: string;
  title: string;
  companyName: string;
  country: string;
  location: string;
  type: "Full-time" | "Part-time" | "Contract" | "Internship" | "Remote" | "Hybrid";
  positionsAvailable: number;
  description: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryPeriod: 'month' | 'hour';
  salaryCurrency: string;
  salaryCurrencySymbol: string;
  salaryNegotiable?: boolean;
  applicationMethod: 'email' | 'whatsapp';
  applicationEmail?: string | null;
  applicationWhatsapp?: string | null;
  listingStartDate: string;
  listingEndDate: string;
  employerId: string;
  status: 'active' | 'archived' | 'pending_removal';
  createdAt: any;
  lastApplicantAt?: any;
  removalDate?: any;
};

/**
 * Formats a numeric salary amount into a readable string.
 * Values >= 1000 are converted to "k" format (e.g., 70000 -> 70k, 1500 -> 1.5k).
 * Values < 1000 are shown as full numbers with commas (e.g., 900 -> 900).
 */
export function formatSalaryAmount(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) return '';
  
  if (amount >= 1000) {
    const formatted = (amount / 1000).toLocaleString(undefined, {
      maximumFractionDigits: 1,
    });
    return formatted + 'k';
  }
  
  return amount.toLocaleString();
}
