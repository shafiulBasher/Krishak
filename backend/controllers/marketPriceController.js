const MarketPrice = require('../models/MarketPrice');
const { BANGLADESH_DISTRICTS, STANDARD_CROPS, isValidDistrict, isValidCrop, getCropsByCategory } = require('../utils/bangladeshData');

// @desc    Get current market prices with filtering
// @route   GET /api/market-prices
// @access  Public
exports.getCurrentPrices = async (req, res) => {
  try {
    const { district, category, cropName, limit = 50 } = req.query;
    
    const query = { isActive: true };
    
    if (district) {
      if (!isValidDistrict(district)) {
        return res.status(400).json({ message: 'Invalid district name' });
      }
      query.district = district;
    }
    
    if (category && category !== 'All') {
      query.category = category;
    }
    
    if (cropName) {
      query.cropName = cropName;
    }
    
    const prices = await MarketPrice.find(query)
      .select('cropName district category currentPrice priceHistory unit lastUpdated')
      .sort({ cropName: 1 })
      .limit(parseInt(limit));
    
    res.json({
      count: prices.length,
      data: prices
    });
  } catch (error) {
    console.error('Error fetching market prices:', error);
    res.status(500).json({ message: 'Error fetching market prices', error: error.message });
  }
};

// @desc    Get price history for specific crop and district
// @route   GET /api/market-prices/history/:cropName/:district
// @access  Public
exports.getPriceHistory = async (req, res) => {
  try {
    const { cropName, district } = req.params;
    const { days = 30 } = req.query;
    
    if (!isValidDistrict(district)) {
      return res.status(400).json({ message: 'Invalid district name' });
    }
    
    const priceData = await MarketPrice.findOne({ 
      cropName, 
      district,
      isActive: true
    });
    
    if (!priceData) {
      return res.status(404).json({ 
        message: `No price data found for ${cropName} in ${district}` 
      });
    }
    
    // Get last N days of history
    const historyLimit = parseInt(days);
    const history = priceData.priceHistory.slice(-historyLimit);
    
    res.json({
      cropName: priceData.cropName,
      district: priceData.district,
      category: priceData.category,
      unit: priceData.unit,
      currentPrice: priceData.currentPrice,
      history: history,
      trend: priceData.weeklyTrend,
      margin: priceData.marginPercentage
    });
  } catch (error) {
    console.error('Error fetching price history:', error);
    res.status(500).json({ message: 'Error fetching price history', error: error.message });
  }
};

