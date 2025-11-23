const express = require('express');
const router = express.Router();
const db = require('../database');
const fs = require('fs');
const path = require('path');

// Load and Parse CSV Data
const csvPath = path.join(__dirname, '../data/tesla_models.csv');
let TESLA_SPECS = [];

try {
    const csvData = fs.readFileSync(csvPath, 'utf8');
    const lines = csvData.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    TESLA_SPECS = lines.slice(1).filter(l => l.trim()).map(line => {
        const values = line.split(',');
        const car = {};
        headers.forEach((header, index) => {
            car[header] = values[index]?.trim();
        });
        return car;
    });
    console.log(`Loaded ${TESLA_SPECS.length} Tesla models from CSV`);
} catch (error) {
    console.error('Failed to load Tesla CSV data:', error);
}

// Static Asset Mapping (Images & IDs)
const VEHICLE_ASSETS = {
    'Model 3': { id: 'model3', image: 'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Homepage-Model-3-Desktop-LHD.png' },
    'Model Y': { id: 'modelY', image: 'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Homepage-Model-Y-Desktop-Global.png' },
    'Model S': { id: 'modelS', image: 'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Homepage-Model-S-Desktop-LHD.png' },
    'Model X': { id: 'modelX', image: 'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Homepage-Model-X-Desktop-LHD.png' },
    'Cybertruck': { id: 'cybertruck', image: 'https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Homepage-Cybertruck-Desktop.png' }
};

// Advanced Scoring Algorithm
function calculateAdvancedRecommendations(preferences) {
    console.log('Calculating recommendations for:', preferences);

    const scores = TESLA_SPECS.map(car => {
        let score = 0;
        const reasons = [];
        const details = [];

        // 1. Budget Scoring (30 points)
        const price = parseInt(car['Base Price (USD)']);
        const maxBudget = preferences.priceRange.max;

        if (price <= maxBudget) {
            score += 30;
            if (price < maxBudget * 0.8) score += 5;
            reasons.push(`Fits budget: $${price.toLocaleString()}`);
        } else if (price <= maxBudget * 1.15) {
            score += 15;
            details.push(`Slightly over budget ($${price.toLocaleString()})`);
        } else {
            score -= 30;
        }

        // 2. Range & Commute (25 points)
        const range = parseInt(car['Range (mi)']);
        const dailyNeeded = preferences.dailyDistance;
        if (range >= dailyNeeded * 2.5) {
            score += 25;
            reasons.push(`Range (${range}mi) covers daily drive`);
        } else if (range >= dailyNeeded * 1.5) {
            score += 15;
        } else {
            score -= 10;
        }

        // 3. Performance Preference (20 points)
        const accel = parseFloat(car['0-60 mph (sec)']);
        if (preferences.priority === 'Performance') {
            if (accel < 3.5) {
                score += 20;
                reasons.push(`Supercar acceleration: ${accel}s`);
            } else if (accel < 4.5) {
                score += 10;
            }
        } else if (preferences.priority === 'Efficiency') {
            const efficiency = parseInt(car['Energy Consumption (Wh/mi)']);
            if (efficiency < 260) {
                score += 20;
                reasons.push(`High efficiency: ${efficiency} Wh/mi`);
            }
        }

        // 4. Utility & Passengers (15 points)
        const seatsStr = car['Seating Capacity'] || '5';
        const maxSeats = seatsStr.includes('/') ?
            Math.max(...seatsStr.split('/').map(Number)) :
            parseInt(seatsStr);

        if (maxSeats >= preferences.passengers) {
            score += 15;
            if (maxSeats > 5 && preferences.passengers > 5) {
                reasons.push(`Seats ${maxSeats} people`);
            }
        } else {
            score -= 50;
        }

        // 5. Style Match (10 points)
        if (preferences.style !== 'Any' && car['Body Type'] === preferences.style) {
            score += 10;
            reasons.push(`Matches ${car['Body Type']} style`);
        }

        // 6. Special Features (Bonus)
        if (preferences.towing && car['Towing Capacity (lbs)'] !== 'NA') {
            score += 15;
            reasons.push(`Towing: ${car['Towing Capacity (lbs)']} lbs`);
        }

        // 7. FSD Capability
        if (preferences.fsd && car['Full Self Driving Available'] === 'Yes') {
            score += 10;
            reasons.push('Full Self Driving Hardware Ready');
        }

        // Map to frontend format
        const asset = VEHICLE_ASSETS[car.Model];
        return {
            id: asset?.id || 'unknown',
            name: `${car.Model} ${car.Variant}`,
            basePrice: price,
            range: `${range} mi`,
            acceleration: `${accel}s`,
            topSpeed: `${car['Top Speed (mph)']} mph`,
            image: asset?.image,
            score: Math.max(0, score),
            reasons: reasons.slice(0, 3),
            details: details,
            specs: {
                drive: car['Drive Type'],
                seats: car['Seating Capacity'],
                warranty: car['Warranty Years/Warranty Miles']
            }
        };
    });

    return scores.sort((a, b) => b.score - a.score).slice(0, 3);
}

// Track analytics
function trackAnalytics(preferences) {
    try {
        db.trackAnalytics('style', preferences.style);
        db.trackAnalytics('passengers', preferences.passengers.toString());
        db.trackAnalytics('priority', preferences.priority || 'Balanced');
    } catch (error) {
        console.error('Analytics tracking error:', error);
    }
}

// POST /api/recommend - Get recommendations
router.post('/recommend', (req, res) => {
    try {
        const { preferences } = req.body;

        if (!preferences) {
            return res.status(400).json({ message: 'Preferences required' });
        }

        const recommendations = calculateAdvancedRecommendations(preferences);
        trackAnalytics(preferences);

        if (req.session && req.session.userId) {
            db.saveRecommendation({
                userId: req.session.userId,
                preferences,
                recommendations: recommendations.map(r => ({
                    vehicleId: r.id,
                    vehicleName: r.name,
                    score: r.score,
                    reasons: r.reasons,
                    estimatedPrice: r.basePrice
                }))
            });
        }

        res.json({
            success: true,
            recommendations
        });

    } catch (error) {
        console.error('Recommendation error:', error);
        res.status(500).json({ message: 'Failed to generate recommendations' });
    }
});

// GET /api/recommend/history
router.get('/recommend/history', (req, res) => {
    try {
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ message: 'Not authenticated' });
        }
        const history = db.findRecommendationsByUserId(req.session.userId).slice(0, 10);
        res.json({ success: true, history });
    } catch (error) {
        console.error('History fetch error:', error);
        res.status(500).json({ message: 'Failed to fetch history' });
    }
});

// GET /api/recommend/analytics
router.get('/recommend/analytics', (req, res) => {
    try {
        const analytics = db.getAnalytics().slice(0, 20);
        res.json({ success: true, analytics });
    } catch (error) {
        console.error('Analytics fetch error:', error);
        res.status(500).json({ message: 'Failed to fetch analytics' });
    }
});

module.exports = router;
