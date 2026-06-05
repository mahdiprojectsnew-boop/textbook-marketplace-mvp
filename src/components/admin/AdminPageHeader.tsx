import Link from "next/link";

export function AdminPageHeader({
  title,
  description,
  section,
}: {
  title: string;
  description?: string;
  section?: string;
}) {
  return (
    <div className="mb-8">
      <Link
        href="/admin"
        className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 mb-5"
      >
        ← Back to Admin
      </Link>

      {section && (
        <div className="text-xs font-bold uppercase tracking-wide text-blue-600 mb-2">
          ADMIN / {section}
        </div>
      )}

      <h1 className="text-3xl font-bold text-slate-900">{title}</h1>

      {description && (
        <p className="mt-2 text-sm text-slate-500">{description}</p>
      )}
    </div>
  );
}