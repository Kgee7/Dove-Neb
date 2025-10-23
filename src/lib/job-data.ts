export type Job = {
  id: string;
  title: string;
  companyName: string;
  location: string;
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  description: string;
  salaryMin?: number;
  salaryMax?: number;
  employerId: string;
};
