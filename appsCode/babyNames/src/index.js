'use strict';

/**
 * This sample demonstrates a simple skill built with the Amazon Alexa Skills Kit.
 * The Intent Schema, Custom Slots, and Sample Utterances for this skill, as well as
 * testing instructions are located at http://amzn.to/1LzFrj6
 *
 * For additional samples, visit the Alexa Skills Kit Getting Started guide at
 * http://amzn.to/1LGWsLG
 */

// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: 'PlainText',
            text: output,
        },
        card: {
            type: 'Simple',
            title: `SessionSpeechlet - ${title}`,
            content: `SessionSpeechlet - ${output}`,
        },
        reprompt: {
            outputSpeech: {
                type: 'PlainText',
                text: repromptText,
            },
        },
        shouldEndSession,
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: '1.0',
        sessionAttributes,
        response: speechletResponse,
    };
}


// --------------- Functions that control the skill's behavior -----------------------

function getWelcomeResponse(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    const sessionAttributes = {};
    const cardTitle = 'Welcome';
    const speechOutput = 'Welcome to Magic Baby Names. ' +
        'Please tell me a girl or boy name you want to save ';
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    const repromptText = 'Please tell me your favorite names by saying, ' +
        'add Sebastian to boy names or add Andrea to girl list';
    const shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function handleSessionEndRequest(callback) {
    const cardTitle = 'Session Ended';
    const speechOutput = 'Thank you for trying Magic Baby Names. Have a nice day!';
    // Setting this to true ends the session and exits the skill.
    const shouldEndSession = true;

    callback({}, buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
}

var getBabyNamesHelperData  = function(session) {

    var babyNamesHelperData = session.attributes ? session.attributes.babyNamesHelperData : undefined;
    if (babyNamesHelperData === undefined) {
        babyNamesHelperData = {
            boy: [],
            girl: []
        };
    }
    return babyNamesHelperData;
};

function addFavoriteNamesAttributes(session, nameToAdd, genderToAdd) {
    var babyNamesHelperData = getBabyNamesHelperData(session);
    if (babyNamesHelperData[genderToAdd]){
        babyNamesHelperData[genderToAdd].push(nameToAdd);
    }
    console.log("addFavoriteNamesAttributes   " + JSON.stringify(babyNamesHelperData[genderToAdd]));
    return babyNamesHelperData;
}

/**
 * Sets the color in the session and prepares the speech to reply to the user.
 */
function setNamesInSession(intent, session, callback) {
    const cardTitle = intent.name;
    const nameSlot = intent.slots.Name;
    const genderSlot = intent.slots.Gender;
    let repromptText = '';
    let sessionAttributes = {};
    const shouldEndSession = false;
    let speechOutput = '';

    if (nameSlot && genderSlot) {
        const nameToAdd = nameSlot.value;
        const genderToAdd = genderSlot.value;
        sessionAttributes.babyNamesHelperData = addFavoriteNamesAttributes(session, nameToAdd, genderToAdd);
        speechOutput = `I now know you want to add the name ${nameToAdd} to ${genderToAdd} list. You can ask me ` +
            "your favorites baby names by saying, tell me my boy list of names?";
        repromptText = "You can ask me your favorites baby names by saying, what's my girl list of names?";
    } else {
        speechOutput = "I'm not sure what name you said. Please try again.";
        repromptText = "I'm not sure what name you said. You can tell me favorite baby names by saying, add Sebastian to boy names";
    }

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function getNamesFromSession(intent, session, callback) {

    const genderSlot = intent.slots.Gender;
    const genderToRead = genderSlot.value;
    console.log("genderSlot " + genderSlot);
    const repromptText = null;
    const sessionAttributes = {};
    let shouldEndSession = false;
    let speechOutput = '';
    let favoriteNames = '';

    if (genderSlot && session.attributes.babyNamesHelperData && session.attributes.babyNamesHelperData[genderToRead]) {
        console.log("genderToRead " + genderToRead);
        favoriteNames = session.attributes.babyNamesHelperData[genderToRead].join().toString();
    }

    console.log( "favoriteNames " + favoriteNames);

    if (favoriteNames) {
        speechOutput = "Your favorite names are ${favoriteNames} for the gender ${genderToRead}. Goodbye.";
        //shouldEndSession = true;
    } else {
        speechOutput = "I'm not sure what your favorite name are for the gender ${genderToRead}.";
    }

    // Setting repromptText to null signifies that we do not want to reprompt the user.
    // If the user does not respond or says something that is not understood, the session
    // will end.
    callback(session,
        buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));
}


// --------------- Events -----------------------

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log(`onSessionStarted requestId=${sessionStartedRequest.requestId}, sessionId=${session.sessionId}`);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log(`onLaunch requestId=${launchRequest.requestId}, sessionId=${session.sessionId}`);

    // Dispatch to your skill's launch.
    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log(`onIntent requestId=${intentRequest.requestId}, sessionId=${session.sessionId}`);

    const intent = intentRequest.intent;
    const intentName = intentRequest.intent.name;

    console.log("intentName " + intentName);

    // Dispatch to your skill's intent handlers
    if (intentName === 'MyNameIsIntent') {
        setNamesInSession(intent, session, callback);
    } else if (intentName === 'WhatsMyBabyNameIntent') {
        getNamesFromSession(intent, session, callback);
    } else if (intentName === 'AMAZON.HelpIntent') {
        getWelcomeResponse(callback);
    } else if (intentName === 'AMAZON.StopIntent' || intentName === 'AMAZON.CancelIntent') {
        handleSessionEndRequest(callback);
    } else {
        throw new Error('Invalid intent');
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log(`onSessionEnded requestId=${sessionEndedRequest.requestId}, sessionId=${session.sessionId}`);
    // Add cleanup logic here
}


// --------------- Main handler -----------------------

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = (event, context, callback) => {
    try {
        console.log(`event.session.application.applicationId=${event.session.application.applicationId}`);

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */
        /*
         if (event.session.application.applicationId !== 'amzn1.echo-sdk-ams.app.[unique-value-here]') {
         callback('Invalid Application ID');
         }
         */

        if (event.session.new) {
            onSessionStarted({ requestId: event.request.requestId }, event.session);
        }

        if (event.request.type === 'LaunchRequest') {
            onLaunch(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                callback(null, buildResponse(sessionAttributes, speechletResponse));
        });
        } else if (event.request.type === 'IntentRequest') {
            onIntent(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                callback(null, buildResponse(sessionAttributes, speechletResponse));
        });
        } else if (event.request.type === 'SessionEndedRequest') {
            onSessionEnded(event.request, event.session);
            callback();
        }
    } catch (err) {
        callback(err);
    }
};
