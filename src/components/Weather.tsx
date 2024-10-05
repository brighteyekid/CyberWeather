import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { WeatherData, ForecastData, CityData, GlobalHighlight } from '../types/WeatherTypes';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHistory, FaLocationArrow, FaTimes, FaWind, FaCloud, FaSun, FaMoon, FaExclamationTriangle, FaGlobeAmericas } from 'react-icons/fa';
import DynamicWallpaper from './DynamicWallpaper';
import '../../src/styles/DynamicWallpaper.css';
import LifestyleRecommendations from './LifestyleRecommendations';

const Weather: React.FC = () => {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<ForecastData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showLocationPrompt, setShowLocationPrompt] = useState(true);
  const [showHistory, setShowHistory] = useState(true);
  const [timeOfDay, setTimeOfDay] = useState<'day' | 'night'>('day');
  const [suggestions, setSuggestions] = useState<CityData[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [globalHighlights, setGlobalHighlights] = useState<GlobalHighlight[]>([]);

  const API_KEY = process.env.REACT_APP_OPENWEATHERMAP_API_KEY;

  useEffect(() => {
    const savedHistory = localStorage.getItem('searchHistory');
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }

    const hasPromptedLocation = localStorage.getItem('locationPrompted');
    if (hasPromptedLocation === 'true') {
      setShowLocationPrompt(false);
    }

    const updateTimeOfDay = () => {
      const hour = new Date().getHours();
      setTimeOfDay(hour >= 6 && hour < 18 ? 'day' : 'night');
    };

    updateTimeOfDay();
    const interval = setInterval(updateTimeOfDay, 60000); // Update every minute

    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    // Hide splash screen after 3 seconds
    const timer = setTimeout(() => setShowSplash(false), 3000);

    const fetchGlobalHighlights = async () => {
      try {
        const cities = ['New York', 'London', 'Tokyo', 'Sydney', 'Rio de Janeiro', 'Dubai'];
        const highlights = await Promise.all(
          cities.map(async (city) => {
            const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`);
            return {
              city: response.data.name,
              temp: Math.round(response.data.main.temp),
              icon: response.data.weather[0].icon,
              description: response.data.weather[0].description
            };
          })
        );
        setGlobalHighlights(highlights);
      } catch (error) {
        console.error('Error fetching global highlights:', error);
      }
    };

    fetchGlobalHighlights();

    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
      clearTimeout(timer);
    };
  }, [API_KEY]);

  const handleLocationAccess = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords;
          fetchWeatherByCoords(latitude, longitude);
          localStorage.setItem('locationPrompted', 'true');
          setShowLocationPrompt(false);
        },
        error => {
          console.error("Error getting location:", error);
          setError("Unable to get your location. Please enter a city manually.");
          localStorage.setItem('locationPrompted', 'true');
          setShowLocationPrompt(false);
        }
      );
    } else {
      setError("Geolocation is not supported by your browser. Please enter a city manually.");
      localStorage.setItem('locationPrompted', 'true');
      setShowLocationPrompt(false);
    }
  };

  const fetchWeatherByCoords = async (lat: number, lon: number) => {
    setLoading(true);
    setError(null);
    try {
      if (!API_KEY) {
        throw new Error('API key is not set');
      }
      const weatherResponse = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
      const forecastResponse = await axios.get(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
      
      setWeather(weatherResponse.data);
      setCity(weatherResponse.data.name);
      
      const dailyForecast = forecastResponse.data.list.filter((item: any, index: number) => index % 8 === 0).slice(0, 5);
      setForecast(dailyForecast);

      updateSearchHistory(weatherResponse.data.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weather data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchWeather = async (city: string) => {
    setLoading(true);
    setError(null);
    try {
      if (!API_KEY) {
        throw new Error('API key is not set');
      }
      const weatherResponse = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`);
      const forecastResponse = await axios.get(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`);
      
      setWeather(weatherResponse.data);
      
      const dailyForecast = forecastResponse.data.list.filter((item: any, index: number) => index % 8 === 0).slice(0, 5);
      setForecast(dailyForecast);

      updateSearchHistory(city);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response) {
        if (err.response.status === 404) {
          setError(`City "${city}" not found. Please check the spelling and try again.`);
        } else {
          setError(`An error occurred: ${err.response.data.message}`);
        }
      } else {
        setError('An unexpected error occurred. Please try again later.');
      }
      setWeather(null);
      setForecast([]);
    } finally {
      setLoading(false);
    }
  };

  const updateSearchHistory = (city: string) => {
    const updatedHistory = [city, ...searchHistory.filter(item => item !== city)].slice(0, 5);
    setSearchHistory(updatedHistory);
    localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (city) {
      fetchWeather(city);
    }
  };

  const handleHistoryClick = (historyCity: string) => {
    setCity(historyCity);
    fetchWeather(historyCity);
  };

  const toggleHistory = () => {
    setShowHistory(!showHistory);
  };

  const fetchSuggestions = async (input: string) => {
    if (input.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await axios.get(
        `http://api.openweathermap.org/geo/1.0/direct?q=${input}&limit=5&appid=${API_KEY}`
      );
      setSuggestions(response.data);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCity(value);
    fetchSuggestions(value);
  };

  const handleSuggestionClick = (suggestion: CityData) => {
    setCity(`${suggestion.name}, ${suggestion.country}`);
    setShowSuggestions(false);
    fetchWeather(`${suggestion.name}, ${suggestion.country}`);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-2 sm:p-4 md:p-6 relative">
      <DynamicWallpaper
        weatherCondition={weather ? weather.weather[0].main : 'Clear'}
        timeOfDay={timeOfDay}
      />

      <AnimatePresence>
        {showSplash && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="text-white text-center"
            >
              <FaGlobeAmericas className="text-6xl mb-4 mx-auto" />
              <h1 className="text-4xl font-bold mb-2">Weather App</h1>
              <p className="text-xl">Explore the world's weather</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 3 }}
        className="bg-white bg-opacity-20 backdrop-blur-lg rounded-3xl shadow-xl p-4 sm:p-6 md:p-8 w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl text-white relative overflow-hidden"
      >
        <h1 className="text-3xl font-bold mb-6 text-center">Weather Explorer</h1>

        {showLocationPrompt && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center rounded-3xl z-10"
          >
            <div className="bg-white text-gray-800 p-4 sm:p-6 md:p-8 rounded-2xl max-w-xs sm:max-w-sm md:max-w-md text-center">
              <FaLocationArrow className="text-4xl sm:text-5xl text-blue-500 mx-auto mb-2 sm:mb-4" />
              <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4">Allow Location Access?</h2>
              <p className="mb-4 sm:mb-6 text-sm sm:text-base">We'd like to use your location to provide local weather information. This helps us give you the most accurate forecast for your area.</p>
              <div className="flex justify-center space-x-2 sm:space-x-4">
                <button
                  onClick={handleLocationAccess}
                  className="px-4 sm:px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition duration-300 text-sm sm:text-base font-semibold"
                >
                  Allow
                </button>
                <button
                  onClick={() => {
                    setShowLocationPrompt(false);
                    localStorage.setItem('locationPrompted', 'true');
                  }}
                  className="px-4 sm:px-6 py-2 bg-gray-300 text-gray-700 rounded-full hover:bg-gray-400 transition duration-300 text-sm sm:text-base font-semibold"
                >
                  Deny
                </button>
              </div>
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSearch} className="mb-4 sm:mb-6 relative z-10">
          <div className="flex flex-col">
            <div className="relative">
              <input
                type="text"
                value={city}
                onChange={handleInputChange}
                placeholder="Enter city"
                className="w-full px-3 sm:px-4 py-2 text-gray-800 bg-white bg-opacity-50 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm sm:text-base"
              />
              <button
                type="submit"
                className="absolute right-0 top-0 bottom-0 px-4 sm:px-6 bg-blue-500 rounded-r-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-300 text-sm sm:text-base font-semibold"
              >
                Search
              </button>
            </div>
            <AnimatePresence>
              {showSuggestions && suggestions.length > 0 && (
                <motion.div
                  ref={suggestionRef}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-0 right-0 mt-1 bg-white bg-opacity-80 backdrop-blur-md border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
                >
                  {suggestions.map((suggestion, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="px-4 py-2 hover:bg-blue-100 cursor-pointer text-gray-800 transition-colors duration-200"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion.name}, {suggestion.country}
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </form>

        {searchHistory.length > 0 && (
          <div className="mb-4 sm:mb-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg sm:text-xl font-semibold">Recent Searches:</h3>
              <button
                onClick={toggleHistory}
                className="text-white hover:text-blue-200 transition duration-300"
              >
                {showHistory ? <FaTimes /> : <FaHistory />}
              </button>
            </div>
            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex flex-wrap gap-2 overflow-hidden"
                >
                  {searchHistory.map((historyCity, index) => (
                    <motion.button
                      key={index}
                      onClick={() => handleHistoryClick(historyCity)}
                      className="px-2 sm:px-3 py-1 bg-white bg-opacity-30 rounded-full hover:bg-opacity-40 transition duration-300 text-xs sm:text-sm"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                    >
                      {historyCity}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-8"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="inline-block w-16 h-16 border-4 border-white border-t-transparent rounded-full"
            />
            <p className="mt-4 text-xl">Loading weather data...</p>
          </motion.div>
        )}

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-500 bg-opacity-80 text-white p-4 rounded-lg mb-4 flex items-start"
            >
              <FaExclamationTriangle className="flex-shrink-0 mr-3 mt-1" />
              <p>{error}</p>
            </motion.div>
          )}
        </AnimatePresence>
        
        {!weather && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 3.5 }}
          >
            <h2 className="text-2xl font-semibold mb-4">Global Weather Highlights</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {globalHighlights.map((highlight, index) => (
                <motion.div
                  key={highlight.city}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 3.5 + index * 0.1 }}
                  className="bg-white bg-opacity-20 rounded-lg p-3 text-center cursor-pointer hover:bg-opacity-30 transition-all duration-300"
                  onClick={() => fetchWeather(highlight.city)}
                >
                  <img
                    src={`http://openweathermap.org/img/wn/${highlight.icon}.png`}
                    alt={highlight.description}
                    className="w-12 h-12 mx-auto mb-2"
                  />
                  <h3 className="font-semibold">{highlight.city}</h3>
                  <p className="text-2xl font-bold">{highlight.temp}°C</p>
                  <p className="text-sm">{highlight.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {weather && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center relative z-10"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4">{weather.name}</h2>
            <div className="flex justify-center items-center mb-2 sm:mb-4">
              <img
                src={`http://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
                alt="weather icon"
                className="w-16 h-16 sm:w-20 sm:h-20"
              />
              <p className="text-4xl sm:text-5xl md:text-6xl font-bold ml-2 sm:ml-4">
                {Math.round(weather.main.temp)}°C
              </p>
            </div>
            <p className="text-lg sm:text-xl md:text-2xl capitalize mb-2 sm:mb-4">{weather.weather[0].description}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
              <div className="bg-white bg-opacity-20 rounded-lg p-2 sm:p-3 flex flex-col items-center">
                <FaWind className="text-2xl mb-1" />
                <p className="text-sm sm:text-base opacity-80">Wind</p>
                <p className="text-lg sm:text-xl font-semibold">{weather.wind.speed} m/s</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-2 sm:p-3 flex flex-col items-center">
                <FaCloud className="text-2xl mb-1" />
                <p className="text-sm sm:text-base opacity-80">Humidity</p>
                <p className="text-lg sm:text-xl font-semibold">{weather.main.humidity}%</p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-2 sm:p-3 flex flex-col items-center">
                <FaSun className="text-2xl mb-1" />
                <p className="text-sm sm:text-base opacity-80">Sunrise</p>
                <p className="text-lg sm:text-xl font-semibold">
                  {new Date(weather.sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-2 sm:p-3 flex flex-col items-center">
                <FaMoon className="text-2xl mb-1" />
                <p className="text-sm sm:text-base opacity-80">Sunset</p>
                <p className="text-lg sm:text-xl font-semibold">
                  {new Date(weather.sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {forecast.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h3 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4">5-Day Forecast</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-4">
              {forecast.map((day, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="bg-white bg-opacity-20 rounded-lg p-2 sm:p-3 text-center hover:bg-opacity-30 transition-all duration-300 transform hover:scale-105"
                >
                  <p className="text-sm sm:text-base font-semibold">{new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' })}</p>
                  <img
                    src={`http://openweathermap.org/img/wn/${day.weather[0].icon}.png`}
                    alt="weather icon"
                    className="w-8 h-8 sm:w-10 sm:h-10 mx-auto"
                  />
                  <p className="text-sm sm:text-base font-bold">{Math.round(day.main.temp)}°C</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {weather && (
          <LifestyleRecommendations
            temperature={weather.main.temp}
            weatherCondition={weather.weather[0].main}
            windSpeed={weather.wind.speed}
          />
        )}
      </motion.div>
    </div>
  );
};

export default Weather;