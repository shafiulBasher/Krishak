const express = require('express');
const router = express.Router();
const axios = require('axios');

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

// Proper User-Agent required by Nominatim usage policy (server-to-server request)
const NOMINATIM_HEADERS = {
  'User-Agent': 'Krishak-Agricultural-App/1.0 (bangladesh-farming-marketplace)',
  'Accept-Language': 'en-US,en;q=0.9,bn;q=0.8',
  'Accept': 'application/json'
};

// @desc    Reverse geocode coordinates to address
// @route   GET /api/geocode/reverse?lat=...&lng=...
// @access  Public
router.get('/reverse', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ message: 'lat and lng query params are required' });
    }

    const response = await axios.get(`${NOMINATIM_BASE}/reverse`, {
      params: {
        format: 'json',
        lat,
        lon: lng,
        'accept-language': 'en,bn',
        zoom: 18,
        addressdetails: 1
      },
      headers: NOMINATIM_HEADERS,
      timeout: 8000
    });

    res.json(response.data);
  } catch (error) {
    console.error('Reverse geocoding proxy error:', error.message);
    res.status(500).json({ message: 'Reverse geocoding failed', error: error.message });
  }
});

// @desc    Search for a location by query string
// @route   GET /api/geocode/search?q=...
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ message: 'q query param is required (min 2 chars)' });
    }

    // Use Photon (photon.komoot.io) — built for autocomplete, no strict rate limiting,
    // serves OpenStreetMap data same as Nominatim.
    // Bangladesh bbox: lon_min, lat_min, lon_max, lat_max
    const response = await axios.get('https://photon.komoot.io/api/', {
      params: {
        q: q.trim(),
        limit: 12,
        lang: 'en',
        bbox: '88.0,20.7,92.7,26.6'  // restrict to Bangladesh bounding box
      },
      headers: NOMINATIM_HEADERS,
      timeout: 8000
    });

    // Normalize Photon's GeoJSON FeatureCollection to Nominatim-style array
    // so the frontend doesn't need to change its parsing logic.
    const results = (response.data.features || []).map((f, i) => {
      const props = f.properties || {};
      const [lon, lat] = f.geometry.coordinates;

      const nameParts = [
        props.name,
        props.street ? (props.housenumber ? `${props.housenumber} ${props.street}` : props.street) : null,
        props.district || props.locality || props.city,
        props.state,
        props.country
      ].filter(Boolean);

      return {
        place_id: String(props.osm_id || i),
        display_name: nameParts.join(', '),
        lat: String(lat),
        lon: String(lon),
        importance: props.importance || 0.5,
        type: props.osm_value || props.type || 'place',
        class: props.osm_key || '',
        address: {
          house_number: props.housenumber,
          road: props.street,
          neighbourhood: props.locality,
          suburb: props.district,
          city: props.city,
          state: props.state,
          country: props.country
        }
      };
    });

    res.json(results);
  } catch (error) {
    console.error('Geocoding search proxy error:', error.message);
    res.status(500).json({ message: 'Geocoding search failed', error: error.message });
  }
});

module.exports = router;
