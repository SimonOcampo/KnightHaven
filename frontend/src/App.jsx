import React, { useState, useEffect } from "react";
import "./App.css";
import logoImg from "./assets/KnightHavenLogo.png";
import { useAuth0 } from '@auth0/auth0-react';
import ServicesPage from './servicePages';
import Events from './Events';
import Marketplace from './Marketplace';
import { isUCFUser, getDisplayName, isEmailVerified, isVerifiedUCFUser } from './auth0-config.js';

function App() {
  const { loginWithRedirect, logout, user, isAuthenticated, isLoading, error } = useAuth0();
  const [currentPage, setCurrentPage] = useState('home');
  const [authError, setAuthError] = useState(null);

  // Debug user data
  useEffect(() => {
    if (user) {
      console.log('=== USER DATA DEBUG ===');
      console.log('Full user object:', user);
      console.log('Email:', user.email);
      console.log('Email verified:', user.email_verified);
      console.log('Email verified type:', typeof user.email_verified);
      console.log('Nickname:', user.nickname);
      console.log('Username:', user.username);
      console.log('Username type:', typeof user.username);
      console.log('Preferred username:', user.preferred_username);
      console.log('Name:', user.name);
      console.log('Given name:', user.given_name);
      console.log('Family name:', user.family_name);
      console.log('Sub (subject):', user.sub);
      console.log('Custom username claim:', user['https://knighthaven/username']);
      console.log('User metadata:', user.user_metadata);
      console.log('App metadata:', user.app_metadata);
      console.log('All user keys:', Object.keys(user));
      console.log('User object JSON:', JSON.stringify(user, null, 2));
      console.log('Display name result:', getDisplayName(user));
      console.log('Is UCF user:', isUCFUser(user));
      console.log('Is email verified:', isEmailVerified(user));
      console.log('Is verified UCF user:', isVerifiedUCFUser(user));
      console.log('========================');
    }
  }, [user]);

  // Check for Auth0 errors in URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');
    
    // Debug logging
    console.log('=== AUTH0 ERROR DEBUG ===');
    console.log('Current URL:', window.location.href);
    console.log('URL Error:', error);
    console.log('URL Error Description:', errorDescription);
    console.log('All URL params:', Object.fromEntries(urlParams.entries()));
    console.log('========================');
    
    // Check if we're on Auth0's error page
    if (window.location.href.includes('auth0.com') && window.location.href.includes('error')) {
      console.log('Detected Auth0 error page');
      // This means Auth0 is showing the error, not redirecting back
    }
    
    if (error === 'access_denied' && errorDescription === 'ucf_only') {
      setAuthError('You must use a @ucf.edu email address to sign up. Please try again with your UCF email.');
      // Clear the URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (error === 'invalid_request' && errorDescription?.includes('user_exists')) {
      setAuthError('An account with this email already exists. Please try logging in instead.');
      // Clear the URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (error === 'invalid_request' && errorDescription?.includes('email')) {
      setAuthError('An account with this email already exists. Please try logging in instead.');
      // Clear the URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (error === 'invalid_request' && errorDescription?.includes('already exists')) {
      setAuthError('An account with this email already exists. Please try logging in instead.');
      // Clear the URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (error === 'invalid_request') {
      setAuthError('An account with this email already exists. Please try logging in instead.');
      // Clear the URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (error) {
      // Show the exact error for debugging
      setAuthError(`DEBUG: Error=${error}, Description=${errorDescription || 'None'}`);
      console.log('Setting generic error message:', error, errorDescription);
      // Clear the URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Handle Auth0 errors from the hook
  useEffect(() => {
    if (error) {
      console.log('Auth0 Hook Error:', error);
      console.log('Error type:', typeof error);
      console.log('Error keys:', Object.keys(error));
      
      // Handle different error formats
      const errorCode = error.error || error.code || error.type;
      const errorMessage = error.error_description || error.message || error.description;
      
      console.log('Parsed error code:', errorCode);
      console.log('Parsed error message:', errorMessage);
      
      if (errorCode === 'access_denied' && errorMessage === 'ucf_only') {
        setAuthError('You must use a @ucf.edu email address to sign up. Please try again with your UCF email.');
      } else if (errorCode === 'invalid_request' || errorCode === 'user_exists' || errorCode === 'email_exists') {
        setAuthError('An account with this email already exists. Please try logging in instead.');
      } else if (errorMessage?.includes('user_exists') || errorMessage?.includes('already exists') || errorMessage?.includes('email')) {
        setAuthError('An account with this email already exists. Please try logging in instead.');
      } else {
        setAuthError(`Authentication error: ${errorCode || 'Unknown'} - ${errorMessage || 'Please try again'}`);
      }
    }
  }, [error]);

  // Listen for navigation messages from child components
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'navigate') {
        setCurrentPage(event.data.page);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Navigation handler
  const handleNav = (pageName) => {
    if (pageName === 'Home') {
      setCurrentPage('home');
      if (isAuthenticated) {
        alert(`Welcome back, ${getDisplayName(user)}!`);
      }
    } else if (pageName === 'Events') {
      setCurrentPage('events');
    } else if (pageName === 'Marketplace') {
      setCurrentPage('marketplace');
    } else if (pageName === 'Services') {
      // Handle Services page with Yelp data fetching
      fetchYelpData();
    } else {
      alert(`${pageName} page coming soon!`);
    }
  };

  const handleLogin = () => {
    setAuthError(null); // Clear any existing errors
    
    // Force login mode to avoid signup errors
    loginWithRedirect({
      authorizationParams: {
        prompt: 'login', // Force login screen
        screen_hint: 'login' // Show login instead of signup
      }
    });
  };

  const handleRetryLogin = () => {
    setAuthError(null); // Clear any existing errors
    
    // Clear browser storage to reset Auth0 state
    localStorage.removeItem('auth0.is.authenticated');
    sessionStorage.clear();
    
    // Force a completely fresh login attempt
    loginWithRedirect({
      authorizationParams: {
        prompt: 'login', // Force login screen
        screen_hint: 'signup' // Show signup option
      }
    });
  };

  const handleLogout = () => {
    logout({ logoutParams: { returnTo: window.location.origin } });
  };

  //--YELP API ROUTE TO NODE.JS (ALWAYS FETCHES FRESH DATA)
  const fetchYelpData = async () => {
    try {
      console.log("🔄 Fetching FRESH Yelp data...");
      const res = await fetch("http://localhost:3001/api/refresh-data");
      const data = await res.json();
      console.log("✅ Fresh Yelp Data successfully fetched:", data);
      
      // Navigate to services page after fetching fresh data
      setCurrentPage('services');
    } catch (err) {
      console.error("❌ Error fetching fresh Yelp data:", err);
      alert("Failed to fetch fresh Yelp data. Check console for details.");
    }
  };

//END OF ROUTE TO NODE.JS API

//Display YELP
    //Fetch places already stored in DB
    const fetchPlaces = async () => {
      setLoadingPlaces(true);
      try {
        const res = await fetch("http://localhost:3001/api/places");
        const data = await res.json();
        setPlaces(data);
        setShowPlaces(true);
      } catch (err) {
        console.error("Error loading places:", err);
        alert("Failed to load places");
      } finally {
        setLoadingPlaces(false);
      }
    };


//END OF DISPLAY YELP DATA







  // Show services page if currentPage is 'services'
  if (currentPage === 'services') {
    return <ServicesPage onBack={() => setCurrentPage('home')} />;
  }

  // Show events page if currentPage is 'events'
  if (currentPage === 'events') {
    return <Events onBack={() => setCurrentPage('home')} />;
  }

  // Show marketplace page if currentPage is 'marketplace'
  if (currentPage === 'marketplace') {
    return <Marketplace onBack={() => setCurrentPage('home')} />;
  }

  return (
    <div className="page-wrap">
      {/* HEADER */}
      <header className="main-header">
        <div className="header-content">
          {/* Left side - Logo and Title */}
          <div className="header-left">
            <div className="header-logo">
              <img
                src={logoImg}
                alt="KnightHaven logo"
                className="header-logo-img"
              />
            </div>
            <div className="header-title">KNIGHTHAVEN</div>
          </div>

          {/* Right side - Navigation and Auth */}
          <div className="header-right">
            <nav className="header-nav">
              <button
                className="header-nav-link"
                onClick={() => handleNav("Events")}
              >
                EVENTS
              </button>
              <button
                className="header-nav-link"
                onClick={() => handleNav("Marketplace")}
              >
                MARKETPLACE
              </button>
              <button
                className="header-nav-link"
                onClick={() => handleNav("Services")}
              >
                NEARBY
              </button>
            </nav>
            
            {/* Auth Section */}
            {isLoading ? (
              <div className="auth-loading">Loading...</div>
            ) : isAuthenticated ? (
              <div className="auth-section">
                <div className="user-info">
                  Welcome, {getDisplayName(user)}! 
                  {isVerifiedUCFUser(user) ? ' 🎓' : 
                   isUCFUser(user) && !isEmailVerified(user) ? ' ⚠️' :
                   isEmailVerified(user) ? ' 🌎' : ' ⚠️'}
                </div>
                {!isEmailVerified(user) && (
                  <div className="verify-reminder">
                    📧 Please verify your email
                  </div>
                )}
                <button onClick={handleLogout} className="btn-danger">
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="auth-section">
                {authError && (
                  <div className="auth-error">
                    ⚠️ {authError}
                    <div className="auth-error-actions">
                      <button onClick={handleRetryLogin} className="btn-success">
                        Try Again
                      </button>
                      <button onClick={() => setAuthError(null)} className="btn-secondary">
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}
                <button onClick={handleLogin} className="btn-primary">
                  Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="hero-section">
        <div className="hero-content">
          {/* Left side - Text Content */}
          <div className="hero-text">
            <h1 className="hero-headline">
              <span className="hero-text-white">UCF </span>
              <span className="hero-text-glow">Community</span>
              <br />
              <span className="hero-text-glow">Connected.</span>
            </h1>
            <p className="hero-description">
              The ultimate peer-to-peer platform for UCF students. Connect through our community platform, discover campus events, trade in our marketplace, and access local services - all in one trusted community.
            </p>
            <div className="hero-buttons">
              <button 
                className="cta-btn primary"
                onClick={() => handleNav("Marketplace")}
              >
                EXPLORE MARKETPLACE
              </button>
              <button 
                className="cta-btn secondary"
                onClick={() => handleNav("Events")}
              >
                VIEW EVENTS
              </button>
            </div>
          </div>

          {/* Right side - Large Logo */}
          <div className="hero-visual">
            <div className="hero-logo-container">
              <div className="hero-logo-glow"></div>
              <img
                src={logoImg}
                alt="KnightHaven logo"
                className="hero-logo-img"
              />
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <main className="main">
        {/* Overview */}
        <section className="card overview-card">
          <div className="section-label">⚡ KnightHaven</div>

          <div className="section-title">
            Built for UCF students and Orlando locals
          </div>

          <div className="section-body">
            KnightHaven is a local social and marketplace web app built
            for the UCF community — connecting students and locals through
            posts, listings, and verified accounts.
            <br />
            <br />
            Created during a UCF hackathon, KnightHaven empowers users to
            buy, sell, share, and discover in one trusted, student-driven
            platform.
          </div>
        </section>

        {/* What it is / mission */}
        <section className="card">
          <div className="section-label">🚀 Overview</div>

          <div className="section-title">
            Social connection + local commerce in one place
          </div>

          <div className="section-body">
            KnightHaven helps UCF students and Orlando locals interact
            through community posts, services, and campus-based opportunities —
            all powered by real verification and location awareness.
          </div>

          <ul className="bullet-list">
            <li className="bullet-item">
              <span className="bullet-icon">•</span>
              <span>
                Stay plugged in with campus life and Orlando activity.
              </span>
            </li>
            <li className="bullet-item">
              <span className="bullet-icon">•</span>
              <span>
                Discover local deals, services, events, and opportunities.
              </span>
            </li>
            <li className="bullet-item">
              <span className="bullet-icon">•</span>
              <span>
                Connect with verified students for trust + safety.
              </span>
            </li>
          </ul>
        </section>

        {/* Account system */}
        <section className="card">
          <div className="section-label">👥 Account System</div>

          <div className="section-title">🎓 UCF Users</div>

          <div className="section-body">
            Verified with a <strong>@ucf.edu</strong> email to unlock
            trusted, student-only features.
          </div>

          <ul className="bullet-list">
            <li className="bullet-item">
              <span className="bullet-icon">•</span>
              <span>
                “Verified Knight” badge for trust and credibility.
              </span>
            </li>
            <li className="bullet-item">
              <span className="bullet-icon">•</span>
              <span>
                Access to student-only spaces and listings.
              </span>
            </li>
            <li className="bullet-item">
              <span className="bullet-icon">•</span>
              <span>
                Priority access to campus-relevant opportunities.
              </span>
            </li>
          </ul>

          <div
            className="section-title"
            style={{ marginTop: "1.5rem" }}
          >
            🌎 Non-UCF Users
          </div>

          <div className="section-body">
            Non-students can still browse public listings, view
            services, and interact with the broader local community —
            safely and transparently.
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-content">
          <p className="footer-text">
            <span className="footer-strong">KnightHaven</span> — built
            during a UCF hackathon for the Knight community.
          </p>
          
          <div className="footer-emails">
            <h4 className="footer-emails-title">Questions? Comments? Concerns?</h4>
            <button 
              className="btn-primary footer-email-btn"
              onClick={() => window.open('mailto:thejoshperez@gmail.com,xaviersotoba31@gmail.com,katiefortsas@gmail.com,simonomillan15@gmail.com?subject=KnightHaven Inquiry', '_blank')}
            >
              📧 Contact Team
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
