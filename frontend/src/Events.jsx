import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import logoImg from './assets/KnightHavenLogo.png';

const Events = ({ onBack }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [leftPanelWidth, setLeftPanelWidth] = useState(60); // Percentage
  const [selectedEvent, setSelectedEvent] = useState(null);
  const isResizing = useRef(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5001/api/events');
      const data = await response.json();
      
      if (data.success) {
        setEvents(data.events);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch events');
      }
    } catch (err) {
      setError('Unable to connect to events service');
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle panel resizing
  const handleMouseDown = (e) => {
    isResizing.current = true;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (!isResizing.current) return;
    
    const containerWidth = window.innerWidth;
    const newLeftWidth = (e.clientX / containerWidth) * 100;
    
    // Constrain between 30% and 80%
    const constrainedWidth = Math.min(Math.max(newLeftWidth, 30), 80);
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
            <h1 className="app-name">🔄 Loading UCF Events...</h1>
            <p className="tagline">Fetching the latest events from UCF...</p>
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
            <h1 className="app-name">❌ Error Loading Events</h1>
            <p className="tagline" style={{ color: "#ff6b6b" }}>Error: {error}</p>
            <button 
              onClick={fetchEvents}
              className="btn-primary"
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
          <div style={{ 
            display: "flex", 
            width: "60px",
            height: "60px",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <img
              src={logoImg}
              alt="KnightHaven logo"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                borderRadius: "8px",
                filter: "drop-shadow(0 0 10px rgba(255, 204, 0, 0.5))"
              }}
            />
          </div>
          <div>
              <h1 className="app-name events-glow" style={{ margin: "0", fontSize: "1.5rem" }}>
                UCF EVENTS
              </h1>
            <p className="tagline" style={{ margin: "0.25rem 0 0 0", fontSize: "0.9rem" }}>
              Discover what's happening at UCF today
            </p>
          </div>
        </div>

        {/* Right side - Controls */}
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <button onClick={onBack} className="btn-secondary">
            ← Back to Home
          </button>
        </div>
      </div>

      {/* Main Content - Resizable Split Layout */}
      <div style={{ 
        display: "flex", 
        height: "calc(100vh - 200px)",
        position: "relative",
        width: "100vw",
        margin: "0",
        left: "50%",
        right: "50%",
        marginLeft: "-50vw",
        marginRight: "-50vw"
      }}>
        {/* Left Side - Events List */}
        <div 
          className="card" 
          style={{ 
            width: `${leftPanelWidth}%`, 
            overflowY: "auto",
            padding: "1.5rem"
          }}
        >
          <div className="section-label">📅 UCF Events</div>
          <h2 className="section-title">Today's Events ({events.length})</h2>
          
          {events.length === 0 ? (
            <div className="section-body" style={{ textAlign: "center", padding: "2rem" }}>
              <h3 style={{ color: "var(--gold)", marginBottom: "1rem" }}>📅 No Events Found</h3>
              <p>Check back later for new events</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {events.map((event, index) => (
                <div 
                  key={event.id || index}
                  className="card"
                  style={{
                    padding: "1rem",
                    cursor: "pointer",
                    border: selectedEvent?.id === event.id ? "2px solid var(--gold)" : "1px solid rgba(255, 204, 0, 0.2)",
                    transition: "all 0.3s ease",
                    background: selectedEvent?.id === event.id ? "rgba(255, 204, 0, 0.1)" : "var(--black)"
                  }}
                  onClick={() => {
                    setSelectedEvent(event);
                    if (event.link) {
                      window.open(event.link, '_blank', 'noopener,noreferrer');
                    }
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                    <h3 className="section-title" style={{ margin: "0", fontSize: "1.1rem", lineHeight: "1.3" }}>
                      {event.title}
                    </h3>
                    <div style={{ 
                      background: "var(--gold)", 
                      color: "var(--black)", 
                      padding: "0.25rem 0.5rem", 
                      borderRadius: "12px", 
                      fontSize: "0.8rem",
                      fontWeight: "bold"
                    }}>
                      UCF
                    </div>
                  </div>
                  
                  {event.time && event.time !== 'Time TBD' && (
                    <div className="feature-desc" style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                      <span style={{ color: "var(--gold)" }}>🕒</span>
                      <span>{event.time}</span>
                    </div>
                  )}
                  
                  {event.location && (
                    <div className="feature-desc" style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                      <span style={{ color: "var(--gold)" }}>📍</span>
                      <span>{event.location}</span>
                    </div>
                  )}
                  
                  {event.description && (
                    <div className="feature-desc" style={{ 
                      marginBottom: "0.5rem",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden"
                    }}>
                      {event.description}
                    </div>
                  )}
                  
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center",
                    marginTop: "0.5rem",
                    paddingTop: "0.5rem",
                    borderTop: "1px solid rgba(255, 204, 0, 0.2)"
                  }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-dim)" }}>
                      Click to view details →
                    </span>
                    <span style={{ fontSize: "0.8rem", color: "var(--gold)" }}>
                      ⚔️ UCF Events
                    </span>
                  </div>
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

        {/* Right Side - Event Details */}
        <div 
          className="card" 
          style={{ 
            width: `${100 - leftPanelWidth}%`, 
            position: "relative",
            minWidth: "300px",
            padding: "1.5rem"
          }}
        >
          <div className="section-label">📋 Event Details</div>
          <h2 className="section-title">Selected Event</h2>
          
          {selectedEvent ? (
            <div>
              <h3 className="section-title" style={{ marginBottom: "1rem" }}>
                {selectedEvent.title}
              </h3>
              
              {selectedEvent.time && selectedEvent.time !== 'Time TBD' && (
                <div className="feature-desc" style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                  <span style={{ color: "var(--gold)" }}>🕒</span>
                  <span><strong>Time:</strong> {selectedEvent.time}</span>
                </div>
              )}
              
              {selectedEvent.location && (
                <div className="feature-desc" style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                  <span style={{ color: "var(--gold)" }}>📍</span>
                  <span><strong>Location:</strong> {selectedEvent.location}</span>
                </div>
              )}
              
              {selectedEvent.description && (
                <div style={{ marginBottom: "1.5rem" }}>
                  <h4 style={{ color: "var(--gold)", marginBottom: "0.5rem" }}>Description:</h4>
                  <p className="section-body">{selectedEvent.description}</p>
                </div>
              )}
              
              {selectedEvent.link && (
                <div style={{ marginTop: "1.5rem" }}>
                  <button 
                    onClick={() => window.open(selectedEvent.link, '_blank', 'noopener,noreferrer')}
                    className="btn-primary"
                    style={{ width: "100%" }}
                  >
                    🔗 View Event Details
                  </button>
                </div>
              )}
              
              <div style={{ 
                marginTop: "1.5rem", 
                padding: "1rem", 
                background: "rgba(255, 204, 0, 0.1)", 
                borderRadius: "8px",
                border: "1px solid rgba(255, 204, 0, 0.3)"
              }}>
                <h4 style={{ color: "var(--gold)", marginBottom: "0.5rem" }}>Event Source:</h4>
                <p className="feature-desc">⚔️ UCF Events - Official UCF Events Calendar</p>
              </div>
            </div>
          ) : (
            <div className="section-body" style={{ textAlign: "center", padding: "2rem" }}>
              <h3 style={{ color: "var(--gold)", marginBottom: "1rem" }}>📅 Select an Event</h3>
              <p>Click on any event from the list to view detailed information here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Events;
