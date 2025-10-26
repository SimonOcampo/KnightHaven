# ⚡ KnightHaven

KnightHaven is a comprehensive local social and marketplace web application built for the UCF community — connecting students and locals through events, marketplace listings, local services, and verified accounts.

Created during a UCF hackathon, KnightHaven empowers users to discover campus events, buy/sell items, find local services, and connect with the community in one trusted, student-driven platform.

## 🚀 Overview

KnightHaven brings together social connection, local commerce, and campus life under one roof. It's designed to help UCF students and Orlando locals interact through community events, marketplace listings, and local services — all powered by real verification and location awareness.

## ⚙️ Features

### 🏠 Home Dashboard
- Personalized dashboard showcasing trending content
- Quick access to all platform features
- User authentication status and verification badges

### 📅 Events
- **Real-time UCF Events**: Scrapes live events from UCF's official events page
- **Beautiful UI**: Black-gold gradient design with modern card layouts
- **Event Filtering**: "All Events" and "This Week" filters
- **Interactive Cards**: Clean event cards with descriptions and direct links
- **Daily Caching**: Efficient data management with automatic refresh

### 🛍️ Marketplace
- **Peer-to-Peer Trading**: Buy and sell items within the UCF network
- **Image Uploads**: Support for listing photos with multer
- **Category Organization**: Organized by item categories
- **User Verification**: UCF-verified users get priority and trust badges
- **Contact Integration**: Phone number sharing for verified users

### 🗺️ Nearby Services
- **Yelp Integration**: Real-time local business data from Yelp API
- **Google Maps**: Interactive maps with business locations
- **Student Reviews**: Community-driven reviews for local businesses
- **Category Filtering**: Restaurants, mechanics, salons, coffee shops, and more
- **Location-Aware**: Centered around UCF campus (10-mile radius)

### 👥 Account System

#### 🎓 UCF Users
- **Auth0 Integration**: Secure authentication with Auth0
- **Email Verification**: Verified via @ucf.edu email authentication
- **"Verified Knight" Badge**: Trust and credibility indicators
- **Exclusive Access**: Student-only spaces and listings
- **Priority Features**: Enhanced marketplace and service access

#### 🌎 Non-UCF Users
- **Full Platform Access**: Browse, post, and use most features
- **Community Participation**: Can review businesses and participate
- **Limited Verification**: Access to public content and features

## 🧑‍💻 Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 19, Vite, CSS3, Auth0 React SDK |
| **Backend** | Node.js, Express.js |
| **Database** | SQLite with Prisma ORM |
| **Authentication** | Auth0 (OAuth 2.0, OpenID Connect) |
| **APIs** | Yelp API, Google Maps API |
| **Events** | Python Flask, BeautifulSoup (web scraping) |
| **File Upload** | Multer (image handling) |
| **Development** | ESLint, Vite dev server |

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- Python 3.8+ (for events scraper)
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/XavierS31/Hackathon-Project.git
cd Hackathon-Project
```

### 2. Backend Setup (Node.js API)
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys (Yelp, Google Maps)

# Set up database
npm run db:generate
npm run db:push

# Start the backend server
npm run dev
# Server runs on http://localhost:3001
```

### 3. Frontend Setup (React App)
```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
# App runs on http://localhost:5174
```

### 4. Events Scraper Setup (Python)
```bash
cd events_tab/backend

# Install Python dependencies
pip install -r requirements.txt

# Start the events API
python events_api.py
# Events API runs on http://localhost:5001
```

### 5. Database Setup
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# (Optional) Open Prisma Studio
npm run db:studio
```

## 🔐 Auth0 Configuration

### 1. Create Auth0 Account
1. Go to [https://auth0.com](https://auth0.com)
2. Sign up for a free account
3. Choose "Single Page Application"

### 2. Configure Application
Update `frontend/src/auth0-config.js` with your credentials:

```javascript
export const auth0Config = {
  domain: 'your-domain.auth0.com',
  clientId: 'your-client-id',
  authorizationParams: {
    redirect_uri: window.location.origin,
    audience: 'https://knighthaven-api',
    scope: 'openid profile email'
  }
};
```

### 3. Auth0 Dashboard Settings
- **Allowed Callback URLs**: `http://localhost:5174`
- **Allowed Logout URLs**: `http://localhost:5174`
- **Allowed Web Origins**: `http://localhost:5174`

## 📡 API Documentation

### Core Endpoints
- `GET /api/health` - Health check
- `GET /api/stats` - Database statistics
- `GET /api/users` - User management
- `GET /api/posts` - Social posts
- `GET /api/listings` - Marketplace listings
- `POST /api/listings` - Create listing (with image upload)
- `DELETE /api/listings/:id` - Delete listing
- `GET /api/services` - Local services
- `GET /api/places` - Yelp business data
- `GET /api/refresh-data` - Refresh Yelp data
- `GET /api/reviews` - Business reviews
- `POST /api/reviews` - Submit review

### Events API (Python)
- `GET /api/events` - Get UCF events
- `GET /api/events/health` - Events API health check

## 📁 Project Structure

```
KnightHaven/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── App.jsx          # Main app component
│   │   ├── Events.jsx       # Events page
│   │   ├── Marketplace.jsx  # Marketplace page
│   │   ├── servicePages.tsx # Services/Nearby page
│   │   └── auth0-config.js  # Auth0 configuration
│   └── package.json
├── events_tab/               # Python events scraper
│   ├── backend/
│   │   ├── events_api.py    # Flask API for events
│   │   └── requirements.txt # Python dependencies
│   └── frontend/            # Events UI components
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── dev.db              # SQLite database
├── uploads/                 # Image uploads
├── server.js               # Main Node.js server
├── app.js                  # Database connection test
└── package.json            # Root dependencies
```

## 🚀 Deployment

### Production Considerations
1. **Environment Variables**: Set production API keys
2. **Database**: Consider PostgreSQL for production
3. **File Storage**: Use cloud storage for images
4. **Auth0**: Update URLs for production domain
5. **CORS**: Configure for production domains

### Quick Start Scripts
```bash
# Start everything (Windows)
start-knighthaven-simple.bat

# Start everything (Linux/Mac)
./start-knighthaven.sh

# Check status
./status-knighthaven.sh

# Stop services
./stop-knighthaven.sh
```

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Errors**
   ```bash
   npm run db:generate
   npm run db:push
   ```

2. **Auth0 Authentication Issues**
   - Check callback URLs in Auth0 dashboard
   - Verify domain and client ID in config

3. **Events Not Loading**
   - Ensure Python events API is running on port 5001
   - Check if events_cache.pkl exists

4. **Image Upload Issues**
   - Verify uploads directory exists
   - Check file size limits (5MB max)

5. **Yelp API Errors**
   - Verify Yelp API key in environment variables
   - Check API rate limits

## 📞 Support

For questions, comments, or concerns:
- **Email**: [Contact Team](mailto:thejoshperez@gmail.com,xaviersotoba31@gmail.com,katiefortsas@gmail.com,simonomillan15@gmail.com?subject=KnightHaven Inquiry)

## 🎯 Future Enhancements

- Real-time notifications
- Advanced search and filtering
- Mobile app development
- Enhanced user profiles
- Payment integration
- Event registration system
- Push notifications
- Calendar integration
