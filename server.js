const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');
const path = require('path');
const fs = require('fs');
const Redis = require('redis');

// Build in-memory cache
const memoryCache = new NodeCache({stdTTL: 100, checkperiod: 200});

// Method to store cached data
const cacheResponse = (key, cacheDir, response) => {
    cacheData = {
        headers: response.headers,
        data: response.data,
        status: response.status
    }
    // Write in memory cache
    memoryCache.set(key, cacheData);

    // Write in file cache
    fs.writeFileSync(path.join(cacheDir, key), JSON.stringify(cacheData));
}

const start = (config) => {
    const { origin, port, cacheDir } = config;
    const app = express()

    // Grab all requests
    app.use( async(req, res) => {
        // Check if this request is in memory cache
        const key = req.url;
        if (memoryCache.has(key)) {
            console.log('CACHE HIT');
            return res.status(200).json(memoryCache.get(key).data);
        }

        // Check if this request is in file cache
        const cachePath = path.join(cacheDir, req.url);
        if (fs.existsSync(cachePath)){
            const data = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
            memoryCache.set(key, data);
            console.log('CACHE HIT');
            return res.status(200).json(data);
        }

        try {
            // Fetch from origin
            const targetUrl = origin + key;
            console.log(targetUrl)
            const response = await axios.get(targetUrl);

            cacheResponse(key, cacheDir, response);
            console.log('CACHE MISS')
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