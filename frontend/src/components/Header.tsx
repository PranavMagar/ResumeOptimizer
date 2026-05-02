/**
 * Header component — app name and tagline.
 * Shared across Upload and Results pages.
 */
export function Header() {
  return (
    <header className="header">
      <h1 className="header__title">AI Resume Optimizer</h1>
      <p className="header__tagline">
        Upload your resume and get an ATS score, actionable suggestions, and
        AI-rewritten content in seconds.
      </p>
    </header>
  );
}
