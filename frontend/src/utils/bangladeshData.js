// Bangladesh Districts and Standard Crops (Frontend copy)

export const BANGLADESH_DISTRICTS = [
  // Dhaka Division
  'Dhaka', 'Faridpur', 'Gazipur', 'Gopalganj', 'Kishoreganj', 'Madaripur', 
  'Manikganj', 'Munshiganj', 'Narayanganj', 'Narsingdi', 'Rajbari', 'Shariatpur', 'Tangail',
  
  // Chittagong Division
  'Chittagong', 'Bandarban', 'Brahmanbaria', 'Chandpur', 'Comilla', 'Cox\'s Bazar', 
  'Feni', 'Khagrachari', 'Lakshmipur', 'Noakhali', 'Rangamati',
  
  // Rajshahi Division
  'Rajshahi', 'Bogura', 'Joypurhat', 'Naogaon', 'Natore', 'Chapainawabganj', 
  'Pabna', 'Sirajganj',
  
  // Khulna Division
  'Khulna', 'Bagerhat', 'Chuadanga', 'Jessore', 'Jhenaidah', 'Kushtia', 
  'Magura', 'Meherpur', 'Narail', 'Satkhira',
  
  // Sylhet Division
  'Sylhet', 'Habiganj', 'Moulvibazar', 'Sunamganj',
  
  // Barisal Division
  'Barisal', 'Barguna', 'Bhola', 'Jhalokathi', 'Patuakhali', 'Pirojpur',
  
  // Rangpur Division
  'Rangpur', 'Dinajpur', 'Gaibandha', 'Kurigram', 'Lalmonirhat', 
  'Nilphamari', 'Panchagarh', 'Thakurgaon',
  
  // Mymensingh Division
  'Mymensingh', 'Jamalpur', 'Netrokona', 'Sherpur'
];

export const CROP_CATEGORIES = ['All', 'Grains', 'Vegetables', 'Fruits', 'Spices', 'Cash Crops'];

export const STANDARD_CROPS = [
  // Grains
  { name: 'Rice (Boro)', category: 'Grains', bengali: 'ধান (বোরো)', unit: 'kg' },
  { name: 'Rice (Aman)', category: 'Grains', bengali: 'ধান (আমন)', unit: 'kg' },
  { name: 'Rice (Aus)', category: 'Grains', bengali: 'ধান (আউশ)', unit: 'kg' },
  { name: 'Wheat', category: 'Grains', bengali: 'গম', unit: 'kg' },
  { name: 'Maize', category: 'Grains', bengali: 'ভুট্টা', unit: 'kg' },
  { name: 'Lentil (Masur)', category: 'Grains', bengali: 'মসুর ডাল', unit: 'kg' },
  { name: 'Chickpea', category: 'Grains', bengali: 'ছোলা', unit: 'kg' },
  
  // Vegetables
  { name: 'Potato', category: 'Vegetables', bengali: 'আলু', unit: 'kg' },
  { name: 'Onion', category: 'Vegetables', bengali: 'পেঁয়াজ', unit: 'kg' },
  { name: 'Tomato', category: 'Vegetables', bengali: 'টমেটো', unit: 'kg' },
  { name: 'Brinjal', category: 'Vegetables', bengali: 'বেগুন', unit: 'kg' },
  { name: 'Cabbage', category: 'Vegetables', bengali: 'বাঁধাকপি', unit: 'kg' },
  { name: 'Cauliflower', category: 'Vegetables', bengali: 'ফুলকপি', unit: 'kg' },
  { name: 'Carrot', category: 'Vegetables', bengali: 'গাজর', unit: 'kg' },
  { name: 'Radish', category: 'Vegetables', bengali: 'মুলা', unit: 'kg' },
  { name: 'Cucumber', category: 'Vegetables', bengali: 'শসা', unit: 'kg' },
  { name: 'Pumpkin', category: 'Vegetables', bengali: 'কুমড়া', unit: 'kg' },
  { name: 'Bitter Gourd', category: 'Vegetables', bengali: 'করলা', unit: 'kg' },
  { name: 'Green Chili', category: 'Vegetables', bengali: 'কাঁচা মরিচ', unit: 'kg' },
  { name: 'Garlic', category: 'Vegetables', bengali: 'রসুন', unit: 'kg' },
  { name: 'Ginger', category: 'Vegetables', bengali: 'আদা', unit: 'kg' },
  
  // Fruits
  { name: 'Mango', category: 'Fruits', bengali: 'আম', unit: 'kg' },
  { name: 'Banana', category: 'Fruits', bengali: 'কলা', unit: 'dozen' },
  { name: 'Papaya', category: 'Fruits', bengali: 'পেঁপে', unit: 'kg' },
  { name: 'Guava', category: 'Fruits', bengali: 'পেয়ারা', unit: 'kg' },
  { name: 'Jackfruit', category: 'Fruits', bengali: 'কাঁঠাল', unit: 'kg' },
  { name: 'Watermelon', category: 'Fruits', bengali: 'তরমুজ', unit: 'kg' },
  
  // Spices & Cash Crops
  { name: 'Jute', category: 'Cash Crops', bengali: 'পাট', unit: 'kg' },
  { name: 'Sugarcane', category: 'Cash Crops', bengali: 'আখ', unit: 'kg' },
  { name: 'Turmeric', category: 'Spices', bengali: 'হলুদ', unit: 'kg' },
  { name: 'Coriander', category: 'Spices', bengali: 'ধনিয়া', unit: 'kg' }
];

export const getCropsByCategory = (category) => {
  if (category === 'All') {
    return STANDARD_CROPS;
  }
  return STANDARD_CROPS.filter(crop => crop.category === category);
};

export const getCropInfo = (cropName) => {
  return STANDARD_CROPS.find(crop => crop.name === cropName);
};

// Format currency
export const formatPrice = (price) => {
  return `৳${price.toFixed(0)}`;
};

// Calculate price trend
export const calculateTrend = (current, previous) => {
  if (!previous || previous === 0) return { direction: 'stable', percentage: 0 };
  
  const change = ((current - previous) / previous) * 100;
  
  if (change > 2) return { direction: 'rising', percentage: change.toFixed(1) };
  if (change < -2) return { direction: 'falling', percentage: Math.abs(change).toFixed(1) };
  return { direction: 'stable', percentage: Math.abs(change).toFixed(1) };
};

// Get trend icon and color
export const getTrendIndicator = (trend) => {
  switch (trend) {
    case 'rising':
      return { icon: '↑', color: 'text-red-600', bgColor: 'bg-red-50' };
    case 'falling':
      return { icon: '↓', color: 'text-green-600', bgColor: 'bg-green-50' };
    default:
      return { icon: '→', color: 'text-gray-600', bgColor: 'bg-gray-50' };
  }
};

// Format date
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'short',
    year: 'numeric'
  });
};

// Get days since update
export const getDaysSinceUpdate = (dateString) => {
  if (!dateString) return 'Unknown';
  
  const lastUpdate = new Date(dateString);
  const now = new Date();
  
  // Reset time to midnight for accurate day comparison
  const lastUpdateMidnight = new Date(lastUpdate.getFullYear(), lastUpdate.getMonth(), lastUpdate.getDate());
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const diffTime = nowMidnight - lastUpdateMidnight;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 0) return 'Today'; // Handle future dates
  return `${diffDays} days ago`;
};
