import Link from "next/link";
import { TopNav } from "@/components/shared/TopNav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      <TopNav />

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="font-semibold text-slate-900">
                Textbook Marketplace
              </h3>
              <p className="text-sm text-slate-500">
                Buy, sell, and rent textbooks with students across the United States.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-slate-600">
              <Link href="/about" className="hover:text-slate-900">
                About
              </Link>

              <Link href="/contact" className="hover:text-slate-900">
                Contact
              </Link>

              <Link href="/privacy" className="hover:text-slate-900">
                Privacy Policy
              </Link>

              <Link href="/terms" className="hover:text-slate-900">
                Terms of Service
              </Link>
            </div>
          </div>

          <div className="mt-6 border-t pt-4 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} Textbook Marketplace. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}