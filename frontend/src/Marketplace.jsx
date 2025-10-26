import React, { useState, useEffect } from "react";
import { useAuth0 } from '@auth0/auth0-react';
import { isUCFUser, getDisplayName, isEmailVerified, isVerifiedUCFUser } from './auth0-config.js';
import "./Marketplace.css";

export default function Marketplace({ onBack }) {
  const { loginWithRedirect, user, isAuthenticated, isLoading } = useAuth0();
  
  // form state (Create Listing panel)
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("General");
  const [description, setDescription] = useState("");
  const [photoFile, setPhotoFile] = useState(null);

  // search state (Search panel on the left)
  const [searchText, setSearchText] = useState("");
  const [searchCategory, setSearchCategory] = useState("All");

  // listings state
  const [listings, setListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [submittingListing, setSubmittingListing] = useState(false);

  // Fetch listings from database
  const fetchListings = async () => {
    try {
      setLoadingListings(true);
      const response = await fetch('http://localhost:3001/api/listings');
      if (response.ok) {
        const data = await response.json();
        setListings(data);
      } else {
        console.error('Failed to fetch listings');
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoadingListings(false);
    }
  };

  // Load listings on component mount
  useEffect(() => {
    fetchListings();
  }, []);

  // submit for marketplace post
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check if user is authenticated
    if (!isAuthenticated) {
      alert("Please log in to create a listing.");
      return;
    }

    // Check if user is a UCF Knight
    if (!isUCFUser(user)) {
      alert("Only UCF Knights can create marketplace listings. You can view listings as a community member.");
      return;
    }

    if (!isEmailVerified(user)) {
      alert("Please verify your UCF email address to create listings.");
      return;
    }

    setSubmittingListing(true);

    try {
      // Create listing in database
      const response = await fetch('http://localhost:3001/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          price: parseFloat(price) || 0,
          category,
          authorEmail: user.email,
          authorName: getDisplayName(user)
        })
      });

      if (response.ok) {
        const newListing = await response.json();
        console.log("New listing created:", newListing);
        
        // Refresh listings to show the new one
        await fetchListings();
        
        alert(`Listing posted by ${getDisplayName(user)}! 🎓 (Verified Knight)`);

        // clear form
        setTitle("");
        setPrice("");
        setCategory("General");
        setDescription("");
        setPhotoFile(null);
      } else {
        const errorData = await response.json();
        console.error('Server error:', errorData);
        throw new Error(errorData.error || 'Failed to create listing');
      }
    } catch (error) {
      console.error('Error creating listing:', error);
      alert(`Failed to create listing: ${error.message}. Please try again.`);
    } finally {
      setSubmittingListing(false);
    }
  };

  // Handle login for unauthenticated users
  const handleLogin = () => {
    loginWithRedirect({
      authorizationParams: {
        prompt: 'login',
        screen_hint: 'login'
      }
    });
  };

  // submit for search (left panel)
  const handleSearch = (e) => {
    e.preventDefault();
    console.log("Search for:", {
      text: searchText,
      category: searchCategory,
    });
    alert("Search coming soon (demo)");
  };

  return (
    <div className="marketplace-page">
      {/* HEADER / HERO */}
      <header className="marketplace-header">
        <div className="marketplace-header-inner">

          {/* LEFT SIDE: badge + title + blurb */}
          <div className="marketplace-heading-block">
            <div className="marketplace-badge-row">
              <span className="cart-emoji">🛒</span>
              <span className="marketplace-badge">
                KNIGHTHAVEN MARKETPLACE
              </span>
            </div>

            <h1 className="marketplace-title">
              Buy, sell, trade, offer services
            </h1>

            <p className="marketplace-subtitle">
              UCF Knight-to-Knight marketplace. Local only. Meet in public /
              <br />
              on campus. Community members can view listings.
            </p>
          </div>

          {/* RIGHT SIDE: Back button */}
          <button
            className="back-btn"
            onClick={() => {
              if (onBack) {
                onBack();
              } else {
                // fallback if parent didn't pass onBack
                window.location.reload();
              }
            }}
          >
            ← Back to Home
          </button>
        </div>
      </header>

      {/* MAIN BODY: 3 COLUMNS */}
      <section className="marketplace-body">
        {/* ========== LEFT COLUMN: SEARCH / FILTER ========== */}
        <aside className="search-card">
          <div className="search-card-header">
            <span className="search-icon">🔍</span>
            <span className="search-heading-label">SEARCH</span>
          </div>

          <h2 className="search-title">Looking for something?</h2>
          <p className="search-desc">
            Search the marketplace by item, service, category, etc.
          </p>

          <form onSubmit={handleSearch} className="search-form">
            {/* Search text */}
            <label className="field-label">
              What do you need?
              <input
                className="input-field"
                type="text"
                placeholder="Ex: calculator, ride, tutoring..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </label>

            {/* Search category */}
            <label className="field-label">
              Category
              <select
                className="input-field"
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
              >
                <option>All</option>
                <option>Textbooks / Study</option>
                <option>Electronics</option>
                <option>Clothing / Dorm</option>
                <option>Services</option>
                <option>Rides / Carpool</option>
              </select>
            </label>

            <button type="submit" className="search-btn">
              Search
            </button>

            <p className="search-hint">
              (Demo only — results feed coming soon)
            </p>
          </form>
        </aside>

        {/* ========== MIDDLE COLUMN: LISTINGS FEED ========== */}
        <main className="listings-feed">
          <h2 className="feed-heading">LISTINGS</h2>

          {loadingListings ? (
            <div className="loading-listings">
              <p>Loading listings...</p>
            </div>
          ) : listings.length === 0 ? (
            <div className="no-listings">
              <p>No listings yet. Be the first to post something!</p>
            </div>
          ) : (
            listings.map((listing) => (
              <div key={listing.id} className="feed-card">
                <div className="feed-card-top">
                  <div className="feed-title-row">
                    <span className="feed-title">{listing.title}</span>
                    <span className="feed-price">
                      {listing.price > 0 ? `$${listing.price}` : 'Free'}
                    </span>
                  </div>
                  <div className="feed-meta">
                    <span className={`feed-badge ${listing.author?.isUcfVerified ? '' : 'alt'}`}>
                      {listing.author?.isUcfVerified ? 'Verified Knight' : 'Community Member'}
                    </span>
                    <span className="feed-dot">•</span>
                    <span className="feed-cat">{listing.category}</span>
                    <span className="feed-dot">•</span>
                    <span className="feed-time">
                      {new Date(listing.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="feed-desc">
                    {listing.description}
                  </div>
                  <div className="feed-author">
                    <small>Posted by: {listing.author?.displayName || 'Unknown'}</small>
                  </div>
                </div>
              </div>
            ))
          )}
        </main>

        {/* ========== RIGHT COLUMN: CREATE A LISTING (MOVED HERE) ========== */}
        <div className="listing-card">
          <div className="listing-card-header">
            <span className="listing-icon">📢</span>
            <span className="listing-heading-label">
              CREATE A LISTING
            </span>
          </div>

          {isLoading ? (
            <div className="auth-loading">
              <p>Loading...</p>
            </div>
          ) : !isAuthenticated ? (
            <div className="auth-prompt">
              <h2 className="listing-title">Login Required</h2>
              <p className="listing-desc">
                You need to be logged in to create marketplace listings.
              </p>
              <button onClick={handleLogin} className="login-prompt-btn">
                Login to Create Listing
              </button>
            </div>
          ) : !isUCFUser(user) ? (
            <div className="auth-prompt">
              <h2 className="listing-title">UCF Knights Only</h2>
              <p className="listing-desc">
                Only UCF Knights can create marketplace listings. You can view and browse all listings as a community member.
              </p>
              <div className="verification-status community-member">
                <p>Current status: 🌎 Community Member</p>
                <p>You can view listings but cannot create new ones.</p>
              </div>
            </div>
          ) : !isEmailVerified(user) ? (
            <div className="auth-prompt">
              <h2 className="listing-title">Email Verification Required</h2>
              <p className="listing-desc">
                Please verify your UCF email address to create marketplace listings.
              </p>
              <div className="verification-status">
                <p>Current status: ⚠️ UCF email not verified</p>
                <p>Check your @ucf.edu email for a verification link.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h2 className="listing-title">Got something to sell or offer?</h2>
              <p className="listing-desc">
                Fill this out to post it to the marketplace feed.
              </p>
              <div className="user-info">
                <p>Posting as: <strong>{getDisplayName(user)}</strong> 🎓 (Verified Knight)</p>
              </div>

          {/* Title */}
          <label className="field-label">
            Title
            <input
              className="input-field"
              type="text"
              placeholder="Ex: 'TI-84 Calculator' or 'Math Tutoring'"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>

          {/* Price */}
          <label className="field-label">
            Price
            <input
              className="input-field"
              type="text"
              placeholder="Ex: 40, 10/hr, free"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </label>

          {/* Category */}
          <label className="field-label">
            Category
            <select
              className="input-field"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option>General</option>
              <option>Textbooks / Study</option>
              <option>Electronics</option>
              <option>Clothing / Dorm</option>
              <option>Services (tutoring, rides, etc.)</option>
            </select>
          </label>

          {/* Photo upload */}
          <label className="field-label">
            Photo (optional)
            <div className="file-row">
              <div className="file-fake-input">
                {photoFile
                  ? photoFile.name
                  : "Upload a photo of your item / service"}
              </div>
              <label className="file-btn">
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files[0];
                    setPhotoFile(file || null);
                  }}
                />
                Choose File
              </label>
            </div>
          </label>

          {/* Description */}
          <label className="field-label">
            Description
            <textarea
              className="textarea-field"
              rows={4}
              placeholder="Condition, pickup location, when you're available, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </label>

              {/* Submit */}
              <button 
                type="submit" 
                className="submit-listing-btn"
                disabled={submittingListing}
              >
                {submittingListing ? 'Posting...' : 'Post Listing'}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
