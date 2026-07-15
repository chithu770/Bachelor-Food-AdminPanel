import { ChefHat } from "lucide-react";

export default function AuthWrapper({ title, subtitle, children }) {
  return (
    <div className="grid min-h-screen bg-slate-950 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden lg:block">
        <img
          alt="Fresh plated Indian meal"
          className="absolute inset-0 h-full w-full object-cover"
          src="https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1600&q=85"
        />
        <div className="absolute inset-0 bg-slate-950/55" />
        <div className="relative flex h-full flex-col justify-end p-12 text-white">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-md bg-white/15 backdrop-blur">
            <ChefHat className="h-8 w-8" />
          </div>
          <h1 className="max-w-xl text-5xl font-black leading-tight">Bachelor Foods</h1>
          <p className="mt-4 max-w-lg text-lg leading-8 text-white/82">Manage meals, kitchen partners, and daily orders from one fast Firebase-backed dashboard.</p>
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md rounded-md bg-white p-7 shadow-soft sm:p-8">
          <div className="mb-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-ember text-white lg:hidden">
              <ChefHat className="h-7 w-7" />
            </div>
            <h2 className="text-3xl font-bold text-slate-950">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{subtitle}</p>
          </div>
          {children}
        </div>
      </section>
    </div>
  );
}
