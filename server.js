const express = require('express');
const axios = require('axios');
const Redis = require('redis');

// Build in-memory cache
const DEFAULT_EXPIRATION = 100;
const redisClient = Redis.createClient();

const start = async (config) => {
    const { origin, port } = config;
    const app = express()
    await redisClient.connect();
    // Grab all requests
    app.use(async(req, res) => {
        // Check if this request is in memory cache
        const key = req.url;
        if (await redisClient.exists(key)) {
            const data = JSON.parse(await redisClient.get(key));
            res.header('X-Cache', 'CACHE HIT');
            return res.status(200).json(data);
        }

        try {
            // Fetch from origin
            const targetUrl = origin + key;
            const response = await axios.get(targetUrl);
            await redisClient.set(key, JSON.stringify(response.data), { EX: DEFAULT_EXPIRATION });
            res.header('X-Cache','CACHE MISS')
            return res.status(200).json(response.data);
        } catch(e) {
            console.error('Fetch error: ', e.message);
            return res.status(500).send('Internal Server Error');
        }
    });

    app.listen(port, () => {
        console.log(`Listening on port ${port}`);
    })
}

module.exports = { start }