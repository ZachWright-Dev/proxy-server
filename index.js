const { Command } = require('commander');
const fs = require('fs');
const path = require('path');
const server = require('./server');

// Set up commander for CLI args
const program = new Command();

// Builder cache path
const cacheDir = path.join(process.cwd(), '.cache');

// Make sure cache directory is made if not create
if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir);
}

// Program description setup
program
    .name('caching-proxy')
    .description('CLI tool that starts a caching proxy server!')
    .version('1.0.0')

program
    .option('-p --port <number>', '3000')
    .option('-o, --origin <string>')
    .option('--clear-cache', 'clear the cache')

program.parse(process.argv)

const options = program.opts();
console.log(program.opts())

// Handle clear cache
if (options.clearCache) {
    console.log('Clearing cache...');
    const files = fs.readdirSync(cacheDir);
    files.forEach(file => {
        fs.unlinkSync(path.join(cacheDir, file));
    });
    console.log('Cache has been cleared!')
    process.exit(0);
}

if (!options.origin) {
    console.error('You must provide an origin for requests!')
    process.exit(1);
}

server.start(
    {
        port: options.port,
        origin: options.origin,
        cacheDir: cacheDir
    }
)