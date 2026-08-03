function App() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <h1 className="text-2xl font-semibold tracking-tight">
          Expense Tracker
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Scaffold ready — features land via TDD after approval.
        </p>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-2">
        <section className="rounded-lg border border-dashed border-slate-300 bg-white p-6">
          <h2 className="text-lg font-medium">Add expense</h2>
          <p className="mt-2 text-sm text-slate-500">Form placeholder</p>
        </section>

        <section className="rounded-lg border border-dashed border-slate-300 bg-white p-6">
          <h2 className="text-lg font-medium">Summary by category</h2>
          <p className="mt-2 text-sm text-slate-500">
            Totals broken down by currency (placeholder)
          </p>
        </section>

        <section className="rounded-lg border border-dashed border-slate-300 bg-white p-6 lg:col-span-2">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-medium">Expenses</h2>
            <button
              type="button"
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
            >
              Manage categories
            </button>
          </div>
          <p className="mt-2 text-sm text-slate-500">
            List + filters placeholder · categories panel/slide-over later
          </p>
        </section>
      </div>
    </main>
  );
}

export default App;
