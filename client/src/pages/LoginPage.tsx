export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">
          Video Learning Platform
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Login will be connected in the next auth commit.
        </p>

        <form className="mt-8 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              type="email"
              placeholder="admin@example.com"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
              disabled
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-indigo-500"
              disabled
            />
          </div>
          <button
            type="button"
            disabled
            className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white opacity-60"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
