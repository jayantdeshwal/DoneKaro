import { Link } from 'react-router-dom'

export default function DeleteAccount() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 sm:py-12">
      <article className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h1 className="mb-4 text-2xl font-bold">Delete Your DoneKaro Account</h1>

        <p className="mb-6 text-slate-700">
          You can request permanent deletion of your DoneKaro account and associated personal data at any time.
        </p>

        <h2 className="mb-2 text-xl font-semibold">How to Request Deletion</h2>
        <p className="mb-6 text-slate-700">
          Submit a request through the DoneKaro in-app Help Center using your registered 10-digit mobile number, or visit the{' '}
          <Link className="text-blue-700 underline" to="/privacy#account-deletion">
            account deletion section of our Privacy Policy
          </Link>.
        </p>

        <h2 className="mb-2 text-xl font-semibold">What Happens Next?</h2>
        <ul className="mb-6 list-disc space-y-2 pl-5 text-slate-700">
          <li>
            <strong>What we delete:</strong> After administrative verification, your profile, authentication credentials, mobile number binding, uploaded verification documents, and active sessions are permanently erased. Requests are processed within 48 to 72 hours.
          </li>
          <li>
            <strong>What we retain:</strong> Historical booking receipts may be anonymized and retained only for the duration required by applicable accounting, financial, and dispute-resolution laws.
          </li>
        </ul>

        <p className="mt-8 border-t border-slate-100 pt-4 text-sm text-slate-500">
          DoneKaro is developed by Jayant Deshwal.
        </p>
      </article>
    </main>
  )
}
