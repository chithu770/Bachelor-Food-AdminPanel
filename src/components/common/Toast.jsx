import { CheckCircle2, XCircle } from "lucide-react";

export default function Toast({ message, type = "success", onClose }) {
  if (!message) return null;
  const isError = type === "error";

  return (
    <div className="fixed right-5 top-5 z-50 flex max-w-sm items-start gap-3 rounded-md border border-slate-200 bg-white px-4 py-3 shadow-soft">
      {isError ? <XCircle className="mt-0.5 h-5 w-5 text-ember" /> : <CheckCircle2 className="mt-0.5 h-5 w-5 text-leaf" />}
      <p className="flex-1 text-sm font-medium text-slate-800">{message}</p>
      <button className="text-sm text-slate-400 hover:text-slate-700" onClick={onClose} type="button">
        Close
      </button>
    </div>
  );
}
