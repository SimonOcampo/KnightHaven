import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Setup for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Yelp API key
const YELP_API_KEY = "HdrTZK8pCbDhmD5OTilm9wGBE3XwucLoQ3Qt7NOX__3fYYrG4CttZ9psfNc8m4kfNG32-V0jd1cnLG19fd0hoxqipBoAyFumq8_aeSW2tQGaUd_OolJhxkRa7lb8aHYx";

// Google Maps API key
const GOOGLE_MAPS_API_KEY = "AIzaSyCnaJrYTNJF3bYR8ECfBxhcqgCD4JYVRl8";

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'KnightHaven API is running!',
    timestamp: new Date().toISOString()
  });
});

// Database stats endpoint
app.get('/api/stats', async (req, res) => {
  try {
    const userCount = await prisma.user.count();
    const postCount = await prisma.post.count();
    const listingCount = await prisma.listing.count();
    const serviceCount = await prisma.service.count();
    
    res.json({
      users: userCount,
      posts: postCount,
      listings: listingCount,
      services: serviceCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Users endpoints
app.get('/api/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        displayName: true,
        isUcfVerified: true,
        createdAt: true
      }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { email, passwordHash, displayName, isUcfVerified } = req.body;
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName,
        isUcfVerified: isUcfVerified || false
      }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Posts endpoints
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            isUcfVerified: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

app.post('/api/posts', async (req, res) => {
  try {
    const { title, content, authorId } = req.body;
    const post = await prisma.post.create({
      data: {
        title,
        content,
        authorId: parseInt(authorId)
      },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            isUcfVerified: true
          }
        }
      }
    });
    res.json(post);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Listings endpoints
app.get('/api/listings', async (req, res) => {
  try {
    const listings = await prisma.listing.findMany({
      where: { isActive: true },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            email: true,
            isUcfVerified: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(listings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

app.post('/api/listings', upload.single('image'), async (req, res) => {
  try {
    const { title, description, price, category, authorId, authorEmail, authorName, phoneNumber } = req.body;
    
    // Handle image upload
    let imageUrl = null;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    }
    
    // Find or create a user for this listing
    let userId;
    if (authorId) {
      // Use provided authorId if it exists
      userId = parseInt(authorId);
    } else {
      // Create a default user or find existing one
      let user = await prisma.user.findFirst({
        where: { email: authorEmail || 'default@ucf.edu' }
      });
      
      if (!user) {
        // Create a default user
        user = await prisma.user.create({
          data: {
            email: authorEmail || 'default@ucf.edu',
            passwordHash: 'default', // This is just for demo purposes
            displayName: authorName || 'KnightHaven User',
            isUcfVerified: authorEmail?.includes('@ucf.edu') || false
          }
        });
      }
      userId = user.id;
    }
    
    const listing = await prisma.listing.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        category,
        phoneNumber: phoneNumber || null,
        imageUrl: imageUrl,
        authorId: userId
      },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            email: true,
            isUcfVerified: true
          }
        }
      }
    });
    res.json(listing);
  } catch (error) {
    console.error('Error creating listing:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Failed to create listing', 
      details: error.message,
      stack: error.stack 
    });
  }
});

// Delete listing endpoint
app.delete('/api/listings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userEmail } = req.body;
    const listingId = parseInt(id);
    
    // Check if user email is provided
    if (!userEmail) {
      return res.status(400).json({ error: 'User email is required to delete listing' });
    }
    
    // Check if listing exists
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { author: true }
    });
    
    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    
    // Check if user owns the listing
    if (listing.author.email !== userEmail) {
      return res.status(403).json({ error: 'You can only delete your own listings' });
    }
    
    // Delete the listing
    await prisma.listing.delete({
      where: { id: listingId }
    });
    
    res.json({ 
      success: true, 
      message: 'Listing deleted successfully',
      deletedListing: {
        id: listing.id,
        title: listing.title
      }
    });
  } catch (error) {
    console.error('Error deleting listing:', error);
    res.status(500).json({ 
      error: 'Failed to delete listing', 
      details: error.message 
    });
  }
});

