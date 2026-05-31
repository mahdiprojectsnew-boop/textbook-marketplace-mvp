// Login and signup pages manage their own full-screen layout.
// This layout just passes children through.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
