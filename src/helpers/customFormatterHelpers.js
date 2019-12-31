// Function to get all data necessary in Feature
getFeatureData = (feature, uri) => {
    return {
        description: feature.description,
        keyword: feature.keyword,
        name: feature.name,
        line: feature.location.line,
        id: (feature.name).replace(/\s/g, '-').toLowerCase(),
        tags: getTags(feature),
        uri
    };
};

// Function to get all tags necessary in feature
getTags = (featureOrPickle) => {
    return (featureOrPickle.tags).map(tagData => {
        return {
            name: tagData.name,
            line: tagData.location.line
        }
    })
};

// Function to get data of scenarios
getScenarioData = ({ pickle, scenarioLineToDescriptionMap, getScenarioDescription }) => {
    const description = getScenarioDescription({
        pickle,
        scenarioLineToDescriptionMap
    });
    return {
        description,
        id: (pickle.name).replace(/\s/g, '-').toLowerCase(),
        keyword: 'Scenario',
        line: pickle.locations[0].line,
        name: pickle.name,
        tags: getTags(pickle),
        type: 'scenario'
    };
};

// To put in format DataTable
formatDataTable = (dataTable) => {
    return {
        rows: dataTable.rows.map(row => ({ cells: _.map(row.cells, 'value') }))
    };
};

// To put in format DocString
formatDocString = (docString) => {
    return {
        content: docString.content,
        line: docString.location.line
    };
};

// To format steps arguments
formatStepArguments = (stepArguments, buildStepArgumentIterator) => {
    return stepArguments.map(iterator => {
        iterator = buildStepArgumentIterator({
            dataTable: formatDataTable.bind(this),
            docString: formatDocString.bind(this)
        });
        return iterator;
    })
};

module.exports = { getFeatureData, getTags, getScenarioData, formatDataTable, formatDocString, formatStepArguments };
