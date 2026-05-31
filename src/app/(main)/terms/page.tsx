export default function TermsPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="rounded-2xl border bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">
          Terms of Service
        </h1>

        <p className="mt-4 text-slate-600 leading-7">
          By using Textbook Marketplace, you agree to these Terms of Service.
        </p>

        <p className="mt-4 text-slate-600 leading-7">
          Users are responsible for the accuracy of their listings, messages,
          and account information.
        </p>

        <p className="mt-4 text-slate-600 leading-7">
          Textbook Marketplace is a platform that connects buyers, sellers,
          and renters. We are not responsible for disputes, damages, or losses
          resulting from transactions between users.
        </p>

        <p className="mt-4 text-slate-600 leading-7">
          We reserve the right to suspend or terminate accounts that violate
          our policies or misuse the platform.
        </p>

        <p className="mt-4 text-slate-600 leading-7">
          Continued use of the platform constitutes acceptance of these terms.
        </p>
      </div>
    </main>
  );
}