export interface WeatherData {
    name: string;
    main: {
      temp: number;
      humidity: number;
      pressure: number;
      feels_like: number;  // Add this line
    };
    weather: Array<{
      description: string;
      icon: string;
      main: string;
    }>;
    sys: {
      country: string;
      state?: string;
      sunrise: number;  // Add this line
      sunset: number;   // Add this line
    };
    wind: {
      speed: number;
      deg: number;  // Add this line
    };
    
  }
  
export interface ForecastData {
  dt: number;
  main: {
    temp: number;
    // Add other properties as needed
  };
  weather: Array<{
    icon: string;
    description: string;
    // Add other properties as needed
  }>;
  // Add other properties as needed
}

export interface CityData {
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
}

export interface UVData {
  lat: number;
  lon: number;
  date_iso: string;
  date: number;
  value: number;
}

export interface GlobalHighlight {
  city: string;
  temp: number;
  icon: string;
  description: string;
}
