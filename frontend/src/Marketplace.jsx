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
  const [phoneNumber, setPhoneNumber] = useState("");
  const [photoFile, setPhotoFile] = useState(null);

  // filter state (Filter panel on the left)
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // listings state
  const [listings, setListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [submittingListing, setSubmittingListing] = useState(false);
  const [showPhoneNumbers, setShowPhoneNumbers] = useState({});
  
  // image modal state
  const [selectedImage, setSelectedImage] = useState(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest('.custom-dropdown')) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Filter listings based on selected category
  const filteredListings = selectedCategory === "All" 
    ? listings 
    : listings.filter(listing => listing.category === selectedCategory);

  // Delete listing function
  const deleteListing = async (listingId) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/listings/${listingId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userEmail: user.email
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Listing deleted:', result);
        
        // Refresh listings
        await fetchListings();
      } else {
        const error = await response.json();
        alert(`Failed to delete listing: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting listing:', error);
      alert('Failed to delete listing. Please try again.');
    }
  };

  // Toggle phone number visibility
  const togglePhoneNumber = (listingId) => {
    setShowPhoneNumbers(prev => ({
      ...prev,
      [listingId]: !prev[listingId]
    }));
  };

  // Image modal functions
  const openImageModal = (imageUrl, title, description) => {
    setSelectedImage({ url: imageUrl, title, description });
  };

  const closeImageModal = () => {
    setSelectedImage(null);
  };

  // Custom dropdown functions
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const selectCategory = (category) => {
    setSelectedCategory(category);
    setIsDropdownOpen(false);
  };

  const categories = [
    "All",
    "General", 
    "Textbooks / Study",
    "Electronics",
    "Clothing / Dorm",
    "Services (tutoring, rides, etc.)"
  ];

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
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('price', parseFloat(price) || 0);
      formData.append('category', category);
      formData.append('phoneNumber', phoneNumber.trim() || '');
      formData.append('authorEmail', user.email);
      formData.append('authorName', getDisplayName(user));
      
      // Add image file if selected
      if (photoFile) {
        formData.append('image', photoFile);
      }

      // Create listing in database
      const response = await fetch('http://localhost:3001/api/listings', {
        method: 'POST',
        body: formData
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
                <span className="marketplace-glow">KNIGHTHAVEN MARKETPLACE</span>
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
            className="btn-secondary"
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
        {/* ========== LEFT COLUMN: CATEGORY FILTER ========== */}
        <aside className="filter-card">
          <div className="filter-card-header">
            <span className="filter-icon">🔍</span>
            <span className="filter-heading-label">FILTER</span>
          </div>

          <h2 className="filter-title">Filter by Category</h2>
          <p className="filter-desc">
            Browse listings by category to find what you're looking for.
          </p>

          <div className="filter-dropdown">
            <label className="filter-label">
              Select Category
            </label>
            <div className="custom-dropdown">
              <button 
                className="dropdown-trigger"
                onClick={toggleDropdown}
              >
                <span className="dropdown-text">
                  {selectedCategory === "All" ? "All Categories" : selectedCategory}
                </span>
                <span className={`dropdown-arrow ${isDropdownOpen ? "open" : ""}`}>
                  ▼
                </span>
              </button>
              
              {isDropdownOpen && (
                <div className="dropdown-menu">
                  {categories.map((category) => (
                    <button
                      key={category}
                      className={`dropdown-item ${selectedCategory === category ? "selected" : ""}`}
                      onClick={() => selectCategory(category)}
                    >
                      {category === "All" ? "All Categories" : category}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* ========== MIDDLE COLUMN: LISTINGS FEED ========== */}
        <main className="listings-feed">
          <h2 className="feed-heading">LISTINGS</h2>

          {loadingListings ? (
            <div className="loading-listings">
              <p>Loading listings...</p>
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="no-listings">
              <p>{selectedCategory === "All" ? "No listings yet. Be the first to post something!" : `No ${selectedCategory.toLowerCase()} listings found.`}</p>
            </div>
          ) : (
            filteredListings.map((listing) => (
              <div key={listing.id} className="feed-card" onClick={() => openImageModal(listing.imageUrl, listing.title, listing.description)}>
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
                  
                  {/* Image Section */}
                  {listing.imageUrl && (
                    <div className="feed-image-section">
                      <img 
                        src={`http://localhost:3001${listing.imageUrl}`} 
                        alt={listing.title}
                        className="listing-image"
                        onClick={() => openImageModal(listing.imageUrl, listing.title, listing.description)}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  
                  {/* Phone Number Section - Only visible to verified UCF users */}
                  {listing.phoneNumber && isVerifiedUCFUser(user) && (
                    <div className="feed-phone-section">
                      <button
                        className="phone-toggle-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePhoneNumber(listing.id);
                        }}
                      >
                        {showPhoneNumbers[listing.id] ? '📞 Hide Phone' : '📞 Show Phone'}
                      </button>
                      {showPhoneNumbers[listing.id] && (
                        <div className="phone-number-display">
                          <strong>Phone:</strong> {listing.phoneNumber}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Show message for non-verified users when phone number exists */}
                  {listing.phoneNumber && !isVerifiedUCFUser(user) && (
                    <div className="feed-phone-section">
                      <div className="phone-restricted-message">
                        📞 Phone number available to verified UCF Knights only
                      </div>
                    </div>
                  )}
                  
                  <div className="feed-author">
                    <small>Posted by: {listing.author?.displayName || 'Unknown'}</small>
                  </div>
                  
                  {/* Action Buttons - Only show delete for user's own listings */}
                  {isAuthenticated && user && user.email === listing.author?.email && (
                    <div className="feed-actions">
                    <button
                      className="delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteListing(listing.id);
                      }}
                      title="Delete this listing"
                    >
                        🗑️ Delete
                      </button>
                    </div>
                  )}
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
              <button onClick={handleLogin} className="btn-primary">
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

          {/* Phone Number - Only for UCF verified users */}
          <label className="field-label">
            Phone Number (Optional)
            <input
              className="input-field"
              type="tel"
              placeholder="Ex: (407) 555-0123"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <small className="field-help">
              📞 Add your phone number so interested buyers can contact you directly
            </small>
          </label>

              {/* Submit */}
              <button 
                type="submit" 
                className="btn-primary"
                disabled={submittingListing}
              >
                {submittingListing ? 'Posting...' : 'Post Listing'}
              </button>
            </form>
          )}
        </div>
      </section>
      
      {/* Image Modal */}
      {selectedImage && (
        <div className="image-modal-overlay" onClick={closeImageModal}>
          <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="image-modal-close" onClick={closeImageModal}>
              ✕
            </button>
            <img 
              src={`http://localhost:3001${selectedImage.url}`} 
              alt={selectedImage.title}
              className="image-modal-image"
            />
            <div className="image-modal-title">{selectedImage.title}</div>
            <div className="image-modal-description">{selectedImage.description}</div>
          </div>
        </div>
      )}
    </div>
  );
}
