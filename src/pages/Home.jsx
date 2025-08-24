import { useState, useEffect } from "react";
import {
    getPopularMovies,
    searchMovies,
    semanticMovieSearch,
} from "../services/api";
import MovieCard from "../components/MovieCard";
import "../css/Home.css";

function Home() {
    const [searchQuery, setSearchQuery] = useState("");
    const [movies, setMovies] = useState([]);
    const [allMovies, setAllMovies] = useState([]); // Store original popular movies
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSearchMode, setIsSearchMode] = useState(false);
    const [plotQuery, setPlotQuery] = useState("");
    const [isAIMode, setIsAIMode] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiProgress, setAiProgress] = useState(0);
    const [aiSectionExpanded, setAiSectionExpanded] = useState(false);
    const [aiSectionLocked, setAiSectionLocked] = useState(false);

    // Load popular movies only once
    useEffect(() => {
        const loadPopularMovies = async () => {
            try {
                const popularMovies = await getPopularMovies();
                setAllMovies(popularMovies);
                setMovies(popularMovies);
            } catch (err) {
                setError(
                    <div className="api-error-message">
                        Couldn't search for Popular Movies
                        <br />
                        <span className="error-subtitle">Please check your connection and try refreshing the page</span>
                    </div>
                );
                console.log(err);
            } finally {
                setLoading(false);
            }
        };

        if (allMovies.length === 0) {
            loadPopularMovies();
        }
    }, []); // Empty dependency - runs only once

    // Listen for reset events from navbar
    useEffect(() => {
        const handleReset = () => {
            setSearchQuery("");
            setIsSearchMode(false);
            setIsAIMode(false);
            setPlotQuery("");
            setAiLoading(false);
            setAiProgress(0);
            setAiSectionExpanded(false);
            setAiSectionLocked(false);
            setError(null);
            setMovies(allMovies);
        };

        window.addEventListener("resetToPopular", handleReset);

        return () => {
            window.removeEventListener("resetToPopular", handleReset);
        };
    }, [allMovies]);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) {
            setMovies(allMovies);
            setIsSearchMode(false);
            setError(null);
            return;
        }
        if (loading) return;

        setLoading(true);
        setIsSearchMode(true);

        try {
            const searchResults = await searchMovies(searchQuery);
            setMovies(searchResults);
            setError(null);
            console.log("Successful search!");
        } catch (err) {
            setError(
                <div className="api-error-message">
                    🔍 Couldn't search for movies right now
                    <br />
                    <span className="error-subtitle">Please try again in a moment</span>
                </div>
            );
            console.log(err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (query.trim() === "") {
            setMovies(allMovies);
            setIsSearchMode(false);
            setError(null);
        }
    };

    // AI search input change
    const handlePlotInputChange = (e) => {
        setPlotQuery(e.target.value);
    };

    // Handle Enter key in plot textarea
    const handlePlotKeyDown = (e) => {
        // Trigger search on Enter (but allow Shift+Enter for new lines)
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Prevent default textarea behavior
            handleAISearch(e);
        }
    };

    // AI-driven search
    const handleAISearch = async (e) => {
        e.preventDefault();
        if (!plotQuery.trim()) {
            setError("Please describe the movie plot you're looking for");
            return;
        }

        setAiLoading(true);
        setAiProgress(0);
        setIsAIMode(true);
        setIsSearchMode(false);
        setSearchQuery("");
        setError(null);

        // Start progress timer
        const progressInterval = setInterval(() => {
            setAiProgress(prev => {
                if (prev >= 90) return prev; // Stop at 90% until actual completion
                const newProgress = prev + Math.random() * 15;
                return Math.min(newProgress, 90); // Never exceed 90% during loading
            });
        }, 200);

        try {
            const aiResults = await semanticMovieSearch(plotQuery);

            // Complete the progress
            setAiProgress(100);
            
            setTimeout(() => {
                if (aiResults.length === 0) {
                    setError(
                        <div className="no-plot-matches">Try rephrasing your plot description</div>
                    );
                    setMovies([]);
                } else {
                    setMovies(aiResults);
                    setError(null);
                }
            }, 300); // Small delay to show 100% completion

        } catch (err) {
            console.error("AI Search Error:", err);
            setError(`AI search failed: ${err.message}`);
            setMovies([]);
        } finally {
            clearInterval(progressInterval);
            setTimeout(() => {
                setAiLoading(false);
                setAiProgress(0);
            }, 500); // Reset after showing completion
        }
    };

    // Handle AI section hover
    const handleAIMouseEnter = () => {
        if (!aiSectionLocked) {
            setAiSectionExpanded(true);
        }
    };

    const handleAIMouseLeave = () => {
        if (!aiSectionLocked) {
            setAiSectionExpanded(false);
        }
    };

    // Handle AI section click to lock/unlock
    const handleAISectionClick = () => {
        setAiSectionLocked(true);
        setAiSectionExpanded(true);
    };

    // Handle clicks outside to unlock and collapse
    useEffect(() => {
        const handleClickOutside = (event) => {
            const aiSection = document.querySelector('.ai-search-container');
            if (aiSection && !aiSection.contains(event.target) && aiSectionLocked) {
                setAiSectionLocked(false);
                setAiSectionExpanded(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [aiSectionLocked]);

    return (
        <div className="Home">
            <form onSubmit={handleSearch} className="search-form">
                <input
                    type="text"
                    placeholder="Search for movies"
                    className="search-input"
                    value={searchQuery}
                    onChange={handleInputChange}
                />
                <button type="submit" className="search-btn">
                    Search
                </button>
            </form>

            {/* AI Plot Search Section - Hover to expand */}
            {!isAIMode && (
                <div 
                    className="ai-search-container"
                    onMouseEnter={handleAIMouseEnter}
                    onMouseLeave={handleAIMouseLeave}
                >
                    <div 
                        className={`ai-search-section ${aiSectionExpanded ? 'expanded' : 'collapsed'}`}
                        onClick={handleAISectionClick}
                    >
                        <div className="ai-search-header">
                            <h3>Having a <span className="plot-glow">plot</span> in your head?</h3>
                            {aiSectionExpanded && (
                                <p>
                                    Share the plot with us, BucketList<sup>ai</sup> will find
                                    you the best matches :)
                                </p>
                            )}
                        </div>

                        {aiSectionExpanded && (
                            <div className="ai-search-form">
                                <textarea
                                    className="plot-input"
                                    placeholder="Example: 'A retired hitman seeks revenge after his puppy is murdered by gangsters...' (Press Enter to search, Shift+Enter for new line)"
                                    value={plotQuery}
                                    onChange={handlePlotInputChange}
                                    onKeyDown={handlePlotKeyDown}
                                    rows="4"
                                />
                                <button
                                    type="button"
                                    className="ai-search-btn"
                                    onClick={handleAISearch}
                                    disabled={aiLoading || !plotQuery.trim()}
                                >
                                    {aiLoading ? "Finding Plotbusters" : "Find my"} <strong>Plotbuster</strong>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Results Section */}
            {isAIMode && (
                <div className="ai-results-header">
                    {aiLoading ? (
                        <div className="ai-progress-container">
                            <h3>Making the <span className="plot-glow">magic</span> happen</h3>
                            <div className="progress-bar">
                                <div 
                                    className="progress-fill" 
                                    style={{ width: `${aiProgress}%` }}
                                ></div>
                            </div>
                            <p className="progress-text">{Math.round(aiProgress)}% complete</p>
                        </div>
                    ) : (
                        <h3>
                            {movies.length > 0 
                                ? (
                                    <>
                                        <strong><span className="plot-glow">{movies.length}</span></strong>
                                        {` ${movies.length > 1 ? 'Plotbusters' : 'Plotbuster'} found :)`}
                                    </>
                                )
                                : `No movies found for the plot :(`
                            }
                        </h3>
                    )}
                    <button
                        onClick={() => {
                            setIsAIMode(false);
                            setPlotQuery("");
                            setMovies(allMovies);
                            setError(null);
                        }}
                        className="back-btn"
                    >
                        Back to Home
                    </button>
                </div>
            )}

            {error && <div className="error-message">{error}</div>}

            {loading && !isAIMode ? (
                <div className="loading-stage">
                    <h3>Picking the best for you
                        <span className="loading-bars">
                            <span></span>
                            <span></span>
                            <span></span>
                            <span></span>
                        </span>
                    </h3>
                </div>
            ) : (
                <div className="movies-grid">
                    {isSearchMode || isAIMode
                        ? movies.map((movie) => <MovieCard movie={movie} key={movie.id} />)
                        : (() => {
                            const filteredMovies = movies.filter((movie) =>
                                movie.title.toLowerCase().includes(searchQuery.toLowerCase())
                            );

                            if (searchQuery.trim() !== "" && filteredMovies.length === 0) {
                                return (
                                    <div className="no-results-on-search">
                                        <h3>No popular matches found :(</h3>
                                        <p>Click on Search to perform an advanced search</p>
                                    </div>
                                );
                            }

                            return filteredMovies.map((movie) => (
                                <MovieCard movie={movie} key={movie.id} />
                            ));
                        })()}
                </div>
            )}
        </div>
    );
}

export default Home;
