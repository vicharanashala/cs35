import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { userApi, faqApi } from "../services/api";
import { useDebounce } from "../hooks/useDebounce";

const NAV_LINKS = [
  { to: "/",           label: "Home" },
  { to: "/faqs",       label: "FAQs" },
  { to: "/queue",      label: "Queue" },
  { to: "/ask",        label: "Ask Question" },
];

export default function MainLayout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [search, setSearch]     = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  const userName = user?.name || "Student";
  const userRole = user?.role || "student";
  const isAdmin = userRole === "admin";

  // Fetch profile data for stats
  const { data: profileData } = useQuery({
    queryKey: ['user-profile'],
    queryFn: userApi.me,
    enabled: isAuthenticated,
    staleTime: 30000,
  });

  const username = profileData?.user?.username || user?.email || "";
  const joinDate = profileData?.user?.createdAt
    ? new Date(profileData.user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : null;
  const stats = profileData?.user
    ? {
        questions: profileData.user.questionsCount ?? 0,
        answers: profileData.user.answersCount ?? 0,
        verified: profileData.user.verifiedCount ?? 0,
      }
    : null;
  const hasActivity = stats && (stats.questions > 0 || stats.answers > 0 || stats.verified > 0);

  const isActive = (p) => (p === "/" ? location.pathname === "/" : location.pathname.startsWith(p));

  const debouncedSearch = useDebounce(search, 300);

  const { data: searchResults = [] } = useQuery({
    queryKey: ['faq-search', debouncedSearch],
    queryFn: () => faqApi.list({ search: debouncedSearch }),
    enabled: debouncedSearch.trim().length > 1,
    staleTime: 60000,
  });
  const resultsArray = Array.isArray(searchResults) ? searchResults : searchResults?.data || [];

  const handleSearch = (e) => {
    e.preventDefault();
    setShowDropdown(false);
    if (search.trim()) navigate(`/faqs?q=${encodeURIComponent(search.trim())}`);
  };

  const handleResultClick = (id) => {
    setSearch("");
    setShowDropdown(false);
    navigate(`/faq/${id}`);
  };

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setDropdownOpen(false);
    setShowDropdown(false);
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F5F7F2" }}>
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-white border-b" style={{ borderColor: "#E2E8DE" }}>
        <div className="container-xl h-14 flex items-center gap-4 relative">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0 group">
            <img src="/logo.png" alt="AskSam Logo" className="w-8 h-8 object-contain rounded-full shadow-sm" />
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
          <form onSubmit={handleSearch} ref={searchRef} className="flex-1 max-w-xs hidden lg:block ml-2 relative">
            <div className="search-wrap">
              <svg className="search-icon w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                className="search-input text-sm py-2 w-full"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Search FAQs — e.g. NOC, offer letter…"
              />
            </div>

            {/* Dropdown for search results */}
            {showDropdown && search.trim().length > 1 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-xl shadow-xl overflow-hidden z-50 animate-scale-in" style={{ borderColor: "#E2E8DE" }}>
                {resultsArray.length > 0 ? (
                  <ul className="max-h-72 overflow-y-auto py-1">
                    {resultsArray.slice(0, 5).map((faq) => (
                      <li key={faq._id} className="border-b border-gray-50 last:border-0">
                        <button
                          type="button"
                          onClick={() => handleResultClick(faq._id)}
                          className="w-full text-left px-4 py-2.5 hover:bg-[#f0f4ef] transition-colors focus:bg-[#f0f4ef] focus:outline-none"
                        >
                          <p className="text-sm font-semibold text-gray-800 line-clamp-1">{faq.question}</p>
                          <span className="text-xs font-medium text-gray-500 mt-0.5 line-clamp-1">{faq.category}</span>
                        </button>
                      </li>
                    ))}
                    {resultsArray.length > 5 && (
                      <li className="border-t border-gray-50 bg-gray-50">
                        <button type="submit" className="w-full text-center px-4 py-2 text-xs font-semibold hover:underline" style={{ color: "#5E7A5A" }}>
                          View all results
                        </button>
                      </li>
                    )}
                  </ul>
                ) : (
                  <div className="p-4 text-center text-sm text-gray-500">
                    No verified questions found.
                  </div>
                )}
              </div>
            )}
          </form>

          <div className="flex-1 hidden lg:block" />

          {/* Admin link */}
          {isAdmin && (
            <Link to="/admin" className="hidden md:inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-md transition-colors"
              style={isActive("/admin") ? { color: "#5E7A5A", background: "#f0f4ef" } : { color: "#6B7280" }}>
              Admin
            </Link>
          )}

          {/* ── Avatar & Profile Dropdown ── */}
          <div className="relative" ref={dropdownRef}>
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="relative w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 transition-all duration-200 hover:ring-2 hover:ring-brand-300/60 hover:ring-offset-2 hover:ring-offset-white focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2"
                  style={{ background: "#5E7A5A" }}
                  aria-expanded={dropdownOpen}
                  aria-label="Open profile menu"
                >
                  {userName.charAt(0).toUpperCase()}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white" style={{ background: "#34d399" }} aria-hidden="true" />
                </button>

                {dropdownOpen && (
                  <div
                    role="menu"
                    aria-label="Profile menu"
                    className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border overflow-hidden animate-scale-in z-50"
                    style={{ borderColor: "#E2E8DE", transformOrigin: "top right", animationDuration: "0.2s" }}
                  >
                    {/* ── Header Section ── */}
                    <div className="relative p-5 text-center bg-gradient-to-br from-[#f0f4ef] to-[#ffffff] border-b" style={{ borderColor: "#E2E8DE" }}>
                      <div className="relative inline-block mb-3">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-md ring-4 ring-white"
                             style={{ background: "#5E7A5A" }}>
                          {userName.charAt(0).toUpperCase()}
                        </div>
                        <span className="absolute bottom-1 right-0 w-4 h-4 rounded-full border-2 border-white bg-emerald-400"
                              title="Online" />
                      </div>
                      
                      <h3 className="text-base font-bold text-gray-900 leading-tight">{userName}</h3>
                      {username && <p className="text-sm text-gray-500 mt-0.5">@{username}</p>}
                      
                      <div className="flex items-center justify-center gap-2 mt-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                          isAdmin ? "bg-red-50 text-red-700" : "bg-[#dde8db] text-[#3a4f38]"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isAdmin ? "bg-red-500" : "bg-[#5E7A5A]"}`} />
                          {userRole}
                        </span>
                        {joinDate && (
                          <span className="text-xs text-gray-400 font-medium">Joined {joinDate}</span>
                        )}
                      </div>
                    </div>

                    {/* ── Stats Grid ── */}
                    <div className="px-5 py-4 border-b" style={{ borderColor: "#E2E8DE", background: "#fafafa" }}>
                      {!stats ? (
                        <div className="flex justify-between items-center px-4 animate-pulse">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="flex flex-col items-center gap-2">
                              <div className="w-6 h-6 bg-gray-200 rounded-full" />
                              <div className="w-12 h-3 bg-gray-200 rounded" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          <div className="flex flex-col items-center p-2 rounded-xl bg-white border border-gray-100 shadow-sm transition-transform hover:-translate-y-0.5">
                            <span className="text-lg font-bold text-gray-900">{stats.questions}</span>
                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wide mt-0.5">Questions</span>
                          </div>
                          <div className="flex flex-col items-center p-2 rounded-xl bg-white border border-gray-100 shadow-sm transition-transform hover:-translate-y-0.5">
                            <span className="text-lg font-bold text-gray-900">{stats.answers}</span>
                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wide mt-0.5">Answers</span>
                          </div>
                          <div className="flex flex-col items-center p-2 rounded-xl bg-white border border-gray-100 shadow-sm transition-transform hover:-translate-y-0.5">
                            <span className="text-lg font-bold text-emerald-600">{stats.verified}</span>
                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wide mt-0.5 text-center">Verified</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ── Quick Actions ── */}
                    <div className="p-2">
                      {isAdmin ? (
                        <Link
                          to="/admin"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors hover:bg-gray-50 group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center group-hover:bg-red-50 group-hover:text-red-600 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-gray-700 group-hover:text-red-700 transition-colors">Admin Dashboard</span>
                        </Link>
                      ) : (
                        <Link
                          to="/my-questions"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors hover:bg-gray-50 group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center group-hover:bg-[#f0f4ef] group-hover:text-[#5E7A5A] transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <span className="text-sm font-medium text-gray-700 group-hover:text-[#5E7A5A] transition-colors">My Questions</span>
                        </Link>
                      )}

                      <div className="my-1.5 border-t border-gray-100" />

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors hover:bg-red-50 group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center group-hover:bg-red-100 group-hover:text-red-600 transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-gray-700 group-hover:text-red-700 transition-colors">Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Link to="/login" className="btn-secondary text-sm">Sign In</Link>
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
            {isAdmin && (
              <Link to="/admin" onClick={() => setMenuOpen(false)}
                className="block px-3 py-2 text-sm font-medium rounded-md"
                style={isActive("/admin") ? { color: "#5E7A5A", background: "#f0f4ef" } : { color: "#6B7280" }}>
                Admin
              </Link>
            )}
            <button onClick={handleLogout} className="w-full text-left block px-3 py-2 text-sm font-medium rounded-md text-red-600">
              Logout
            </button>
            <form onSubmit={handleSearch} className="pt-2 relative">
              <div className="search-wrap">
                <svg className="search-icon w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  className="search-input text-sm py-2 w-full"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Search FAQs…"
                />
              </div>

              {/* Mobile Dropdown for search results */}
              {showDropdown && search.trim().length > 1 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border rounded-xl shadow-xl overflow-hidden z-50 animate-scale-in" style={{ borderColor: "#E2E8DE" }}>
                  {resultsArray.length > 0 ? (
                    <ul className="max-h-60 overflow-y-auto py-1">
                      {resultsArray.slice(0, 4).map((faq) => (
                        <li key={faq._id} className="border-b border-gray-50 last:border-0">
                          <button
                            type="button"
                            onClick={() => {
                              handleResultClick(faq._id);
                              setMenuOpen(false);
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-[#f0f4ef] transition-colors focus:bg-[#f0f4ef] focus:outline-none"
                          >
                            <p className="text-sm font-semibold text-gray-800 line-clamp-1">{faq.question}</p>
                          </button>
                        </li>
                      ))}
                      {resultsArray.length > 4 && (
                        <li className="border-t border-gray-50 bg-gray-50">
                          <button type="submit" className="w-full text-center px-4 py-2 text-xs font-semibold hover:underline" style={{ color: "#5E7A5A" }}>
                            View all results
                          </button>
                        </li>
                      )}
                    </ul>
                  ) : (
                    <div className="p-4 text-center text-sm text-gray-500">
                      No verified questions found.
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>
        )}
      </header>

      {/* ── Content ── */}
      <main className="flex-1">
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