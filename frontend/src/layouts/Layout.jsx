import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

// Layout.jsx is not currently used by App.jsx routing.
// App.jsx uses react-router-dom <Routes> directly with <Navbar> and <Footer>
// rendered inline. This file is kept for future nested routing use.
export default function Layout({ children }) {
  return (
    <div className="flex flex-col min-h-screen bg-sand-50 text-charcoal-800">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}