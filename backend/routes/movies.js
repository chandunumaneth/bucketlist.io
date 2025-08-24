const express = require('express');
const axios = require('axios');
const router = express.Router();

// API Keys from environment variables (secure!)
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OMDB_API_KEY = process.env.OMDB_API_KEY;

// Get popular movies
router.get('/popular', async (req, res) => {
    try {
        const response = await axios.get(
            `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`
        );
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching popular movies:', error);
        res.status(500).json({ error: 'Failed to fetch popular movies' });
    }
});

// Search movies
router.get('/search', async (req, res) => {
    try {
        const { query } = req.query;
        const response = await axios.get(
            `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&language=en-US&query=${encodeURIComponent(query)}&page=1`
        );
        res.json(response.data);
    } catch (error) {
        console.error('Error searching movies:', error);
        res.status(500).json({ error: 'Failed to search movies' });
    }
});

// Get movie details
router.get('/details/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const response = await axios.get(
            `https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_API_KEY}&append_to_response=external_ids,videos`
        );
        res.json(response.data);
    } catch (error) {
        console.error('Error fetching movie details:', error);
        res.status(500).json({ error: 'Failed to fetch movie details' });
    }
});

// Get external ratings
router.get('/ratings/:imdbId', async (req, res) => {
    try {
        const { imdbId } = req.params;
        const { title, year } = req.query;
        
        console.log('External ratings request:', { imdbId, title, year });
        
        let omdbUrl;
        
        // Try with IMDb ID first (most accurate)
        if (imdbId && imdbId !== 'undefined') {
            omdbUrl = `http://www.omdbapi.com/?apikey=${OMDB_API_KEY}&i=${imdbId}`;
        } else if (title && year) {
            // Fallback to title and year search
            omdbUrl = `http://www.omdbapi.com/?apikey=${OMDB_API_KEY}&t=${encodeURIComponent(title)}&y=${year}`;
        } else {
            return res.status(400).json({ error: 'Either imdbId or title+year required' });
        }
        
        const response = await axios.get(omdbUrl);
        const data = response.data;
        
        console.log('OMDB API response:', data);
        
        if (data.Response === 'True') {
            const ratings = {
                imdb: null,
                rottenTomatoes: null,
                metacritic: null
            };
            
            // Extract IMDb rating
            if (data.imdbRating && data.imdbRating !== 'N/A') {
                ratings.imdb = data.imdbRating;
            }
            
            // Extract ratings from the Ratings array
            if (data.Ratings && Array.isArray(data.Ratings)) {
                data.Ratings.forEach(rating => {
                    if (rating.Source === 'Rotten Tomatoes') {
                        ratings.rottenTomatoes = rating.Value;
                    } else if (rating.Source === 'Metacritic') {
                        ratings.metacritic = rating.Value;
                    }
                });
            }
            
            res.json(ratings);
        } else {
            res.json(null);
        }
    } catch (error) {
        console.error('Error fetching external ratings:', error);
        res.status(500).json({ error: 'Failed to fetch external ratings' });
    }
});

