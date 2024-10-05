import React from 'react';
import { FaUmbrella, FaSun, FaSnowflake, FaWind, FaTshirt } from 'react-icons/fa';

interface LifestyleRecommendationsProps {
  temperature: number;
  weatherCondition: string;
  windSpeed: number;
}

const LifestyleRecommendations: React.FC<LifestyleRecommendationsProps> = ({ temperature, weatherCondition, windSpeed }) => {
  const getRecommendation = () => {
    const condition = weatherCondition.toLowerCase();

    if (condition.includes('rain') || condition.includes('drizzle')) {
      return { text: "Don't forget your umbrella!", icon: <FaUmbrella /> };
    } else if (condition.includes('snow')) {
      return { text: "Bundle up, it's snowing!", icon: <FaSnowflake /> };
    } else if (condition.includes('clear') && temperature > 25) {
      return { text: "It's a great day for a picnic!", icon: <FaSun /> };
    } else if (windSpeed > 5) {
      return { text: "It's windy! Secure any loose items outside.", icon: <FaWind /> };
    } else if (temperature < 10) {
      return { text: "Remember to wear a jacket!", icon: <FaTshirt /> };
    } else {
      return { text: "Enjoy your day!", icon: <FaSun /> };
    }
  };

  const recommendation = getRecommendation();

  return (
    <div className="bg-white bg-opacity-20 backdrop-blur-md rounded-lg p-4 mt-4 flex items-center">
      <div className="text-3xl mr-4">{recommendation.icon}</div>
      <p className="text-lg">{recommendation.text}</p>
    </div>
  )
};

export default LifestyleRecommendations;