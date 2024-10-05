import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import '../../src/styles/DynamicWallpaper.css';


interface DynamicWallpaperProps {
  weatherCondition: string;
  timeOfDay: 'day' | 'night';
}

const DynamicWallpaper: React.FC<DynamicWallpaperProps> = ({ weatherCondition, timeOfDay }) => {
  const [backgroundClass, setBackgroundClass] = useState('');

  useEffect(() => {
    const getBackgroundClass = () => {
      switch (weatherCondition.toLowerCase()) {
        case 'clear':
          return timeOfDay === 'day' ? 'bg-gradient-to-br from-blue-400 to-blue-200' : 'bg-gradient-to-br from-blue-900 to-purple-900';
        case 'clouds':
          return timeOfDay === 'day' ? 'bg-gradient-to-br from-gray-300 to-blue-200' : 'bg-gradient-to-br from-gray-800 to-blue-900';
        case 'rain':
          return timeOfDay === 'day' ? 'bg-gradient-to-br from-gray-400 to-blue-300' : 'bg-gradient-to-br from-gray-900 to-blue-800';
        case 'snow':
          return timeOfDay === 'day' ? 'bg-gradient-to-br from-gray-100 to-blue-100' : 'bg-gradient-to-br from-gray-700 to-blue-900';
        case 'thunderstorm':
          return 'bg-gradient-to-br from-gray-700 to-purple-900';
        default:
          return timeOfDay === 'day' ? 'bg-gradient-to-br from-blue-300 to-green-200' : 'bg-gradient-to-br from-blue-800 to-purple-900';
      }
    };

    setBackgroundClass(getBackgroundClass());
  }, [weatherCondition, timeOfDay]);

  return (
    <motion.div
      className={`fixed inset-0 ${backgroundClass}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      {weatherCondition.toLowerCase() === 'rain' && (
        <div className="rain">
          {[...Array(100)].map((_, i) => (
            <div key={i} className="drop" style={{left: `${Math.random() * 100}%`, animationDuration: `${0.5 + Math.random() * 0.5}s`, animationDelay: `${Math.random() * 2}s`}} />
          ))}
        </div>
      )}
      {weatherCondition.toLowerCase() === 'snow' && (
        <div className="snow">
          {[...Array(100)].map((_, i) => (
            <div key={i} className="snowflake" style={{left: `${Math.random() * 100}%`, animationDuration: `${5 + Math.random() * 10}s`, animationDelay: `${Math.random() * 5}s`}} />
          ))}
        </div>
      )}
      {weatherCondition.toLowerCase() === 'clouds' && (
        <div className="clouds">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="cloud" style={{top: `${Math.random() * 40}%`, left: `${-10 - Math.random() * 10}%`, animationDuration: `${20 + Math.random() * 10}s`, animationDelay: `${Math.random() * 5}s`}} />
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default DynamicWallpaper;
