// Updated job-data.ts to restore the formatSalaryAmount function and modify Job type

export type Job = {
    id: number;
    title: string;
    company: string;
    salary: number;
    locations: string[];
    positionsAvailable?: number;
};

export type JobApplicant = {
    id: number;
    name: string;
    appliedJobs: Job[];
};

/**
 * Formats the salary amount according to the specified rules.
 * @param amount - The salary amount to format.
 * @returns The formatted salary string.
 */
export function formatSalaryAmount(amount: number): string {
    if (amount < 1000) {
        return amount.toLocaleString();
    } else if (amount >= 1000000) {
        return (amount / 1000000).toFixed(1) + 'M';
    } else {
        return (amount / 1000).toFixed(1) + 'k';
    }
}
