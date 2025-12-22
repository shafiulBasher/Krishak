// Bangladesh Districts and Standard Crops for Market Intelligence

// All 64 districts of Bangladesh
exports.BANGLADESH_DISTRICTS = [
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

// Standard crops for market price tracking
exports.STANDARD_CROPS = [
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

// Get crops by category
exports.getCropsByCategory = (category) => {
  if (category === 'All') {
    return exports.STANDARD_CROPS;
  }
  return exports.STANDARD_CROPS.filter(crop => crop.category === category);
};

// Get unique categories
exports.getCropCategories = () => {
  const categories = [...new Set(exports.STANDARD_CROPS.map(crop => crop.category))];
  return ['All', ...categories];
};

// Validate district name
exports.isValidDistrict = (district) => {
  return exports.BANGLADESH_DISTRICTS.includes(district);
};

// Validate crop name
exports.isValidCrop = (cropName) => {
  return exports.STANDARD_CROPS.some(crop => crop.name === cropName);
};

// Get crop info
exports.getCropInfo = (cropName) => {
  return exports.STANDARD_CROPS.find(crop => crop.name === cropName);
};
