export default function LoadingSpinner({ label = "Loading" }) {
  return (
    <div className="grid min-h-[240px] place-items-center text-slate-600">
      <div className="flex items-center gap-3">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-ember" />
        <span className="text-sm font-medium">{label}</span>
      </div>
    </div>
  );
}
