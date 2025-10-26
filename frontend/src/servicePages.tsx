import React, { useEffect, useState, useRef } from "react";
import "./App.css";

interface ServicePagesProps {
  onBack: () => void;
}

// Google Maps type declarations
declare global {
  interface Window {
    google: any;
  }
  
  namespace google {
    namespace maps {
      class Map {
        constructor(element: HTMLElement, options: MapOptions);
        setCenter(latlng: LatLng | LatLngLiteral): void;
        setZoom(zoom: number): void;
      }
      
      class Marker {
        constructor(options: MarkerOptions);
        addListener(eventName: string, handler: Function): void;
        setMap(map: Map | null): void;
      }
      
      class InfoWindow {
        constructor(options: InfoWindowOptions);
        open(map: Map, marker: Marker): void;
      }
      
      enum MapTypeId {
        ROADMAP = 'roadmap'
      }
      
      interface MapOptions {
        zoom: number;
        center: LatLng | LatLngLiteral;
        mapTypeId: MapTypeId;
        styles?: any[];
      }
      
      interface MarkerOptions {
        position: LatLng | LatLngLiteral;
        map: Map;
        title?: string;
        label?: any;
      }
      
      interface InfoWindowOptions {
        content: string;
      }
      
      interface LatLng {
        lat(): number;
        lng(): number;
      }
      
      interface LatLngLiteral {
        lat: number;
        lng: number;
      }
    }
  }
}

// Define the Place type based on your database schema
interface Place {
  id: string;
  yelpId: string;
  name: string;
  description?: string;
  originalCategory?: string;
  rating?: number;
  reviewCount?: number;
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  createdAt: string;
}

