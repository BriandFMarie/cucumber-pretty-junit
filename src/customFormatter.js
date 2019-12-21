const { Formatter, SummaryFormatter, formatterHelpers } = require('cucumber');


class PrettyFormatter extends Formatter {
    constructor(options) {
        super(options);
        this.colorsEnabled = options.colorsEnabled;
        this.descriptionEnabled = options.descriptionEnabled;

        options.eventBroadcaster.on('test-run-started', (event) => {
            // current time in milliseconds
            this.timeTestRunSarted = Math.trunc(Date.now());
        });

        options.eventBroadcaster.on('test-case-started', (event) => {
            //todo: write feature / scenario name
        });

        options.eventBroadcaster.on('test-step-finished', (event) => {
            //todo: write if it fails or skips or passed with check or notCheck symbol and name of step with color
            // and add it to junit +1 in tests number / failures / skipped
        });

        options.eventBroadcaster.on('test-run-finished', (event) => {
            // current time in milliseconds
            this.timeTestRunFinished = Math.trunc(Date.now());

            // Time spent to run tests
            this.timeSpentToRunTests = Math.trunc(this.timeTestRunFinished - this.timeTestRunSarted);

            //todo: add time finished and add it junit reporter in a file if it exists (if not exists, to create file)
        });
    }
}

module.exports = PrettyFormatter;
