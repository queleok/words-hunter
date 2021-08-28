module.exports = {
    launch: {
        headless: process.env.HEADLESS !== 'false',
        slowMo: process.env.SLOWMO ? process.env.SWLOMO : 0,
        devtools: true,
        dumpio: true
    },
    server: {
        command: 'npm run serve'
    }
}
