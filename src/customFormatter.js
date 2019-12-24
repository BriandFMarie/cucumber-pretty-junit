const { Formatter, SummaryFormatter, formatterHelpers, Status } = require('cucumber'),
    { GherkinDocumentParser, PickleParser, formatLocation} = formatterHelpers,
    { getStepLineToKeywordMap, getScenarioLineToDescriptionMap } = GherkinDocumentParser,
    { getScenarioDescription, getStepLineToPickledStepMap, getStepKeyword } = PickleParser,
    { buildStepArgumentIterator } = require('cucumber/lib/step_arguments'),
    { format } = require('assertion-error-formatter'),
    toXMl = require('./xmlGenerator'),
    helpers = require('./helpers/customFormatterHelpers'),
    clc = require('cli-color');


//TODO: summary result for each step if it fails, passed, ambigous or skip...
//TODO: XML reporter
//TODO: Refacto
//TODO: Tests ??



// Custom Formatter
class CustomFormatter extends Formatter {
    constructor(options) {
        super(options);
        this.colorsEnabled = options.colorsEnabled;
        this.descriptionEnabled = options.descriptionEnabled;
        this._toXML = new toXMl(options);

        // Event to know when tests are started
        options.eventBroadcaster.on('test-run-started', (event) => {
            // to get current time in milliseconds
            this.timeTestRunSarted = Math.trunc(Date.now());
        });


        // Event to know when a scenario is started
        options.eventBroadcaster.on('test-case-started', (event) => {
            const groupedTestCaseAttempts = {};

            let allTestCaseAttempts = this.eventDataCollector.getTestCaseAttempts(event),
                gherkinDocument,
                featureData,
                stepLineToKeywordMap,
                scenarioLineToDescriptionMap,
                scenarioData;

            allTestCaseAttempts.forEach(testCaseAttempt => {
                if (!testCaseAttempt.result.retried) {
                    const { uri } = testCaseAttempt.testCase.sourceLocation;
                    if (!groupedTestCaseAttempts[uri]) {
                        groupedTestCaseAttempts[uri] = [];
                    }
                    groupedTestCaseAttempts[uri].push(testCaseAttempt);
                }
            });

            Object.keys(groupedTestCaseAttempts).map(uri => {
                gherkinDocument = this.eventDataCollector.gherkinDocumentMap[uri];
                featureData = helpers.getFeatureData(gherkinDocument.feature, uri);
                stepLineToKeywordMap = getStepLineToKeywordMap(gherkinDocument);
                scenarioLineToDescriptionMap = getScenarioLineToDescriptionMap(gherkinDocument);
            });

            // To get just scenario data and to get pickle with some data
            Object.values(groupedTestCaseAttempts).map(testCaseAttempts => {
                return testCaseAttempts.map(testCaseAttempt => {
                    const {pickle} = testCaseAttempt;
                        scenarioData = helpers.getScenarioData({
                            featureId: featureData.id,
                            pickle,
                            scenarioLineToDescriptionMap,
                            getScenarioDescription
                        });

                        const stepLineToPickledStepMap = getStepLineToPickledStepMap(pickle);

                    let isBeforeHook = true;
                    scenarioData.steps = testCaseAttempt.testCase.steps.map((testStep, index) => {
                        isBeforeHook = isBeforeHook && !testStep.sourceLocation;
                        return this.getStepData({
                            isBeforeHook,
                            stepLineToKeywordMap,
                            stepLineToPickledStepMap,
                            testStep,
                            testStepAttachments: testCaseAttempt.stepAttachments[index],
                            testStepResult: testCaseAttempt.stepResults[index]
                        });
                    });
                });
            });

               if(featureData.keyword === 'Feature' && featureData.name && !featureData.description) {
                   return console.log("\n", featureData.keyword, "\n", featureData.name, "\n", "Scenario: ", scenarioData.name);
               }  else if (featureData.keyword === 'Feature' && featureData.name && featureData.description) {
                   return console.log("\n", featureData.keyword, "\n", featureData.name, "\n", featureData.description, "\n", "Scenario: ", scenarioData.name)
               } else {
                   //Do nothing
               }
        });

        // Event to know when a step is finished
        options.eventBroadcaster.on('test-step-finished', (event) => {
            const groupedTestCaseAttempts = {};

            let allTestCaseAttempts = this.eventDataCollector.getTestCaseAttempts(event),
                gherkinDocument,
                featureData,
                stepLineToKeywordMap,
                scenarioLineToDescriptionMap,
                scenarioData;

            allTestCaseAttempts.forEach(testCaseAttempt => {
                if (!testCaseAttempt.result.retried) {
                    const { uri } = testCaseAttempt.testCase.sourceLocation;
                    if (!groupedTestCaseAttempts[uri]) {
                        groupedTestCaseAttempts[uri] = [];
                    }
                    groupedTestCaseAttempts[uri].push(testCaseAttempt);
                }
            });

            Object.keys(groupedTestCaseAttempts).map(uri => {
                gherkinDocument = this.eventDataCollector.gherkinDocumentMap[uri];
                featureData = helpers.getFeatureData(gherkinDocument.feature, uri);
                stepLineToKeywordMap = getStepLineToKeywordMap(gherkinDocument);
                scenarioLineToDescriptionMap = getScenarioLineToDescriptionMap(gherkinDocument);
            });

            // To get just scenario data and to get pickle with some data
            Object.values(groupedTestCaseAttempts).map(testCaseAttempts => {
                return testCaseAttempts.map(testCaseAttempt => {
                    const {pickle} = testCaseAttempt;
                    scenarioData = helpers.getScenarioData({
                        featureId: featureData.id,
                        pickle,
                        scenarioLineToDescriptionMap,
                        getScenarioDescription
                    });

                    const stepLineToPickledStepMap = getStepLineToPickledStepMap(pickle);

                    let isBeforeHook = true;
                    scenarioData.steps = testCaseAttempt.testCase.steps.map((testStep, index) => {
                        isBeforeHook = isBeforeHook && !testStep.sourceLocation;
                        return this.getStepData({
                            isBeforeHook,
                            stepLineToKeywordMap,
                            stepLineToPickledStepMap,
                            testStep,
                            testStepAttachments: testCaseAttempt.stepAttachments[index],
                            testStepResult: testCaseAttempt.stepResults[index]
                        });
                    });
                });
            });

            (scenarioData.steps).forEach(step => {
                switch(step.result.status) {
                    case 'passed':
                        return console.log(clc.green("✓", step.keyword + step.name));
                    case 'skipped':
                        return console.log(clc.blue("-", step.keyword + step.name));
                    case 'failed' || 'undefined':
                        return console.log(clc.red('X', step.keyword + step.name));
                    case 'ambiguous':
                        return console.log(clc.yellow('?', step.keyword + step.name));
                    default:
                        break;
                }
            })


        });

        // Event to know when tests are finished
        options.eventBroadcaster.on('test-run-finished', (event) => {
            const groupedTestCaseAttempts = {};
            let allTestCaseAttempts = this.eventDataCollector.getTestCaseAttempts(),
                gherkinDocument,
                featureData,
                stepLineToKeywordMap,
                scenarioLineToDescriptionMap;

            // To put all test in another array to handle results
            allTestCaseAttempts.forEach(testCaseAttempt => {
                if (!testCaseAttempt.result.retried) {
                    const { uri } = testCaseAttempt.testCase.sourceLocation;
                    if (!groupedTestCaseAttempts[uri]) {
                        groupedTestCaseAttempts[uri] = [];
                    }
                    groupedTestCaseAttempts[uri].push(testCaseAttempt);
                }
            });

            // To get just scenario with uri and to get gherkinDocument with some data
            const features = Object.keys(groupedTestCaseAttempts).map(uri => {
                    gherkinDocument = this.eventDataCollector.gherkinDocumentMap[uri];
                    featureData = helpers.getFeatureData(gherkinDocument.feature, uri);
                    stepLineToKeywordMap = getStepLineToKeywordMap(gherkinDocument);
                    scenarioLineToDescriptionMap = getScenarioLineToDescriptionMap(gherkinDocument);

                    // To get just scenario data and to get pickle with some data
                    featureData.elements = Object.values(groupedTestCaseAttempts).map(testCaseAttempts => {
                        return testCaseAttempts.map(testCaseAttempt => {
                            const {pickle} = testCaseAttempt,
                                scenarioData = helpers.getScenarioData({
                                    featureId: featureData.id,
                                    pickle,
                                    scenarioLineToDescriptionMap,
                                    getScenarioDescription
                                }),

                                stepLineToPickledStepMap = getStepLineToPickledStepMap(pickle);

                            let isBeforeHook = true;
                            scenarioData.steps = testCaseAttempt.testCase.steps.map((testStep, index) => {
                                isBeforeHook = isBeforeHook && !testStep.sourceLocation;
                                return this.getStepData({
                                    isBeforeHook,
                                    stepLineToKeywordMap,
                                    stepLineToPickledStepMap,
                                    testStep,
                                    testStepAttachments: testCaseAttempt.stepAttachments[index],
                                    testStepResult: testCaseAttempt.stepResults[index]
                                });
                            });
                            return scenarioData;
                        });
                    });
                    return featureData;
                });

            // to get current time in milliseconds
            this.timeTestRunFinished = Math.trunc(Date.now());

            // Time spent to run tests
            this.timeSpentToRunTests = Math.trunc(this.timeTestRunFinished - this.timeTestRunSarted);

            // To show time spent for running tests
            console.log(helpers.resultInMilliSeconds(this.timeSpentToRunTests));

            //todo: file if it exists (if not exists, to create file)
            //todo: to override millisecond already write by cucumber and to remove dot in beginning of Given

            return this.log(this._toXML.generateXML(features));
        });
    }

