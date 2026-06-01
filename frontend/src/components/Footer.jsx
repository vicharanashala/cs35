import { Link } from 'react-router-dom'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-sand-100 border-t border-sand-200 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

          {/* Logo & tagline */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brown-500 rounded-lg flex items-center justify-center text-sand-50 font-bold text-xs">
              AS
            </div>
            <span className="text-sm font-semibold text-charcoal-700">AskSam</span>
            <span className="text-charcoal-400 text-sm">— Crowdsourced FAQ Portal</span>
          </div>

          {/* Links */}
          <nav className="flex items-center gap-6 text-sm text-charcoal-500">
            <Link to="/" className="hover:text-brown-600 transition-colors">
              Home
            </Link>
            <Link to="/ask" className="hover:text-brown-600 transition-colors">
              Ask a Question
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brown-600 transition-colors"
            >
              GitHub
            </a>
          </nav>

          {/* Copyright */}
          <p className="text-xs text-charcoal-400">
            &copy; {currentYear} AskSam. Built for students, by students.
          </p>
        </div>
      </div>
    </footer>
  )
}