function ServicesPage({ onBack }: ServicePagesProps) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string>("");
  const [mapLoaded, setMapLoaded] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(50); // Percentage
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [showReviewModal, setShowReviewModal] = useState<boolean>(false);
  const [showReviewsModal, setShowReviewsModal] = useState<boolean>(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isUCFVerified, setIsUCFVerified] = useState<boolean>(false);
  const [selectedPlaceForReview, setSelectedPlaceForReview] = useState<string>("");
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [reviewContent, setReviewContent] = useState<string>("");
  const [reviewerName, setReviewerName] = useState<string>("");
  const [reviewerEmail, setReviewerEmail] = useState<string>("");
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [reviewCategoryFilter, setReviewCategoryFilter] = useState<string>("All");
  const [filteredReviews, setFilteredReviews] = useState<any[]>([]);
  const [showReviewsInsteadOfPlaces, setShowReviewsInsteadOfPlaces] = useState<boolean>(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const isResizing = useRef(false);

  // Available original categories for filtering (based on what was searched)
  const originalCategories = [
    "All",
    "restaurants",
    "mechanics", 
    "autoservice",
    "nail salon",
    "barber shop",
    "hair salon",
    "spa",
    "coffee shops"
  ];

  // Refresh reviews when page becomes visible (handles navigation back to services)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('👁️ Page became visible, refreshing reviews...');
        fetchAllReviews();
      }
    };

    const handleFocus = () => {
      console.log('🎯 Window focused, refreshing reviews...');
      fetchAllReviews();
    };

    // Listen for page visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    // Cleanup listeners
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Auto-fetch reviews when component loads
  useEffect(() => {
    console.log('🔄 Component loaded, fetching reviews...');
    fetchAllReviews();
  }, []);

  // Auto-fetch reviews when switching to reviews tab
  useEffect(() => {
    if (showReviewsInsteadOfPlaces) {
      console.log('🔄 Switched to reviews tab, fetching reviews...');
      fetchAllReviews();
    }
  }, [showReviewsInsteadOfPlaces]);

  // Persist reviews to localStorage whenever reviews change
  useEffect(() => {
    if (reviews.length > 0) {
      console.log('💾 Saving reviews to localStorage:', reviews.length, 'reviews');
      localStorage.setItem('cached_reviews', JSON.stringify(reviews));
    }
  }, [reviews]);

  // Load cached reviews from localStorage on component mount
  useEffect(() => {
    const cachedReviews = localStorage.getItem('cached_reviews');
    if (cachedReviews) {
      try {
        const parsedReviews = JSON.parse(cachedReviews);
        console.log('📂 Loading cached reviews from localStorage:', parsedReviews.length, 'reviews');
        setReviews(parsedReviews);
        setFilteredReviews(parsedReviews);
      } catch (error) {
        console.error('❌ Error parsing cached reviews:', error);
      }
    }
  }, []);

  // Check Auth0 authentication status
  useEffect(() => {
    const checkAuth0Status = async () => {
      try {
        console.log('🔍 Checking Auth0 authentication status...');
        
        // Check for Auth0 tokens in localStorage, sessionStorage, or URL hash
        const auth0Token = localStorage.getItem('auth0_access_token') || 
                          sessionStorage.getItem('auth0_access_token');
        
        // Check URL hash for Auth0 callback tokens
        const urlHash = window.location.hash;
        const urlParams = new URLSearchParams(urlHash.substring(1));
        const accessToken = urlParams.get('access_token');
        const idToken = urlParams.get('id_token');
        
        if (auth0Token || accessToken || idToken) {
          console.log('✅ Auth0 token found, fetching user profile...');
          
          // Use the token to fetch user profile
          const token = auth0Token || accessToken;
          const response = await fetch('http://localhost:3001/api/user/profile', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            console.log('✅ User profile fetched from Auth0:', userData);
            
            setUser(userData);
            setIsAuthenticated(true);
            setReviewerName(userData.name || userData.nickname || '');
            setReviewerEmail(userData.email || '');
            
            // Check if email is UCF verified
            const isUCFEmail = userData.email && userData.email.endsWith('@ucf.edu');
            setIsUCFVerified(isUCFEmail);
            
            console.log('✅ Auth0 authentication successful:', {
              name: userData.name,
              email: userData.email,
              isUCFVerified: isUCFEmail
            });
          } else {
            console.log('❌ Failed to fetch user profile from Auth0');
            setIsAuthenticated(false);
          }
        } else {
          console.log('❌ No Auth0 authentication detected');
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('❌ Error checking Auth0 authentication:', error);
        setIsAuthenticated(false);
      }
    };
    
    checkAuth0Status();
  }, []);

  // Fetch Google Maps API key
  useEffect(() => {
    const fetchMapsKey = async () => {
      try {
        const res = await fetch("http://localhost:3001/api/maps-key");
        const data = await res.json();
        setGoogleMapsApiKey(data.apiKey);
      } catch (err) {
        console.error("Error fetching Google Maps API key:", err);
      }
    };
    fetchMapsKey();
  }, []);

  // Load Google Maps script
  useEffect(() => {
    if (!googleMapsApiKey || mapLoaded) return;

    const loadGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setMapLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setMapLoaded(true);
      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, [googleMapsApiKey, mapLoaded]);

  // Initialize map when map is loaded
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;

    const initializeMap = () => {
      if (mapInstanceRef.current) return; // Map already initialized

      // UCF Student Union coordinates
      const ucfLocation = { lat: 28.6024, lng: -81.2001 };
      
      if (mapRef.current) {
        mapInstanceRef.current = new google.maps.Map(mapRef.current, {
          zoom: 13,
          center: ucfLocation,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }]
            }
          ]
        });
      }
    };

    initializeMap();
  }, [mapLoaded]);

  // Update markers when filtered places change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

      // Clear existing markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];

    // Determine which places to show markers for
    let placesToShow = filteredPlaces;
    
    // If viewing reviews, only show places that have reviews
    if (showReviewsModal && filteredReviews.length > 0) {
      const reviewedPlaceIds = filteredReviews.map(review => review.placeId);
      placesToShow = filteredPlaces.filter(place => reviewedPlaceIds.includes(place.id));
    }

    if (!placesToShow.length) {
      return;
    }

    // Add markers for each place
    placesToShow.forEach((place) => {
        if (place.latitude && place.longitude) {
          const marker = new google.maps.Marker({
            position: { lat: place.latitude, lng: place.longitude },
            map: mapInstanceRef.current!,
            title: place.name,
            label: {
              text: "⭐",
              color: "#f39c12",
              fontSize: "16px"
            }
          });

          const infoWindow = new google.maps.InfoWindow({
            content: `
              <div style="padding: 10px; max-width: 250px;">
                <h3 style="margin: 0 0 8px 0; color: #2c3e50;">${place.name}</h3>
                ${place.description ? `<p style="margin: 0 0 8px 0; color: #7f8c8d; font-style: italic; font-size: 12px;">${place.description}</p>` : ''}
                <p style="margin: 0 0 4px 0; color: #f39c12; font-weight: bold;">
                  ⭐ ${place.rating || 'N/A'}/5
                  ${place.reviewCount ? ` (${place.reviewCount} reviews)` : ''}
                </p>
                <p style="margin: 0; color: #666; font-size: 12px;">
                  📍 ${place.address || 'Address not available'}
                </p>
              ${showReviewsModal ? `<p style="margin: 4px 0 0 0; color: #3498db; font-size: 12px;">📝 Has student reviews</p>` : ''}
              </div>
            `
          });

          marker.addListener('click', () => {
            infoWindow.open(mapInstanceRef.current!, marker);
          });

          markersRef.current.push(marker);
        }
      });
  }, [mapLoaded, filteredPlaces, showReviewsModal, filteredReviews]);

  useEffect(() => {
    const fetchPlaces = async () => {
      try {
        console.log("🔍 Fetching places from API...");
        const res = await fetch("http://localhost:3001/api/places");
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        console.log("📋 Places data received:", data);
        setPlaces(data);
        setFilteredPlaces(data); // Initialize filtered places with all places
      } catch (err) {
        console.error("❌ Error fetching places:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPlaces();
  }, []);

  // Filter places based on selected original category
  useEffect(() => {
    if (selectedCategory === "All") {
      setFilteredPlaces(places);
    } else {
      const filtered = places.filter(place => 
        place.originalCategory?.toLowerCase() === selectedCategory.toLowerCase()
      );
      setFilteredPlaces(filtered);
    }
  }, [selectedCategory, places]);

  // Fetch reviews for a specific place
  const fetchReviews = async (placeId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/reviews/${placeId}`);
      if (response.ok) {
        const reviewsData = await response.json();
        setReviews(reviewsData);
      } else {
        console.error('Failed to fetch reviews');
        setReviews([]);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
    }
  };

  // Fetch all reviews
  const fetchAllReviews = async () => {
    try {
      console.log('🔍 Fetching all reviews from database...');
      const response = await fetch('http://localhost:3001/api/reviews');
      console.log('📡 Response status:', response.status);
      
      if (response.ok) {
        const reviewsData = await response.json();
        console.log('📝 Raw reviews data from database:', reviewsData);
        // Filter to only show approved reviews
        const approvedReviews = reviewsData.filter((review: any) => review.isApproved);
        console.log('✅ Approved reviews from database:', approvedReviews);
        
        // Update state
        setReviews(approvedReviews);
        setFilteredReviews(approvedReviews);
        
        // Update localStorage cache
        localStorage.setItem('cached_reviews', JSON.stringify(approvedReviews));
        console.log('💾 Updated localStorage cache with', approvedReviews.length, 'reviews');
        
        return approvedReviews;
      } else {
        console.error('❌ Failed to fetch all reviews, status:', response.status);
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        
        // Fallback to cached reviews if database fetch fails
        const cachedReviews = localStorage.getItem('cached_reviews');
        if (cachedReviews) {
          try {
            const parsedReviews = JSON.parse(cachedReviews);
            console.log('📂 Using cached reviews as fallback:', parsedReviews.length, 'reviews');
            setReviews(parsedReviews);
            setFilteredReviews(parsedReviews);
          } catch (error) {
            console.error('❌ Error parsing cached reviews:', error);
            setReviews([]);
            setFilteredReviews([]);
          }
        } else {
          setReviews([]);
          setFilteredReviews([]);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching all reviews:', error);
      
      // Fallback to cached reviews if network error
      const cachedReviews = localStorage.getItem('cached_reviews');
      if (cachedReviews) {
        try {
          const parsedReviews = JSON.parse(cachedReviews);
          console.log('📂 Using cached reviews due to network error:', parsedReviews.length, 'reviews');
          setReviews(parsedReviews);
          setFilteredReviews(parsedReviews);
        } catch (error) {
          console.error('❌ Error parsing cached reviews:', error);
          setReviews([]);
          setFilteredReviews([]);
        }
      } else {
        setReviews([]);
        setFilteredReviews([]);
      }
    }
  };

  // Filter reviews by category
  useEffect(() => {
    if (reviewCategoryFilter === "All") {
      setFilteredReviews(reviews);
    } else {
      const filtered = reviews.filter(review => {
        const place = places.find(p => p.id === review.placeId);
        return place?.originalCategory?.toLowerCase() === reviewCategoryFilter.toLowerCase();
      });
      setFilteredReviews(filtered);
    }
  }, [reviewCategoryFilter, reviews, places]);

  // Submit a new review
  const submitReview = async () => {
    if (!selectedPlaceForReview || !selectedRating || !reviewContent) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      // Use Auth0 user data if available, otherwise use anonymous
      const reviewerNameToUse = (isAuthenticated && user) ? 
        (user.name || user.nickname || 'Anonymous') : 
        'Anonymous';
      const reviewerEmailToUse = (isAuthenticated && user) ? 
        (user.email || 'no-email@example.com') : 
        'no-email@example.com';

      console.log('📝 Submitting review...', {
        placeId: selectedPlaceForReview,
        reviewerName: reviewerNameToUse,
        reviewerEmail: reviewerEmailToUse,
        isUCFVerified: isAuthenticated && user ? isUCFVerified : false,
        rating: selectedRating,
        content: reviewContent,
        userFromAuth0: !!user
      });

      const response = await fetch('http://localhost:3001/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          placeId: selectedPlaceForReview,
          reviewerName: reviewerNameToUse,
          reviewerEmail: reviewerEmailToUse,
          isUCFVerified: isAuthenticated && user ? isUCFVerified : false,
          rating: selectedRating,
          content: reviewContent
        })
      });

      console.log('📡 Submit response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Review submitted successfully:', result);
        
        // Reset form
        setSelectedPlaceForReview("");
        setSelectedRating(0);
        setReviewContent("");
        
        // Close modal
        setShowReviewModal(false);
        
        // Refresh all reviews immediately
        console.log('🔄 Refreshing reviews after submission...');
        await fetchAllReviews();
        
        // Also refresh if we're currently viewing reviews
        if (showReviewsInsteadOfPlaces) {
          console.log('🔄 Currently viewing reviews, ensuring fresh data...');
          await fetchAllReviews();
        }
      } else {
        const error = await response.json();
        console.error('❌ Failed to submit review:', error);
        alert(`Failed to submit review: ${error.error}`);
      }
    } catch (error) {
      console.error('❌ Error submitting review:', error);
      alert('Failed to submit review. Please try again.');
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-dropdown]')) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  // Handle panel resizing
  const handleMouseDown = (e: React.MouseEvent) => {
    isResizing.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.current) return;
    
    const containerWidth = window.innerWidth;
    const newLeftWidth = (e.clientX / containerWidth) * 100;
    
    // Constrain between 20% and 80%
    const constrainedWidth = Math.min(Math.max(newLeftWidth, 20), 80);
    setLeftPanelWidth(constrainedWidth);
  };

  const handleMouseUp = () => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  if (loading) {
    return (
      <div className="page-wrap">
        <div className="hero">
          <div className="hero-inner">
            <h1 className="app-name"> Loading UCF Services...</h1>
            <p className="tagline">Fetching the best places near UCF...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-wrap">
        <div className="hero">
          <div className="hero-inner">
            <h1 className="app-name">❌ Error Loading Services</h1>
            <p className="tagline" style={{ color: "#ff6b6b" }}>Error: {error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="btn-secondary"
              style={{ marginTop: "1rem" }}
            >
              🔄 Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100vw", margin: "0", padding: "0" }}>
      {/* Header */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: "100vw",
        margin: "0",
        padding: "1rem 2rem",
        background: "linear-gradient(135deg, rgba(42, 42, 42, 0.9), rgba(15, 15, 15, 0.95))",
        border: "1px solid rgba(255, 204, 0, 0.3)",
        borderRadius: "0",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.8), 0 0 40px rgba(255, 204, 0, 0.1)",
        position: "relative",
        left: "50%",
        right: "50%",
        marginLeft: "-50vw",
        marginRight: "-50vw"
      }}>
            {/* Left side - Logo and Title */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <img 
                src="/src/assets/KnightHavenLogo.png" 
                alt="KnightHaven Logo" 
                style={{
                  width: "60px",
                  height: "60px",
                  objectFit: "contain"
                }}
                onLoad={() => console.log("Logo loaded successfully")}
                onError={(e) => {
                  console.error("Failed to load logo");
                  // Fallback to emoji if image fails to load
                  const target = e.currentTarget as HTMLImageElement;
                  target.style.display = "none";
                  const fallback = target.nextElementSibling as HTMLDivElement;
                  if (fallback) {
                    fallback.style.display = "flex";
                  }
                }}
              />
              <div style={{ 
                display: "none", 
                fontSize: "2rem",
                width: "60px",
                height: "60px",
                alignItems: "center",
                justifyContent: "center"
              }}>
               
              </div>
              <div>
                <h1 className="app-name services-glow" style={{ margin: "0", fontSize: "1.5rem" }}>
                  UCF NEARBY
                </h1>
                <p className="tagline" style={{ margin: "0.25rem 0 0 0", fontSize: "0.9rem" }}>
                 
                </p>
              </div>
            </div>

            {/* Right side - Back button */}
            <button onClick={onBack} className="btn-secondary">
              ← Back to Home
            </button>
      </div>

      {/* Filter Section */}
      <div style={{
        padding: "1rem 2rem",
        background: "linear-gradient(135deg, rgba(42, 42, 42, 0.8), rgba(15, 15, 15, 0.9))",
        borderBottom: "1px solid rgba(255, 204, 0, 0.2)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <span style={{ 
            color: "var(--gold)", 
            fontWeight: "bold", 
            fontSize: "1rem",
            minWidth: "fit-content"
          }}>
            Filter by Search Category:
          </span>
          <div style={{ position: "relative", display: "inline-block" }} data-dropdown>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              style={{
                background: "var(--gold)",
                color: "var(--black)",
                border: "1px solid var(--gold)",
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "0.9rem",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                minWidth: "200px",
                justifyContent: "space-between"
              }}
            >
              {selectedCategory}
              <span style={{ fontSize: "0.8rem" }}>
                {showDropdown ? "▲" : "▼"}
              </span>
            </button>
            
            {showDropdown && (
              <div style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                background: "var(--black)",
                border: "1px solid var(--gold)",
                borderRadius: "8px",
                zIndex: 1000,
                maxHeight: "200px",
                overflowY: "auto",
                marginTop: "0.25rem"
              }}>
                {originalCategories.map((category) => (
                  <button
                    key={category}
                    onClick={() => {
                      setSelectedCategory(category);
                      setShowDropdown(false);
                    }}
                    style={{
                      width: "100%",
                      background: selectedCategory === category 
                        ? "var(--gold)" 
                        : "transparent",
                      color: selectedCategory === category 
                        ? "var(--black)" 
                        : "var(--gold)",
                      border: "none",
                      padding: "0.75rem 1rem",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                      textAlign: "left",
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={(e) => {
                      if (selectedCategory !== category) {
                        e.currentTarget.style.background = "rgba(255, 204, 0, 0.2)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedCategory !== category) {
                        e.currentTarget.style.background = "transparent";
                      }
                    }}
                  >
                    {category}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Write Review Button */}
          <button
            onClick={() => setShowReviewModal(true)}
            className="btn-primary"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              minWidth: "160px",
              justifyContent: "center"
            }}
          >
            Write Review
          </button>

          {/* View Reviews Button */}
          <button
            onClick={() => {
              if (showReviewsInsteadOfPlaces) {
                setShowReviewsInsteadOfPlaces(false);
              } else {
                setShowReviewsInsteadOfPlaces(true);
                // Reviews will be fetched automatically by useEffect
              }
            }}
            style={{
              background: showReviewsInsteadOfPlaces ? "#e74c3c" : "var(--gold)",
              color: showReviewsInsteadOfPlaces ? "white" : "var(--black)",
              border: "none",
              padding: "0.5rem 1rem",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "0.9rem",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              minWidth: "160px",
              justifyContent: "center"
            }}
          >
            {showReviewsInsteadOfPlaces ? "Show Places" : "See Reviews"}
          </button>
        </div>
        <div style={{ 
          marginTop: "0.5rem", 
          color: "var(--text-dim)", 
          fontSize: "0.9rem" 
        }}>
          Showing {filteredPlaces.length} of {places.length} places
        </div>
      </div>

      {/* Main Content - Resizable Split Layout */}
      <div style={{ 
        display: "flex", 
        height: "calc(100vh - 280px)",
        position: "relative",
        width: "100vw",
        margin: "0",
        padding: "0"
      }}>
        {/* Left Side - Places List */}
        <div 
          className="card" 
          style={{ 
            width: `${leftPanelWidth}%`, 
            overflowY: "auto",
            minWidth: "300px",
            maxWidth: "80%"
          }}
        >
          <div className="section-label">{showReviewsInsteadOfPlaces ? "Reviews Database" : "Places Database"}</div>
          <h2 className="section-title">{showReviewsInsteadOfPlaces ? "UCF Student Reviews" : "UCF Area Places"}</h2>

          {showReviewsInsteadOfPlaces ? (
            <div className="section-body">
              <div style={{ marginBottom: "1.5rem" }}>
                <h3 style={{ color: "var(--gold)", marginBottom: "1rem" }}>Filter Reviews by Category</h3>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                  <span style={{ 
                    color: "var(--gold)", 
                    fontWeight: "bold", 
                    fontSize: "0.9rem"
                  }}>
                    Category:
                  </span>
                  <select 
                    value={reviewCategoryFilter}
                    onChange={(e) => setReviewCategoryFilter(e.target.value)}
                    style={{
                      padding: "0.5rem",
                      borderRadius: "4px",
                      background: "var(--gray-dark)",
                      color: "white",
                      border: "1px solid var(--gold)",
                      minWidth: "150px"
                    }}
                  >
                    <option value="All">All Categories</option>
                    {originalCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <h3 style={{ color: "var(--gold)", marginBottom: "1rem" }}>
                  Reviews ({filteredReviews.length} total)
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxHeight: "400px", overflowY: "auto" }}>
                  {filteredReviews.length === 0 ? (
                    <div style={{
                      background: "rgba(255, 204, 0, 0.1)",
                      padding: "1rem",
                      borderRadius: "8px",
                      border: "1px solid rgba(255, 204, 0, 0.3)",
                      textAlign: "center"
                    }}>
                      <p style={{ margin: "0", color: "var(--text-dim)" }}>
                        {reviews.length === 0 ? "No reviews yet. Be the first to write a review!" : `No reviews found for "${reviewCategoryFilter}" category`}
                      </p>
                    </div>
                  ) : (
                    filteredReviews.map((review) => (
                      <div key={review.id} style={{
                        background: "rgba(255, 204, 0, 0.1)",
                        padding: "1rem",
                        borderRadius: "8px",
                        border: "1px solid rgba(255, 204, 0, 0.3)"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                          <span style={{ fontWeight: "bold", color: "var(--gold)" }}>
                            {review.isUCFVerified ? "Verified Knight Review" : "Student Review"}
                          </span>
                          <span style={{ color: "var(--text-dim)" }}>
                            {"⭐".repeat(review.rating)}
                          </span>
                        </div>
                        <div style={{ marginBottom: "0.5rem", fontWeight: "bold", color: "var(--gold)" }}>
                          📍 {review.place?.name || "Unknown Place"}
                        </div>
                        <p style={{ margin: "0 0 0.5rem 0" }}>"{review.content}"</p>
                        <div style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
                          By: {review.reviewerName || "Anonymous"} • {review.isUCFVerified ? "Verified Knight" : "Student"}
                          <br />
                          <span style={{ fontSize: "0.7rem" }}>
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="section-body">
              {filteredPlaces.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem" }}>
                  <h3 style={{ color: "var(--gold)", marginBottom: "1rem" }}>
                    {places.length === 0 ? "No places found" : "No places match the selected filter"}
                  </h3>
                  <p>
                    {places.length === 0 
                      ? "Try clicking the 'Services' button on the home page to fetch Yelp data first."
                      : "Try selecting a different category or 'All' to see all places."
                    }
                  </p>
                </div>
              ) : (
            <div className="features-wrap">
              {filteredPlaces.map((place) => (
                <div
                  key={place.id}
                  className="feature"
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    if (mapInstanceRef.current && place.latitude && place.longitude) {
                      mapInstanceRef.current.setCenter({ lat: place.latitude, lng: place.longitude });
                      mapInstanceRef.current.setZoom(15);
                    }
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "0.5rem" }}>
                    <div className="feature-name" style={{ flex: 1 }}>{place.name}</div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPlace(place);
                      }}
                      className="btn-primary"
                      style={{
                        padding: "0.25rem 0.5rem",
                        fontSize: "0.7rem",
                        fontWeight: "bold"
                      }}
                    >
                       Details
                    </button>
                  </div>
                  
                  {place.description && (
                    <div className="feature-desc" style={{ fontStyle: "italic", marginBottom: "0.5rem" }}>
                      {place.description}
                    </div>
                  )}
                  
                  {place.rating && (
                    <div className="feature-desc" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ color: "var(--gold)" }}>⭐ {place.rating}/5</span>
                      {place.reviewCount && (
                        <span>({place.reviewCount} reviews)</span>
                      )}
                    </div>
                  )}
                  
                  {place.address && (
                    <div className="feature-desc" style={{ marginTop: "0.5rem" }}>
                      📍 {place.address}{place.city && `, ${place.city}`}
                    </div>
                  )}
                  
                  {place.latitude && place.longitude && (
                    <div className="feature-desc" style={{ 
                      fontFamily: "monospace", 
                      fontSize: "0.8rem",
                      marginTop: "0.5rem",
                      color: "var(--text-dim)"
                    }}>
                      🗺️ {place.latitude.toFixed(3)}, {place.longitude.toFixed(3)}
                    </div>
                  )}
                </div>
              ))}
            </div>
              )}
            </div>
          )}
        </div>

        {/* Resizer Handle */}
        <div
          onMouseDown={handleMouseDown}
          style={{
            width: "8px",
            background: "var(--gold)",
            cursor: "col-resize",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            zIndex: 10
          }}
        >
          <div style={{
            width: "2px",
            height: "40px",
            background: "var(--black)",
            borderRadius: "1px"
          }} />
        </div>

        {/* Right Side - Google Map */}
        <div 
          className="card" 
          style={{ 
            width: `${100 - leftPanelWidth}%`, 
            position: "relative",
            minWidth: "300px"
          }}
        >
          <div className="section-label">Interactive Map</div>
          <h2 className="section-title"> UCF Area Map</h2>
          
          {!googleMapsApiKey ? (
            <div className="section-body" style={{ textAlign: "center", padding: "2rem" }}>
              <h3 style={{ color: "var(--gold)", marginBottom: "1rem" }}>🗺️ Loading Google Maps...</h3>
              <p>Please wait while the map loads...</p>
            </div>
          ) : (
            <div 
              ref={mapRef} 
              style={{ 
                width: "100%", 
                height: "400px",
                background: "var(--gray-dark)",
                borderRadius: "8px",
                border: "1px solid rgba(255, 204, 0, 0.2)"
              }}
            />
          )}
        </div>
      </div>

      {/* Place Description Modal */}
      {selectedPlace && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div className="card" style={{
          maxWidth: "600px",
          maxHeight: "80vh",
          overflowY: "auto",
          position: "relative"
        }}>
            <button
              onClick={() => setSelectedPlace(null)}
              className="btn-danger"
              style={{
                position: "absolute",
                top: "1rem",
                right: "1rem",
                borderRadius: "50%",
                width: "30px",
                height: "30px",
                cursor: "pointer",
                fontSize: "1.2rem",
                fontWeight: "bold"
              }}
            >
              ×
            </button>
            
            <div className="section-label">Place Details</div>
            <h2 className="section-title">{selectedPlace.name}</h2>
            
            {selectedPlace.description && (
              <div className="section-body" style={{ marginBottom: "1rem" }}>
                <strong>Category:</strong> {selectedPlace.description}
              </div>
            )}
            
            {selectedPlace.rating && (
              <div className="section-body" style={{ marginBottom: "1rem" }}>
                <strong>Rating:</strong> ⭐ {selectedPlace.rating}/5 
                {selectedPlace.reviewCount && ` (${selectedPlace.reviewCount} reviews)`}
              </div>
            )}
            
            {selectedPlace.address && (
              <div className="section-body" style={{ marginBottom: "1rem" }}>
                <strong>Address:</strong> 📍 {selectedPlace.address}
                {selectedPlace.city && `, ${selectedPlace.city}`}
              </div>
            )}
            
            {selectedPlace.latitude && selectedPlace.longitude && (
              <div className="section-body" style={{ marginBottom: "1rem" }}>
                <strong>Coordinates: </strong>  {selectedPlace.latitude.toFixed(6)}, {selectedPlace.longitude.toFixed(6)}
              </div>
            )}
            
            <div className="section-body">
              <strong>Business Yelp ID:</strong> {selectedPlace.yelpId}
            </div>
          </div>
        </div>
      )}

      {/* Write Review Modal */}
      {showReviewModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div className="card" style={{
            maxWidth: "600px",
            maxHeight: "80vh",
            overflowY: "auto",
            position: "relative"
          }}>
            <button
              onClick={() => setShowReviewModal(false)}
              className="btn-danger"
              style={{
                position: "absolute",
                top: "1rem",
                right: "1rem",
                borderRadius: "50%",
                width: "30px",
                height: "30px",
                cursor: "pointer",
                fontSize: "1.2rem",
                fontWeight: "bold"
              }}
            >
              ×
            </button>
            
            <div className="section-label">Write Review</div>
            <h2 className="section-title">✍️ Submit Your Review</h2>
            
            <div className="section-body">
              {/* Show Auth0 user info if authenticated */}
              {isAuthenticated && user && (
                <div style={{ 
                  background: "rgba(52, 152, 219, 0.1)", 
                  padding: "0.75rem", 
                  borderRadius: "8px", 
                  border: "1px solid rgba(52, 152, 219, 0.3)",
                  marginBottom: "1rem"
                }}>
                  <p style={{ margin: "0", fontWeight: "bold", color: "#3498db" }}>
                    Authenticated User
                  </p>
                  <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.8rem", color: "var(--text-dim)" }}>
                    {user.name || user.nickname || 'User'}
                  </p>
                  <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.8rem", color: "var(--text-dim)" }}>
                    {user.email}
                  </p>
                </div>
              )}


              
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                    Select Place:
                  </label>
                  <select 
                    value={selectedPlaceForReview}
                    onChange={(e) => setSelectedPlaceForReview(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.5rem",
                      borderRadius: "4px",
                      background: "var(--gray-dark)",
                      color: "white",
                      border: "1px solid var(--gold)"
                    }}
                  >
                    <option value="">Choose a place to review...</option>
                    {filteredPlaces.map(place => (
                      <option key={place.id} value={place.id}>{place.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                    Rating:
                  </label>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    {[1, 2, 3, 4, 5].map(rating => (
                      <button
                        key={rating}
                        onClick={() => setSelectedRating(rating)}
                        style={{
                          background: selectedRating >= rating ? "var(--gold)" : "var(--gray-dark)",
                          color: selectedRating >= rating ? "var(--black)" : "white",
                          border: "1px solid var(--gold)",
                          borderRadius: "50%",
                          width: "40px",
                          height: "40px",
                          cursor: "pointer",
                          fontSize: "1.2rem"
                        }}
                      >
                        ⭐
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label style={{ display: "block", marginBottom: "0.5rem", fontWeight: "bold" }}>
                    Review:
                  </label>
                  <textarea
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    placeholder="Share your experience..."
                    style={{
                      width: "100%",
                      height: "100px",
                      padding: "0.5rem",
                      borderRadius: "4px",
                      background: "var(--gray-dark)",
                      color: "white",
                      border: "1px solid var(--gold)",
                      resize: "vertical"
                    }}
                  />
                </div>
                
                <button
                  onClick={submitReview}
                  className="btn-primary"
                  style={{
                    alignSelf: "flex-start"
                  }}
                >
                  Submit Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Reviews Modal */}
    </div>
  );
}

export default ServicesPage;