import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto max-w-4xl py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-headline">Terms of Service</CardTitle>
        </CardHeader>
        <CardContent className="prose max-w-none dark:prose-invert">
           <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

          <p>
            Please read these Terms of Service carefully before using the Dove Neb website. Your access to and use of the Service is conditioned on your acceptance of and compliance with these Terms. These Terms apply to all visitors, users, and others who access or use the Service.
          </p>

          <h2 className="text-2xl font-semibold mt-6 mb-2">1. Accounts</h2>
          <p>
            When you create an account with us, you must provide us with information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
          </p>

          <h2 className="text-2xl font-semibold mt-6 mb-2">2. User Content</h2>
          <p>
            Our Service allows you to post, link, store, share and otherwise make available certain information, text, graphics, videos, or other material ("Content"). You are responsible for the Content that you post to the Service, including its legality, reliability, and appropriateness. You agree that you will only post content that is legal and does not violate any applicable laws. By posting Content to the Service, you grant us the right and license to use, modify, publicly perform, publicly display, reproduce, and distribute such Content on and through the Service.
          </p>

          <h2 className="text-2xl font-semibold mt-6 mb-2">3. Job Application Safety & Anti-Scam Policy</h2>
          <p>
            Dove Neb is committed to providing a safe environment for job seekers. <strong>Users must not pay any money to employers, recruiters, or any other party for job opportunities listed on this platform.</strong> Legitimate employers do not ask for application fees, processing fees, equipment deposits, or any form of payment during the hiring process.
          </p>
          <p>
            If you encounter any employer or recruiter requesting payment, you must:
          </p>
          <ul>
            <li>Immediately decline the request.</li>
            <li>Stop all communication with the party.</li>
            <li>Report the listing to our support team for investigation.</li>
          </ul>
          <p>
            Dove Neb reserves the right to terminate the accounts of any user found to be posting fraudulent job listings or attempting to exploit job seekers.
          </p>

          <h2 className="text-2xl font-semibold mt-6 mb-2">4. Prohibited Activities</h2>
          <p>
            You may not access or use the Site for any purpose other than that for which we make the Site available. The Site may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us.
          </p>

          <h2 className="text-2xl font-semibold mt-6 mb-2">5. Limitation of Liability</h2>
          <p>
            Dove Neb acts solely as a platform to connect users for the purpose of finding jobs and lodging. We are not a party to any agreements or financial transactions entered into between users. As such, Dove Neb is not responsible for any disputes, damages, or liabilities that may arise from interactions or transactions between users, including any losses resulting from unauthorized payments made to third parties.
          </p>
          
          <h2 className="text-2xl font-semibold mt-6 mb-2">6. Termination</h2>
          <p>
            We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
          </p>

          <h2 className="text-2xl font-semibold mt-6 mb-2">Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact our <Link href="/support">support team</Link>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
