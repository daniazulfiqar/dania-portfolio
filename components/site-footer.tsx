export function SiteFooter() {
  return (
    <footer className="w-full px-6 py-10 sm:px-10">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-1 text-center">
        <p className="font-script text-xl text-wax">
          thanks for stopping by —
        </p>
        <p className="font-body text-sm text-ink-soft">
          dania siddiqui · {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
