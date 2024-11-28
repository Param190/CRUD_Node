const pool = require('../config/database');


function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

const schoolController = {
    async addSchool(req, res) {
        try {
            const { name, address, latitude, longitude } = req.body;

            if (!name || !address || !latitude || !longitude) {
                return res.status(400).json({ error: 'All fields are required' });
            }

            if (isNaN(latitude) || isNaN(longitude)) {
                return res.status(400).json({ error: 'Invalid coordinates' });
            }

            const [result] = await pool.execute(
                'INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)',
                [name, address, latitude, longitude]
            );

            res.status(201).json({
                message: 'School added successfully',
                schoolId: result.insertId
            });
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    async listSchools(req, res) {
        try {
            const { latitude, longitude } = req.query;

            if (!latitude || !longitude) {
                return res.status(400).json({ error: 'Coordinates are required' });
            }

            const [schools] = await pool.execute('SELECT * FROM schools');

            const schoolsWithDistance = schools.map(school => ({
                ...school,
                distance: calculateDistance(
                    parseFloat(latitude),
                    parseFloat(longitude),
                    school.latitude,
                    school.longitude
                )
            }));

            schoolsWithDistance.sort((a, b) => a.distance - b.distance);

            res.json(schoolsWithDistance);
        } catch (error) {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

module.exports = schoolController;