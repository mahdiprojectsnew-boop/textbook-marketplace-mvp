export default function AboutPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="rounded-2xl border bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">
          About Textbook Marketplace
        </h1>

        <p className="mt-4 text-slate-600 leading-7">
          Textbook Marketplace helps students buy, sell, and rent textbooks
          more easily by connecting books with universities, professors, and
          courses.
        </p>

        <p className="mt-4 text-slate-600 leading-7">
          Instead of searching only by book title, students can find textbooks
          based on the classes they are taking, the professors teaching those
          classes, and the schools they attend.
        </p>

        <p className="mt-4 text-slate-600 leading-7">
          Our goal is to make textbooks more affordable, reduce waste, and help
          students connect with other students in a trusted academic marketplace.
        </p>
      </div>
    </main>
  );
}