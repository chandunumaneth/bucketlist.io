const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: 'http://localhost:5173', // Your Vite React app URL
    credentials: true
}));
app.use(express.json());

// Import routes
const movieRoutes = require('./routes/movies');

// Use routes
app.use('/api/movies', movieRoutes);

// Basic route
app.get('/', (req, res) => {
    res.json({ message: 'BucketList Movie API is running!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});