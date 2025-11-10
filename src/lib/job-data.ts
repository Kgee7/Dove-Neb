export type Job = {
  id: string;
  title: string;
  companyName: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship' | 'Remote' | 'Hybrid';
  description: string;
  salaryMin?: number;
  salaryMax?: number;
  applicationMethod: 'in-app' | 'email';
  applicationEmail?: string;
  employerId: string;
};

export type JobApplicant = {
  id: string;
  seekerId: string;
  seekerName: string;
  seekerEmail: string;
  resumeURL?: string;
  photoURL?: string;
  status: 'pending' | 'reviewed' | 'rejected' | 'hired';
  appliedAt: {
    toDate: () => Date;
  };
};
