import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { userApi } from "../services/api";
import { useQuery } from "@tanstack/react-query";

const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "Queue", to: "/queue" },
  { label: "Ask", to: "/ask" },
  { label: "Admin", to: "/admin", adminOnly: true },
];

export default function Navbar() {
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { data: profileData } = useQuery({
    queryKey: ['user-profile'],
    queryFn: userApi.me,
    enabled: isAuthenticated,
    staleTime: 30000,
  });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);



  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape" && isMenuOpen) {
      closeMenu();
    }
  };

  return (
    <>
      <nav
        className={`sticky top-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/95 backdrop-blur-md border-b border-sand-200/80 shadow-md shadow-sand-200/30"
            : "bg-white/90 backdrop-blur-md border-b border-sand-200/60"
        }`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2.5 group"
            aria-label="AskSam Home"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md shadow-blue-200/50 group-hover:shadow-lg group-hover:shadow-blue-200/60 transition-all duration-200">
              AS
            </div>
            <span className="text-xl font-extrabold text-charcoal-800 group-hover:text-blue-600 transition-colors duration-200">
              Ask<span className="text-blue-500">Sam</span>
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-0.5">
            {NAV_LINKS.filter(l => !l.adminOnly || user?.role === 'admin').map(({ label, to }) => {
              const isActive = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? "text-blue-600 bg-blue-50/70"
                      : "text-charcoal-600 hover:text-blue-600 hover:bg-sand-50"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {label}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-blue-500 rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center gap-2">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 transition-transform hover:scale-105"
                  style={{ background: "#5E7A5A" }}
                >
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border z-50 animate-fade-in overflow-hidden" style={{ borderColor: "#E2E8DE" }}>
                    <div className="px-4 py-3 border-b" style={{ borderColor: "#F5F7F2", background: "#F9FAFB" }}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ background: "#5E7A5A" }}>
                          {user?.name?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: "#1F2937" }}>{user?.name}</p>
                          <p className="text-xs truncate" style={{ color: "#9CA3AF" }}>@{profileData?.user?.username || user?.email}</p>
                          <span className="inline-block mt-0.5 text-xs font-medium px-1.5 py-0.5 rounded" style={{ background: "#EEF2FF", color: "#5E7A5A" }}>
                            {user?.role}
                          </span>
                        </div>
                      </div>
                      {profileData?.user && (
                        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                          <div className="bg-white rounded p-1.5">
                            <p className="text-sm font-bold" style={{ color: "#1F2937" }}>{profileData.user.questionsCount || 0}</p>
                            <p className="text-xs" style={{ color: "#9CA3AF" }}>Questions</p>
                          </div>
                          <div className="bg-white rounded p-1.5">
                            <p className="text-sm font-bold" style={{ color: "#1F2937" }}>{profileData.user.answersCount || 0}</p>
                            <p className="text-xs" style={{ color: "#9CA3AF" }}>Answers</p>
                          </div>
                          <div className="bg-white rounded p-1.5">
                            <p className="text-sm font-bold" style={{ color: "#059669" }}>{profileData.user.verifiedCount || 0}</p>
                            <p className="text-xs" style={{ color: "#9CA3AF" }}>Verified</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="py-1">
                      <Link
                        to="/profile"
                        onClick={() => setDropdownOpen(false)}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2"
                        style={{ color: "#374151" }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        My Profile
                      </Link>
                      <Link
                        to="/my-questions"
                        onClick={() => setDropdownOpen(false)}
                        className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2"
                        style={{ color: "#374151" }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        My Questions
                      </Link>
                      <button
                        onClick={() => { setDropdownOpen(false); logout(); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50/80 rounded-lg
                           hover:bg-blue-100 transition-all duration-200 border border-blue-100/50"
              >
                Sign In
              </Link>
            )}
            <Link
              to="/ask"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold
                         bg-blue-500 text-white rounded-lg hover:bg-blue-600 active:bg-blue-700
                         shadow-md shadow-blue-200/40 hover:shadow-lg hover:shadow-blue-200/50
                         transition-all duration-200"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Ask Question
            </Link>
          </div>

          <div className="flex lg:hidden items-center gap-2">
            <Link
              to="/ask"
              className="inline-flex items-center justify-center w-9 h-9
                         bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              aria-label="Ask a question"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </Link>
            <button
              type="button"
              onClick={toggleMenu}
              onKeyDown={handleKeyDown}
              className="inline-flex items-center justify-center w-10 h-10 rounded-lg
                         text-charcoal-600 hover:bg-sand-100 hover:text-blue-600
                         transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:ring-offset-2"
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              <div className="w-5 h-5 relative flex flex-col justify-center">
                <span
                  className={`absolute w-5 h-0.5 bg-current rounded-full transition-all duration-300 ${
                    isMenuOpen ? "rotate-45 top-1/2" : "top-0.5"
                  }`}
                />
                <span
                  className={`absolute w-5 h-0.5 bg-current rounded-full transition-all duration-300 ${
                    isMenuOpen ? "opacity-0 scale-0" : "top-1/2"
                  }`}
                />
                <span
                  className={`absolute w-5 h-0.5 bg-current rounded-full transition-all duration-300 ${
                    isMenuOpen ? "-rotate-45 top-1/2" : "bottom-0.5"
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </nav>

      <div
        id="mobile-menu"
        className={`lg:hidden fixed inset-0 z-40 transition-all duration-300 ${
          isMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!isMenuOpen}
      >
        <div
          className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ${
            isMenuOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={closeMenu}
          aria-hidden="true"
        />
        <div
          className={`absolute top-16 inset-x-0 bg-white border-b border-sand-200 shadow-xl
                      transform transition-all duration-300 ease-out ${
                        isMenuOpen ? "translate-y-0" : "-translate-y-full"
                      }`}
        >
          <div className="max-w-6xl mx-auto px-4 py-4 space-y-1">
            {NAV_LINKS.filter(l => !l.adminOnly || user?.role === 'admin').map(({ label, to }) => {
              const isActive = location.pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={closeMenu}
                  className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl
                             transition-all duration-200 ${
                               isActive
                                 ? "bg-blue-50 text-blue-600 border border-blue-100/50"
                                 : "text-charcoal-600 hover:bg-sand-50 hover:text-blue-600"
                             }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {label}
                  {isActive && (
                    <svg
                      className="w-4 h-4 ml-auto"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </Link>
              );
            })}
            <div className="pt-3 border-t border-sand-200 mt-3">
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => { logout(); closeMenu(); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium
                             text-red-600 bg-red-50 rounded-xl hover:bg-red-100
                             border border-red-100 transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium
                             text-blue-600 bg-blue-50 rounded-xl hover:bg-blue-100
                             border border-blue-100/50 transition-all duration-200"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
