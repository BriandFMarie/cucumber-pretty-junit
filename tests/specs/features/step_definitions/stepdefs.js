const expect = require('chai').expect,
    { Given, When, Then } = require('cucumber');

function isItFriday(today) {
    if (today === "Friday") {
        return "TGIF";
    } else {
        return "Nope";
    }
}

Given('today is {string}', function (givenDay) {
    this.today = givenDay;
});

When('I ask whether it\'s Friday yet', function () {
    this.actualAnswer = isItFriday(this.today);
});

Then('I should be told {string}', function (expectedAnswer) {
    expect(this.actualAnswer).to.be.equal(expectedAnswer);
});
