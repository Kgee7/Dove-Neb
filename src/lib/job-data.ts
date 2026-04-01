export type Job = {
  id: string;
  title: string;
  companyName: string;
  country: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship' | 'Remote' | 'Hybrid';
  positionsAvailable?: number;
  description: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryCurrencySymbol?: string;
  salaryPeriod?: 'month' | 'hour';
  applicationMethod: 'email' | 'whatsapp';
  applicationEmail?: string;
  applicationWhatsapp?: string;
  employerId: string;
  listingStartDate: string;
  listingEndDate: string;
  status: 'active' | 'pending_removal' | 'archived';
  removalDate?: any;
  createdAt: any;
};

export type JobApplicant = {
  id: string;
  seekerId: string;
  seekerName: string;
  seekerEmail: string;
  resumeURL?: string;
  photoURL?: string;
  status: 'pending' | 'reviewed' | 'rejected' | 'hired';
  userApplicationId?: string;
  appliedAt: {
    toDate: () => Date;
  };
};

/**
 * Formats a salary amount based on user requirements.
 * Below 1000: Full number.
 * 1000 and above: 'k' format (e.g. 1k, 1.1k).
 * 1,000,000 and above: 'M' format.
 */
export function formatSalaryAmount(amount: number): string {
  if (amount < 1000) return amount.toLocaleString();
  
  if (amount >= 1000000) {
    const millions = amount / 1000000;
    return millions % 1 === 0 ? `${millions}M` : `${millions.toFixed(1)}M`;
  }
  
  const kilos = amount / 1000;
  return kilos % 1 === 0 ? `${kilos}k` : `${kilos.toFixed(1)}k`;
}

}

