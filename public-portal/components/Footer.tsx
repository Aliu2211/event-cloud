export function Footer() {
  return (
    <footer className="mt-auto bg-primary text-white/80">
      <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <p className="text-white font-semibold">EventCloud</p>
          <p className="text-xs text-white/50">© 2026 EventCloud. All rights reserved.</p>
        </div>
        <div className="flex gap-6 text-xs text-white/60">
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
          <span>Contact Support</span>
        </div>
      </div>
    </footer>
  );
}
