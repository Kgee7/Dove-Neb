
export type Job = {
  id: string;
  title: string;
  companyName: string;
  country: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship' | 'Remote' | 'Hybrid';
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
