const xml = require('xml'),
    MULTIPLIER=(require("cucumber/lib/time").MILLISECONDS_IN_NANOSECOND||1);

// Function to use to convert data in XML
let toXML = function (options) {
    this.result = [];
    this.withPackage = options.withPackage;
    this.propertiesInTestcase = options.propertiesInTestcase;
    this.processFeature = options.scenarioAsStep ? this.scenarioAsTestCase : this.stepAsTestCase;
};

// To generate XML in a <testsuites> with all data inside
toXML.prototype.generateXML = function(features) {
    this.result = [];

    features.forEach(feature => this.processFeature(feature, this.result));
    return xml({ testsuites: this.result }, {indent:'  ', declaration: { encoding: 'UTF-8' }});
};

toXML.prototype.scenarioAsTestCase = function(feature, result) {
    let attr = { name: feature.id };
    let testSuite = [ { } ];
    testSuite[0]._attr = Object.assign({}, attr, feature.elements.forEach((elements) => {
        elements.reduce((acc, element) => {
            if (element.type === 'scenario') {
                let rez = this.processScenarioAsTestCase(element, testSuite, feature);
                acc = {
                    tests:acc.tests + rez.tests,
                    failures:acc.failures + rez.failures,
                    skipped:acc.skipped + rez.skipped,
                    errors:acc.errors + rez.errors,
                    time:acc.time + rez.time
                };
            }
            return acc;
        }, { tests:0, failures:0, skipped:0, errors:0, time:0 });

        }));
    testSuite[0]._attr.time = testSuite[0]._attr.time.toFixed(3);
    result.push({ testsuite: testSuite });
    return testSuite._attr;
};

toXML.prototype.processScenarioAsTestCase = function(feature, result) {

    let rez = { tests:1, failures:0, skipped:0, errors:0, time:0 };
    if (feature.type !== "scenario") {
        return rez;
    }
    let testCase = [{ _attr: { classname: feature.id, name: feature.name } }];
    if (feature.tags && this.propertiesInTestcase) {
        testCase.push({ properties: feature.tags.map(tag => {
                return {
                    property: [
                        {
                            _attr: {
                                name: "tag",
                                value: tag.name
                            }
                        }

                    ]
                }})
        });
    }

    feature.steps.every(step => {
        rez.time += (step.result.duration || 0) / (1000 * MULTIPLIER);
        rez.failures += step.result.failures;
        rez.skipped += step.result.skipped;
        rez.errors += step.result.errors;

        if (step.hidden && !(step.result.errors || step.result.failures || step.result.hidden)) {
            return true;
        }

        if (step.result.failures) {
            testCase.push({ failure: [{_attr: { message: step.result.error_name }}, step.result.error_message ] });
            return false;
        }
        if (step.result.errors) {
            testCase.push({ error: [{ _attr: { message: step.result.error_name }}, step.result.error_message ] });
            return false;
        }
        if (step.result.skipped) {
            testCase.push({ skipped: [] });
            return false;
        }
        return true;
    });
    testCase[0]._attr.time = rez.time.toFixed(3);
    result.push({ testcase: testCase });
    return rez;
};

toXML.prototype.stepAsTestCase = function(feature, result, parent) { // eslint-disable-line no-unused-vars

    let attr = feature.elements.forEach((elements) => {
        elements.reduce((acc, element) => {
            if (element.type === 'scenario') {
                let rez = this.processScenarioAsTestSuite(element, result, feature);
                acc = {
                    tests: acc.tests + rez.tests,
                    failures: acc.failures + rez.failures,
                    skipped: acc.skipped + rez.skipped,
                    errors: acc.errors + rez.errors,
                    time: acc.time + rez.time
                };
            }
            return acc;
        }, { tests:0, failures:0, skipped:0, errors:0, time:0 });
    });
    return attr;
};

toXML.prototype.processScenarioAsTestSuite = function(feature, result, parent) {

    let rez = { tests:0, failures:0, skipped:0, errors:0, time:0 };
    if (feature.type !== "scenario") {
        return rez;
    }
    let testSuite = [{ _attr: { name: `${parent.id};${feature.id}` } }];
    if (feature.tags) {
        testSuite.push({ properties: feature.tags.map(tag => {
            return {
                property: [
                    {
                        _attr: {
                            name: "tag",
                            value: tag.name
                        }
                    }

                ]
            }})
        });
    }
    if (this.withPackage) {
        rez.package = (feature.id).replace(/\s/g, '-').toLowerCase();
    }
    feature.steps.every(step => {
        rez.time += (step.result.duration || 0) / (1000 * MULTIPLIER);
        rez.failures += step.result.failures;
        rez.skipped += step.result.skipped;
        rez.errors += step.result.errors;

        if (step.hidden && !(step.result.errors || step.result.failures || step.result.hidden)) {
            return true;
        }
        rez.tests += 1;
        let name = step.name || `${feature.name} ${step.keyword.trim().toLowerCase()}`;
        let id = name.replace(/\s/g, '-').toLowerCase();
        let testCase = [{ _attr: { classname: id, name: name, time: ((step.result.duration || 0) / (1000 * MULTIPLIER)).toFixed(3) } }];
        testSuite.push({ testcase: testCase });
        if (step.result.failures) {
            testCase.push({ failure: [{ _attr: { message: step.result.error_name } }, step.result.error_message ] });
            return true;
        }
        if (step.result.errors) {
            testCase.push({ error: [{ _attr: { message: step.result.error_name } }, step.result.error_message ] });
            return true;
        }
        if (step.result.skipped) {
            testCase.push({ skipped: [] });
            return true;
        }
        return true;
    });
    testSuite[0]._attr = Object.assign({}, testSuite[0]._attr, rez);
    result.push({ testsuite: testSuite });
    return rez;
};


module.exports = toXML;