    // To get data of each steps
    getStepData({ isBeforeHook, stepLineToKeywordMap, stepLineToPickledStepMap, testStep, testStepAttachments, testStepResult }) {
        const data = {};

        if (testStep.sourceLocation) {
            const { line } = testStep.sourceLocation;
            const pickleStep = stepLineToPickledStepMap[line];
            data.arguments = helpers.formatStepArguments(pickleStep.arguments, buildStepArgumentIterator);
            data.keyword = getStepKeyword({pickleStep, stepLineToKeywordMap});
            data.line = line;
            data.name = pickleStep.text;
        } else {
            data.keyword = isBeforeHook ? 'Before' : 'After';
            data.hidden = true;
        }
        if (testStep.actionLocation) {
            data.match = { location: formatLocation(testStep.actionLocation) };
        }
        data.result = { failures: 0, errors: 0, skipped: 0 };
        if (testStepResult) {
            const {exception, status} = testStepResult;
            data.result = Object.assign({}, {status}, data.result);
            if (testStepResult.duration) {
                data.result.duration = testStepResult.duration;
            }
            switch(status) {
                case Status.PASSED:
                    break;
                case Status.FAILED:
                    if (testStep.sourceLocation) {
                        data.result.failures += 1;
                    }
                    else {
                        data.result.errors += 1;
                    }
                    if (exception) {
                        let {name} = exception;
                        data.result.error_name = name;
                        data.result.error_message = format(exception);
                    }
                    break;
                case Status.PENDING:
                    data.result.failures += 1;
                    data.result.error_message = 'Pending';
                    data.result.error_name = 'Pending';
                    break;
                case Status.UNDEFINED:
                    data.result.failures += 1;
                    data.result.error_message = `Undefined step. Implement with the following snippet:\n  ${data.keyword.trim()}(/^${data.name}$/, function(callback) {\n      // Write code here that turns the phrase above into concrete actions\n      callback(null, 'pending');\n  });`;
                    data.result.error_name = data.result.error_message.split("\n").shift();
                    break;
                case Status.SKIPPED:
                    data.result.skipped += 1;
                    break;
                case Status.AMBIGUOUS:
                    data.result.errors += 1;
                    if (exception) {
                        data.result.error_message = format(exception);
                    }
                    break;
                default:
                    break;
            }
        }
        if (Object.keys(testStepAttachments).length > 0) {
            data.embeddings = testStepAttachments.map(
                attachment => ({
                    data: attachment.data,
                    mime_type: attachment.media.type
                })
            );
        }
        return data;
    }
}

module.exports = CustomFormatter;
