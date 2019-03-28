// Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
// session persistence, api calls, and more.
const Alexa = require('ask-sdk-core');

// UTILS
const randomPop = (arr) => arr[Math.floor(Math.random() * arr.length)];

const escapeXml = (str) => (
    str.replace(/[<>&'"]/g, (char) => ({
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        "'": '&apos;',
        '"': '&quot;',
    }[char]))
);


// FUNCTIONS
const speakMockingly = (phrase) => {
    const toggleCase = (() => {
        let makeUpperCase = false;
        // const isLetter = (char) => (/\p{L}/u).test(char);
        const isLetter = (char) => (/[a-zÀ-ÖØ-öø-ÿ]/i).test(char);

        return (char) => {
            if (isLetter(char)) {
                char = makeUpperCase ? char.toUpperCase() : char.toLowerCase();
                makeUpperCase = !makeUpperCase;
            }
            return char;
        };
    })();

    const textResponse = phrase.split('').map((char) => toggleCase(char)).join('');

    const minProsodyRate = 80;
    const maxProsodyRate = 84;
    const getRate = (lastIndex, i) => lastIndex === 0 ? minProsodyRate : (
        Math.round((maxProsodyRate - minProsodyRate) / lastIndex * (lastIndex - i) + minProsodyRate)
    );

    const speechResponse = `<speak>
            <voice name="Mathieu"><lang xml:lang="en-US">
                ${escapeXml(phrase).split(' ').map((word, i, arr) => ((i % 2) === 0 ? (
        `<prosody rate="${getRate(arr.length - 1, i)}%" pitch="+6%">${word}</prosody>`
    ) : (
        `<prosody rate="${getRate(arr.length - 1, i)}%" pitch="-33%"><emphasis level="reduced">${word}</emphasis></prosody>`
    ))).join(' ')}
           </lang></voice>
        </speak>`;

    return {
        speech: speechResponse,
        text: textResponse,
    };
};

// INTENTS
const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speechText = randomPop([
            'Greetings! What do you want me to say?',
            'Hi! What do you want me to repeat?',
            'Hello! What can I say for you?',
            'Hello! What do you want me to repeat back to you?',
            'Hello! What phrase do you want me to repeat back to you?',
        ]);
        const speechTextReprompt = 'Sorry, I couldn\'t understand what you said. Make sure to start your phrase with "repeat..." followed by what you want me to say.';

        return handlerInput.responseBuilder
            .speak(`${speechText} Make sure to start your phrase with "repeat..." followed by what you want me to say.'`)
            .reprompt(speechTextReprompt)
            .getResponse();
    },
};
const MockIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'mock';
    },
    handle(handlerInput) {
        const phrase = handlerInput.requestEnvelope.request.intent.slots.phrase.value;
        const speechTextObject = speakMockingly(phrase);

        return handlerInput.responseBuilder
            .withSimpleCard('Here you go...', speechTextObject.text)
            .speak(speechTextObject.speech)
            .withShouldEndSession(true) // shouldn't be required (because there's no reprompt) but for some reason it is...
            .getResponse();
    },
};
const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        // const speechText = 'Bye bye!';
        const speechText = 'Say "repeat..." followed by what you want me to say';
        const speechTextReprompt = 'Sorry, I couldn\'t understand what you said. Make sure to start your phrase with "repeat..." followed by what you want me to say.';

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechTextReprompt)
            .getResponse();
    },
};
const HelpIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        // const speechText = randomPop([
        //     'Say "repeat..." followed by what you want me to say',
        //     'Try saying: "repeat “I like watching Spongebob”", or any phrase you\'d like.',
        // ]);

        return handlerInput.responseBuilder
            .speak('Say "repeat..." followed by what you want me to say')
            .reprompt('Try saying: "repeat “I like watching Spongebob”", or any phrase you\'d like.')
            .getResponse();
    },
};
const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
                || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speechText = 'Goodbye!';
        return handlerInput.responseBuilder
            .speak(speechText)
            .getResponse();
    },
};
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse();
    },
};

// The intent reflector is used for interaction model testing and debugging.
// It will simply repeat the intent the user said. You can create custom handlers
// for your intents by defining them above, then also adding them to the request
// handler chain below.
const IntentReflectorHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest';
    },
    handle(handlerInput) {
        const intentName = handlerInput.requestEnvelope.request.intent.name;
        const speechText = `You just triggered ${intentName}`;

        return handlerInput.responseBuilder
            .speak(speechText)
            // .reprompt('add a reprompt if you want to keep the session open for the user to respond')
            .getResponse();
    },
};

// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`~~~~ Error handled: ${error.message}`);
        const speechText = 'Say "repeat..." followed by what you want me to say';
        const speechTextReprompt = 'Sorry, I couldn\'t understand what you said. Make sure to start your phrase with "repeat..." followed by what you want me to say.';

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechTextReprompt)
            .getResponse();
    },
};

// This handler acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        HelpIntentHandler,
        MockIntentHandler,
        FallbackIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
        IntentReflectorHandler) // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
    .addErrorHandlers(
        ErrorHandler)
    .lambda();