// Services endpoints
app.get('/api/services', async (req, res) => {
  try {
    const services = await prisma.service.findMany({
      where: { isActive: true },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            isUcfVerified: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(services);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

app.post('/api/services', async (req, res) => {
  try {
    const { title, description, category, authorId } = req.body;
    const service = await prisma.service.create({
      data: {
        title,
        description,
        category,
        authorId: parseInt(authorId)
      },
      include: {
        author: {
          select: {
            id: true,
            displayName: true,
            isUcfVerified: true
          }
        }
      }
    });
    res.json(service);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create service' });
  }
});

// Places endpoint - fetch stored Yelp data
app.get('/api/places', async (req, res) => {
  try {
    const places = await prisma.place.findMany({
      orderBy: { rating: 'desc' }
    });
    res.json(places);
  } catch (error) {
    console.error('Error fetching places:', error);
    res.status(500).json({ error: 'Failed to fetch places' });
  }
});

// Google Maps API key endpoint
app.get('/api/maps-key', (req, res) => {
  res.json({ apiKey: GOOGLE_MAPS_API_KEY });
});

// Refresh data endpoint - always fetches fresh data
app.get('/api/refresh-data', async (req, res) => {
  console.log(`🔄 REFRESH: Fetching fresh Yelp data for UCF area`);
  
  try {
    // Check if data already exists
    const existingPlaces = await prisma.place.count();
    if (existingPlaces > 0) {
      console.log(`📊 Database already contains ${existingPlaces} places. Skipping fetch.`);
      return res.json({ 
        message: `Data already exists with ${existingPlaces} places`, 
        stored: existingPlaces, 
        total: existingPlaces,
        categories: ["Already loaded"]
      });
    }

    console.log("🔄 No existing data found. Fetching fresh data...");

    // UCF Student Union coordinates: 28.6024° N, 81.2001° W
    const ucfLatitude = 28.6024;
    const ucfLongitude = -81.2001;
    const radiusInMeters = 16093; // 10 miles = 16093 meters
    
    // Business categories to search for
    const businessCategories = [
      'restaurants',
      'mechanics',
      'autoservice', 
      'nail salon',
      'barber shop',
      'hair salon',
      'spa',
      'coffee shops'
    ];
    
    // Use all 8 categories for maximum variety
    const selectedCategories = businessCategories;
    console.log(`🎯 Using all ${selectedCategories.length} categories for maximum variety`);
    
    // Fetch data from each category separately and combine results
    let allBusinesses = [];
    const businessesPerCategory = Math.ceil(50 / selectedCategories.length); // Distribute 50 businesses across categories
    
    for (const category of selectedCategories) {
      try {
        console.log(`🔍 Fetching ${businessesPerCategory} businesses for category: ${category}`);
        const yelpUrl = `https://api.yelp.com/v3/businesses/search?term=${category}&latitude=${ucfLatitude}&longitude=${ucfLongitude}&radius=${radiusInMeters}&limit=${businessesPerCategory}`;
        console.log(`📡 Yelp API URL: ${yelpUrl}`);
        
        const resp = await fetch(yelpUrl, {
          headers: {
            Authorization: `Bearer ${YELP_API_KEY}`,
          },
        });
        
        console.log(`📊 Yelp API Response Status for ${category}: ${resp.status}`);
        const data = await resp.json();
        
        if (data.businesses && data.businesses.length > 0) {
          console.log(`🏢 Found ${data.businesses.length} businesses for ${category}`);
          allBusinesses = allBusinesses.concat(data.businesses);
        } else {
          console.log(`❌ No businesses found for category: ${category}`);
        }
      } catch (categoryError) {
        console.error(`❌ Error fetching data for category ${category}:`, categoryError);
      }
    }

    // Shuffle all businesses to randomize the order
    allBusinesses = allBusinesses.sort(() => Math.random() - 0.5);
    console.log(`🎲 Total businesses collected: ${allBusinesses.length}`);

    let storedCount = 0;
    // Store each business in SQLite through Prisma (MAX 50)
    for (const b of allBusinesses) {
      if (storedCount >= 50) {
        console.log(`⚠️ Reached limit of 50 businesses, stopping storage`);
        break;
      }
      
      try {
        console.log(`💾 Storing business: ${b.name} (ID: ${b.id}) - Category: ${b.categories?.[0]?.title || 'Unknown'}`);
        await prisma.place.create({
          data: {
            yelpId: b.id,
            name: b.name,
            description: b.categories?.[0]?.title || "Business",
            rating: b.rating,
            reviewCount: b.review_count,
            address: b.location?.address1 || "",
            city: b.location?.city || "",
            latitude: b.coordinates?.latitude,
            longitude: b.coordinates?.longitude,
          },
        });
        storedCount++;
        console.log(`✅ Successfully stored: ${b.name}`);
      } catch (dbError) {
        console.error(`❌ Error storing business ${b.name}:`, dbError);
      }
    }

    console.log(`🎉 Total stored: ${storedCount} out of ${allBusinesses.length} businesses`);
    res.json({ 
      message: `Successfully refreshed data`, 
      stored: storedCount, 
      total: allBusinesses.length,
      categories: selectedCategories
    });

  } catch (error) {
    console.error("❌ Error in refresh-data endpoint:", error);
    res.status(500).json({ error: "Failed to refresh data" });
  }
});

// Note: Yelp API functionality is handled by /api/refresh-data endpoint above



// Start server
app.listen(PORT, () => {
  console.log(`🚀 KnightHaven API Server running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📊 Stats: http://localhost:${PORT}/api/stats`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔌 Closing database connection...');
  await prisma.$disconnect();
  process.exit(0);
});
