export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">Diaspora Direct Pay</h1>
      <p className="max-w-prose text-stone-600">
        A scaffold for paying school fees, utilities, and other bills directly for family in
        Kenya. UI, auth, and payment integrations are not yet wired up.
      </p>
    </main>
  );
}
