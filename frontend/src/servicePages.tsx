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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string>("");
  const [mapLoaded, setMapLoaded] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(50); // Percentage
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const isResizing = useRef(false);

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

  // Initialize map when places and map are loaded
  useEffect(() => {
    if (!mapLoaded || !places.length || !mapRef.current) return;

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

      // Add markers for each place
      places.forEach((place) => {
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
              </div>
            `
          });

          marker.addListener('click', () => {
            infoWindow.open(mapInstanceRef.current!, marker);
          });

          markersRef.current.push(marker);
        }
      });
    };

    initializeMap();
  }, [mapLoaded, places]);

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
      } catch (err) {
        console.error("❌ Error fetching places:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPlaces();
  }, []);

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
              className="nav-link"
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

      {/* Main Content - Resizable Split Layout */}
      <div style={{ 
        display: "flex", 
        height: "calc(100vh - 200px)",
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
          <div className="section-label">Places Database</div>
          <h2 className="section-title">📋 UCF Area Places</h2>

          {places.length === 0 ? (
            <div className="section-body" style={{ textAlign: "center", padding: "2rem" }}>
              <h3 style={{ color: "var(--gold)", marginBottom: "1rem" }}>No places found</h3>
              <p>Try clicking the "Services" button on the home page to fetch Yelp data first.</p>
            </div>
          ) : (
            <div className="features-wrap">
              {places.map((place) => (
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
                      style={{
                        background: "var(--gold)",
                        color: "var(--black)",
                        border: "none",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "4px",
                        fontSize: "0.7rem",
                        cursor: "pointer",
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
          
          {!googleMapsApiKey || googleMapsApiKey === "YOUR_GOOGLE_MAPS_API_KEY_HERE" ? (
            <div className="section-body" style={{ textAlign: "center", padding: "2rem" }}>
              <h3 style={{ color: "var(--gold)", marginBottom: "1rem" }}>🗺️ Google Maps Integration</h3>
              <p>Please add your Google Maps API key to server.js</p>
              <p className="feature-desc" style={{ marginTop: "1rem" }}>
                Replace "YOUR_GOOGLE_MAPS_API_KEY_HERE" with your actual API key
              </p>
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
              style={{
                position: "absolute",
                top: "1rem",
                right: "1rem",
                background: "var(--gold)",
                color: "var(--black)",
                border: "none",
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
                <strong>Coordinates:</strong> 🗺️ {selectedPlace.latitude.toFixed(6)}, {selectedPlace.longitude.toFixed(6)}
              </div>
            )}
            
            <div className="section-body">
              <strong>Business ID:</strong> {selectedPlace.yelpId}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ServicesPage;