// AI Plot Search - YOUR EXACT COMPLEX LOGIC MOVED HERE
router.post('/ai-search', async (req, res) => {
    try {
        const { plotDescription } = req.body;
        console.log("AI search for:", plotDescription);

        // Add a small delay to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

        // --- Step 1: AI identifies multiple movies that match the description ---
        const multipleMoviesPrompt = `Based on this description: "${plotDescription}"

Provide 12-15 movie titles that match this description or theme. Include:
1. The best/most famous match first
2. All sequels, prequels, and movies in the same franchise/series
3. Other movies with similar themes or plot elements

Format: one movie per line, just the title and year like "Movie Title (Year)"

IMPORTANT: Include ALL movies in a franchise if they match. For example:
- If the plot matches Harry Potter, include ALL Harry Potter movies
- If it matches Marvel/DC themes, include relevant superhero movies from the series
- If it's about talking animals, include sequels like Shrek 2, 3, 4, etc.

Focus on movies that truly match the theme or plot elements described.`;

        const multipleMoviesResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: multipleMoviesPrompt }],
            temperature: 0.2,
            max_tokens: 200
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            }
        });

        const aiMovieList = multipleMoviesResponse.data.choices[0].message?.content?.trim() || "";
        console.log("AI suggested movies:", aiMovieList);

        // Parse the movie titles
        const suggestedTitles = aiMovieList
            .split('\n')
            .map(line => line.trim().replace(/^[-•\d.]\s*/, ''))
            .filter(line => line.length > 2)
            .map(line => line.replace(/\(\d{4}\)/, '').trim())
            .slice(0, 15);

        console.log("Parsed titles:", suggestedTitles);

        // --- Step 2: Search TMDB for all suggested movies + franchise search ---
        const searchPromises = suggestedTitles.map(async (title) => {
            try {
                const response = await axios.get(
                    `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}`
                );
                return response.data.results || [];
            } catch (error) {
                console.error(`Search failed for "${title}":`, error);
                return [];
            }
        });

        // Also search with keywords from the original description
        const keywordSearchPromise = axios.get(
            `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(plotDescription.slice(0, 100))}`
        ).then(res => res.data.results || []).catch(() => []);

        // Search for common franchise keywords if detected
        const franchiseKeywords = [];
        const lowerPlot = plotDescription.toLowerCase();
        if (lowerPlot.includes('magic') || lowerPlot.includes('wizard') || lowerPlot.includes('school')) {
            franchiseKeywords.push('harry potter', 'fantastic beasts');
        }
        if (lowerPlot.includes('superhero') || lowerPlot.includes('marvel') || lowerPlot.includes('hero')) {
            franchiseKeywords.push('avengers', 'iron man', 'spider-man', 'batman', 'superman');
        }
        if (lowerPlot.includes('space') || lowerPlot.includes('galaxy') || lowerPlot.includes('jedi')) {
            franchiseKeywords.push('star wars');
        }
        if (lowerPlot.includes('fast') || lowerPlot.includes('car') || lowerPlot.includes('racing')) {
            franchiseKeywords.push('fast furious');
        }

        const franchiseSearchPromises = franchiseKeywords.map(keyword =>
            axios.get(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(keyword)}`)
                .then(res => res.data.results || [])
                .catch(() => [])
        );

        const allSearchResults = await Promise.all([...searchPromises, keywordSearchPromise, ...franchiseSearchPromises]);
        const candidateMovies = allSearchResults.flat();

        // Remove duplicates and filter quality movies
        const uniqueCandidates = candidateMovies
            .filter((movie, index, self) => index === self.findIndex(m => m.id === movie.id))
            .filter(movie =>
                movie.title &&
                movie.overview &&
                movie.vote_average > 1.5 &&
                movie.poster_path &&
                !movie.title.toLowerCase().includes("untitled")
            )
            .sort((a, b) => b.popularity * b.vote_average - a.popularity * a.vote_average)
            .slice(0, 40);

        console.log(`Found ${uniqueCandidates.length} candidate movies`);

        if (uniqueCandidates.length === 0) {
            return res.json([]);
        }

        // --- Step 3: AI ranks and selects the best matches (including sequels) ---
        const rankingPrompt = `Rank these movies based on how well they match this description: "${plotDescription}"

MOVIES TO RANK:
${uniqueCandidates.map((movie, index) =>
            `${index + 1}. ${movie.title} (${movie.release_date ? new Date(movie.release_date).getFullYear() : 'Unknown'})
    Plot: ${movie.overview}`
        ).join('\n\n')}

Instructions:
- List the numbers of the 10-15 BEST matches in order of relevance
- Put the best match first, followed by other good matches
- INCLUDE ALL SEQUELS AND FRANCHISE MOVIES that match the theme
- For example: if Harry Potter matches, include ALL Harry Potter movies
- If superhero theme matches, include all relevant superhero movies from the same universe
- Only include movies that truly match the theme/description
- Format: just the numbers separated by commas (e.g., "5,12,3,8,1,15,7")`;

        const rankingResponse = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: rankingPrompt }],
            temperature: 0.1,
            max_tokens: 100
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENAI_API_KEY}`
            }
        });

        const aiRanking = rankingResponse.data.choices[0].message?.content?.trim() || "";
        console.log("AI ranking:", aiRanking);

        // Parse the ranking numbers
        const rankedIndices = aiRanking
            .match(/\d+/g)
            ?.map(num => parseInt(num) - 1) // Convert to 0-based index
            .filter(index => index >= 0 && index < uniqueCandidates.length) || [];

        console.log("Ranked indices:", rankedIndices);

        // Return movies in AI-ranked order
        const rankedMovies = rankedIndices
            .map(index => uniqueCandidates[index])
            .filter(movie => movie) // Remove any undefined entries
            .slice(0, 15);

        // If AI ranking didn't work well, fallback to popularity-based ranking
        if (rankedMovies.length < 3) {
            console.log("AI ranking insufficient, using popularity fallback");
            return res.json(uniqueCandidates.slice(0, 12));
        }

        console.log(`Returning ${rankedMovies.length} ranked movies`);
        res.json(rankedMovies);

    } catch (error) {
        console.error("AI movie search failed:", error);

        if (error.message.includes("429")) {
            return res.status(429).json({ error: 'Rate limit exceeded. Please try again in a minute.' });
        }

        res.status(500).json({ error: 'Failed to perform AI search' });
    }
});

module.exports = router;