module.exports = {
    launch: {
        headless: process.env.HEADLESS !== 'false' ? "new" : false,
        slowMo: process.env.SLOWMO ? process.env.SLOWMO : 0,
        devtools: true,
        dumpio: true
    },
    server: {
        command: 'npm run serve',
        port: 8080
    }
}
