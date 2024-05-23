const pino = require('pino');
const transport = pino.transport({
    targets: [
        {
            target: "pino/file",
            options: { destination: `${__dirname}/app.log` },
        },
        {
            target: "pino/file", // logs to standard output
        },
    ],
});

module.exports = pino({
    level: process.env.PINO_LOG_LEVEL || 'debug',
    /*
    cannot use formatters if logging to file and terminal
    formatters: {
        level: (label) => {
            return { level: label.toUpperCase()};
        },
    },*/
    timestamp: pino.stdTimeFunctions.isoTime,
    },
    transport
);