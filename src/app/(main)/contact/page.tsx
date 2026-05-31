export default function ContactPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="rounded-2xl border bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">
          Contact Us
        </h1>

        <p className="mt-4 text-slate-600 leading-7">
          We'd love to hear from you.
        </p>

        <p className="mt-4 text-slate-600 leading-7">
          If you have questions, feedback, suggestions, or need assistance,
          please contact us using the information below.
        </p>

        <div className="mt-8 space-y-4">
          <div>
            <h2 className="font-semibold text-slate-900">Email</h2>
            <p className="text-slate-600">
              support@textbookmarketplace.com
            </p>
          </div>

          <div>
            <h2 className="font-semibold text-slate-900">Response Time</h2>
            <p className="text-slate-600">
              We typically respond within 1–2 business days.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}