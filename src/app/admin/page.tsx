import Link from "next/link";

const sections = [
  {
    title: "Academic Data",
    items: [
      {
        title: "Universities",
        description: "Manage university records and academic institutions.",
        href: "/admin/universities",
      },
      {
        title: "Departments",
        description: "Manage academic departments.",
        href: "/admin/departments",
      },
      {
        title: "Professors",
        description: "Add, edit, and review professor data.",
        href: "/admin/professors",
      },
      {
        title: "Courses",
        description: "Manage course records connected to professors.",
        href: "/admin/courses",
      },
      {
        title: "Books",
        description: "Manage textbook records.",
        href: "/admin/books",
      },
      {
        title: "Academic Book Links",
        description:
          "Connect books to professors, courses, semesters, and required status.",
        href: "/admin/academic-book-links",
      },
      {
        title: "Suggestions",
        description: "Review student-submitted academic suggestions.",
        href: "/admin/suggestions",
      },
    ],
  },

  {
    title: "Marketplace",
    items: [
      {
        title: "Listings",
        description: "Manage marketplace listings.",
        href: "/admin/listings",
      },
      {
        title: "Transactions",
        description:
          "Review payments, rentals, buyers, sellers, and status updates.",
        href: "/admin/transactions",
      },
      {
        title: "Disputes",
        description:
          "Review disputes, evidence files, deposits, and resolutions.",
        href: "/admin/disputes",
      },
      {
        title: "Reviews",
        description: "Review ratings and user feedback.",
        href: "/admin/reviews",
      },
      {
        title: "Messages",
        description: "Review marketplace conversations and messages.",
        href: "/admin/messages",
      },
      {
        title: "Notifications",
        description: "Review platform notifications.",
        href: "/admin/notifications",
      },
    ],
  },

    {
  title: "System",
  items: [
    {
      title: "Users",
      description: "Manage registered users and account status.",
      href: "/admin/users",
    },
        {
      title: "Excel Imports",
      description: "Upload academic data from Excel files.",
      href: "/admin/imports",
    },
  ],
},
];

export default function AdminDashboardPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
            Admin Panel
          </p>

          <h1 className="mt-2 text-4xl font-bold text-gray-900">
            Textbook Rescue Admin Dashboard
          </h1>

          <p className="mt-3 text-gray-600">
            Manage academic data, marketplace activity, users, transactions,
            disputes, reviews, and system imports.
          </p>
        </div>

        {sections.map((section) => (
          <div key={section.title} className="mb-12">
            <h2 className="mb-5 text-2xl font-bold text-gray-900">
              {section.title}
            </h2>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-md"
                >
                  <h3 className="text-lg font-bold text-gray-900">
                    {item.title}
                  </h3>

                  <p className="mt-3 min-h-[60px] text-sm text-gray-600">
                    {item.description}
                  </p>

                  <div className="mt-4 text-sm font-semibold text-blue-600">
                    Open →
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}