// @desc    Add or update market price (Admin only)
// @route   POST /api/market-prices
// @access  Private/Admin
exports.addOrUpdatePrice = async (req, res) => {
  try {
    console.log('📥 Received price update request:', req.body);
    console.log('👤 User:', req.user.email, 'Role:', req.user.role);
    
    const { cropName, district, category, wholesale, retail, source } = req.body;
    
    // Validation
    if (!cropName || !district || !category || !wholesale || !retail) {
      return res.status(400).json({ 
        message: 'Please provide cropName, district, category, wholesale, and retail prices' 
      });
    }
    
    if (!isValidDistrict(district)) {
      return res.status(400).json({ message: 'Invalid district name' });
    }
    
    if (!isValidCrop(cropName)) {
      return res.status(400).json({ 
        message: 'Invalid crop name. Please select from standard crop list' 
      });
    }
    
    if (retail <= wholesale) {
      return res.status(400).json({ 
        message: 'Retail price must be greater than wholesale price' 
      });
    }
    
    if (wholesale < 0 || retail < 0 || wholesale > 10000 || retail > 10000) {
      return res.status(400).json({ 
        message: 'Prices must be between 0 and 10000' 
      });
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find existing entry
    let priceEntry = await MarketPrice.findOne({ cropName, district });
    
    if (priceEntry) {
      // Update existing entry
      const lastHistoryDate = priceEntry.priceHistory.length > 0 
        ? new Date(priceEntry.priceHistory[priceEntry.priceHistory.length - 1].date)
        : null;
      
      // Check if we already have entry for today
      if (lastHistoryDate && lastHistoryDate.toDateString() === today.toDateString()) {
        // Update today's entry
        priceEntry.priceHistory[priceEntry.priceHistory.length - 1] = {
          date: today,
          wholesale,
          retail,
          source: source || 'Manual Entry'
        };
      } else {
        // Add new entry to history
        priceEntry.priceHistory.push({
          date: today,
          wholesale,
          retail,
          source: source || 'Manual Entry'
        });
      }
      
      // Update current price
      priceEntry.currentPrice = {
        wholesale,
        retail,
        date: today,
        source: source || 'Manual Entry'
      };
      
      await priceEntry.save();
      
      console.log('✅ Price updated successfully for', cropName, 'in', district);
      
      res.json({
        message: 'Market price updated successfully',
        data: priceEntry
      });
    } else {
      // Create new entry
      const cropInfo = STANDARD_CROPS.find(c => c.name === cropName);
      
      priceEntry = await MarketPrice.create({
        cropName,
        district,
        category,
        unit: cropInfo?.unit || 'kg',
        currentPrice: {
          wholesale,
          retail,
          date: today,
          source: source || 'Manual Entry'
        },
        priceHistory: [{
          date: today,
          wholesale,
          retail,
          source: source || 'Manual Entry'
        }]
      });
            console.log('✅ New price entry created for', cropName, 'in', district);
            res.status(201).json({
        message: 'Market price created successfully',
        data: priceEntry
      });
    }
  } catch (error) {
    console.error('Error adding/updating market price:', error);
    res.status(500).json({ message: 'Error adding/updating market price', error: error.message });
  }
};

// @desc    Get list of districts with price data
// @route   GET /api/market-prices/districts
// @access  Public
exports.getActiveDistricts = async (req, res) => {
  try {
    const districts = await MarketPrice.distinct('district', { isActive: true });
    res.json({ 
      count: districts.length,
      districts: districts.sort() 
    });
  } catch (error) {
    console.error('Error fetching districts:', error);
    res.status(500).json({ message: 'Error fetching districts', error: error.message });
  }
};

// @desc    Get list of crops with price data
// @route   GET /api/market-prices/crops
// @access  Public
exports.getActiveCrops = async (req, res) => {
  try {
    const { district } = req.query;
    const query = { isActive: true };
    
    if (district) {
      if (!isValidDistrict(district)) {
        return res.status(400).json({ message: 'Invalid district name' });
      }
      query.district = district;
    }
    
    const crops = await MarketPrice.find(query)
      .select('cropName category')
      .sort({ cropName: 1 });
    
    // Group by category
    const groupedCrops = crops.reduce((acc, crop) => {
      if (!acc[crop.category]) {
        acc[crop.category] = [];
      }
      if (!acc[crop.category].includes(crop.cropName)) {
        acc[crop.category].push(crop.cropName);
      }
      return acc;
    }, {});
    
    res.json({
      count: crops.length,
      byCategory: groupedCrops,
      allCrops: [...new Set(crops.map(c => c.cropName))].sort()
    });
  } catch (error) {
    console.error('Error fetching crops:', error);
    res.status(500).json({ message: 'Error fetching crops', error: error.message });
  }
};

// @desc    Delete market price entry (Admin only)
// @route   DELETE /api/market-prices/:id
// @access  Private/Admin
exports.deleteMarketPrice = async (req, res) => {
  try {
    const priceEntry = await MarketPrice.findById(req.params.id);
    
    if (!priceEntry) {
      return res.status(404).json({ message: 'Market price not found' });
    }
    
    await priceEntry.deleteOne();
    
    res.json({ message: 'Market price deleted successfully' });
  } catch (error) {
    console.error('Error deleting market price:', error);
    res.status(500).json({ message: 'Error deleting market price', error: error.message });
  }
};

// @desc    Get market price statistics
// @route   GET /api/market-prices/stats
// @access  Public
exports.getMarketStats = async (req, res) => {
  try {
    const totalCrops = await MarketPrice.countDocuments({ isActive: true });
    const totalDistricts = await MarketPrice.distinct('district', { isActive: true });
    
    // Get most recent update
    const latestUpdate = await MarketPrice.findOne({ isActive: true })
      .sort({ lastUpdated: -1 })
      .select('lastUpdated');
    
    // Get price ranges by category
    const priceRanges = await MarketPrice.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          minWholesale: { $min: '$currentPrice.wholesale' },
          maxWholesale: { $max: '$currentPrice.wholesale' },
          avgWholesale: { $avg: '$currentPrice.wholesale' },
          minRetail: { $min: '$currentPrice.retail' },
          maxRetail: { $max: '$currentPrice.retail' },
          avgRetail: { $avg: '$currentPrice.retail' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      totalCrops,
      totalDistricts: totalDistricts.length,
      lastUpdated: latestUpdate?.lastUpdated,
      priceRangesByCategory: priceRanges
    });
  } catch (error) {
    console.error('Error fetching market stats:', error);
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
};
