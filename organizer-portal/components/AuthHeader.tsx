export function AuthHeader() {
  return (
    <div className="flex items-center gap-2 justify-center mb-8">
      <div className="w-10 h-10 bg-primary rounded flex items-center justify-center">
        <span className="material-symbols-outlined text-on-primary text-[22px]">cloud</span>
      </div>
      <div className="text-left">
        <h1 className="text-lg font-semibold text-primary leading-tight">Organizer Console</h1>
        <p className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">
          Enterprise Management
        </p>
      </div>
    </div>
  );
}
