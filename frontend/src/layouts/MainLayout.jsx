import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";

const NAV_LINKS = [
  { to: "/",           label: "Home" },
  { to: "/faqs",       label: "FAQs" },
  { to: "/queue",      label: "Queue" },
  { to: "/ask",        label: "Ask Question" },
];

export default function MainLayout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch]     = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  const userName = localStorage.getItem("userName") || "Student";
  const userRole = localStorage.getItem("userRole") || "student";

  const isActive = (p) => (p === "/" ? location.pathname === "/" : location.pathname.startsWith(p));

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) window.location.href = `/faqs?q=${encodeURIComponent(search.trim())}`;
  };

  const handleLogout = () => {
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F5F7F2" }}>
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-white border-b" style={{ borderColor: "#E2E8DE" }}>
        <div className="container-xl h-14 flex items-center gap-4 relative">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0 group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
              style={{ background: "#5E7A5A" }}>
              AS
            </div>
            <span className="text-base font-bold" style={{ color: "#1F2937" }}>AskSam</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-0.5 ml-2" aria-label="Main">
            {NAV_LINKS.map(({ to, label }) => (
              <Link key={to} to={to}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  isActive(to)
                    ? "font-semibold"
                    : "hover:bg-opacity-60"
                }`}
                style={isActive(to)
                  ? { color: "#5E7A5A", background: "#f0f4ef" }
                  : { color: "#6B7280" }}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xs hidden lg:block ml-2">
            <div className="search-wrap">
              <svg className="search-icon w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                className="search-input text-sm py-2"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search FAQs..."
              />
            </div>
          </form>

          <div className="flex-1 hidden lg:block" />

          {/* Admin link */}
          {userRole === "admin" && (
            <Link to="/admin" className="hidden md:inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md transition-colors"
              style={isActive("/admin") ? { color: "#5E7A5A", background: "#f0f4ef" } : { color: "#6B7280" }}>
              Admin
            </Link>
          )}

          {/* Avatar & Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 transition-transform hover:scale-105"
              style={{ background: "#5E7A5A" }}
            >
              {userName.charAt(0).toUpperCase()}
            </button>
            
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border py-1 z-50 animate-fade-in" style={{ borderColor: "#E2E8DE" }}>
                <div className="px-4 py-2 border-b mb-1" style={{ borderColor: "#F5F7F2" }}>
                  <p className="text-sm font-semibold truncate" style={{ color: "#1F2937" }}>{userName}</p>
                  <p className="text-xs" style={{ color: "#9CA3AF" }}>{userRole === "admin" ? "Admin" : "Student"}</p>
                </div>
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-1.5 rounded-md transition-colors"
            style={{ color: "#6B7280" }}
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t px-4 py-3 space-y-1 bg-white animate-fade-in" style={{ borderColor: "#E2E8DE" }}>
            {NAV_LINKS.map(({ to, label }) => (
              <Link key={to} to={to} onClick={() => setMenuOpen(false)}
                className="block px-3 py-2 text-sm font-medium rounded-md transition-colors"
                style={isActive(to) ? { color: "#5E7A5A", background: "#f0f4ef" } : { color: "#6B7280" }}>
                {label}
              </Link>
            ))}
            {userRole === "admin" && (
              <Link to="/admin" onClick={() => setMenuOpen(false)}
                className="block px-3 py-2 text-sm font-medium rounded-md"
                style={isActive("/admin") ? { color: "#5E7A5A", background: "#f0f4ef" } : { color: "#6B7280" }}>
                Admin
              </Link>
            )}
            <button onClick={handleLogout} className="w-full text-left block px-3 py-2 text-sm font-medium rounded-md text-red-600">
              Sign Out
            </button>
            <form onSubmit={handleSearch} className="pt-2">
              <div className="search-wrap">
                <svg className="search-icon w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input className="search-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search FAQs..." />
              </div>
            </form>
          </div>
        )}
      </header>

      {/* ── Content ── */}
      <main className="flex-1" onClick={() => setDropdownOpen(false)}>
        <div key={location.pathname} className="animate-fade-in">
          {children}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t py-5 mt-auto" style={{ borderColor: "#E2E8DE", background: "#ffffff" }}>
        <div className="container-xl flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-sm font-semibold" style={{ color: "#5E7A5A" }}>AskSam</span>
          <span className="text-xs" style={{ color: "#9CA3AF" }}>
            Community knowledge platform for Samagama interns · {new Date().getFullYear()}
          </span>
        </div>
      </footer>
    </div>
  );
}