const Alexa = require('ask-sdk-core');

const welcomeMessage = `Welcome to your H R interview, would you like to start? `;
const startQuizMessage = `Let's begin with your interview. `;
const exitSkillMessage = 'Thank you for the day, we will be back to you as soon as possible.';
const helpMessage = `How may I help you? `;

const useCardsFlag = true;

const questions = [`What's your name?`,
`Tell me about some of your hobbies.`,
`What are your strengths?`,
`What are your weeknesses?`,
`What is your biggest achievement yet?`];


/* INTENT HANDLERS */
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === `LaunchRequest`;
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(welcomeMessage)
      .reprompt(helpMessage)
      .getResponse();
  },
};




const InterviewHandler = {
  canHandle(handlerInput) {
    const request = handlerInput.requestEnvelope.request;
    console.log("Inside InterviewHandler");
    console.log(JSON.stringify(request));
    return request.type === "IntentRequest" &&
           (request.intent.name === "QuizIntent" || request.intent.name === "AMAZON.StartOverIntent");
  },
  handle(handlerInput) {
    console.log("Inside QuizHandler - handle");
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const response = handlerInput.responseBuilder;
    attributes.state = states.QUIZ;
    attributes.counter = 0;
    attributes.confidence = 0;
    attributes.traits = [];
    attributes.sentimentScore = 0;

    var question = askQuestion(handlerInput);
    var speakOutput = startQuizMessage + question;
    var repromptOutput = question;

    return response.speak(speakOutput)
                   .reprompt(repromptOutput)
                   .getResponse();
  }
};

// const PersonalityInsightsV3 = require('watson-developer-cloud/personality-insights/v3');

// const personalityInsights = new PersonalityInsightsV3({
//   version: '{version}',
//   iam_apikey: '{apikey}',
//   url: 'https://gateway-wdc.watsonplatform.net/personality-insights/api'
// });

const InterviewAnswerHandler = {
  canHandle(handlerInput) {
    console.log("Inside InterviewAnswerHandler");
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const request = handlerInput.requestEnvelope.request;
    
    console.log(request.type, request.intent.name);
    return request.type === 'IntentRequest' &&
           (request.intent.name === 'HobbiesIntent' || request.intent.name === 'NameIntent' || request.intent.name === 'StrengthIntent' || request.intent.name === 'WeaknessIntent' || request.intent.name === 'RoleModelIntent');
  },
  handle(handlerInput) {
    console.log("Inside InterviewAnswerHandler - handle");
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const response = handlerInput.responseBuilder;
    const userInput = handlerInput.requestEnvelope.request.intent.slots;
    
    var speakOutput = `Your response is recorded, let's move to next question. `;
    var repromptOutput = ``;
    //const item = attributes.quizItem;
    //const property = attributes.quizProperty;
    //const isCorrect = compareSlots(handlerInput.requestEnvelope.request.intent.slots, item[property]);

    /*if (isCorrect) {
      speakOutput = getSpeechCon(true);
      attributes.quizScore += 1;
      handlerInput.attributesManager.setSessionAttributes(attributes);
    } else {
      speakOutput = getSpeechCon(false);
    }*/

    //speakOutput += getAnswer(property, item);
   // var question = ``;
    //IF YOUR QUESTION COUNT IS LESS THAN 10, WE NEED TO ASK ANOTHER QUESTION.  
    let question = ``;
    if (attributes.counter < 6 && questions[attributes.counter] != undefined) {
      //speakOutput += getCurrentScore(attributes.quizScore, attributes.counter);
      question = askQuestion(handlerInput);
      speakOutput += question;
      repromptOutput = question;

     
      return response.speak(speakOutput)
      .reprompt(repromptOutput)
      .getResponse();
    }
    else {
        let trait = getFinalScore();
      speakOutput = exitSkillMessage + " Your confidence level was " + trait["confidence"] + ". By analyzing your answers we found that you have " + trait.traits[0] + " and " + trait.traits[1] ;
      return response.speak(speakOutput).getResponse();
    }
  },
};

var personality = ['high confidence', 'openness'];
const confidencelevel = 0.86;

const DefinitionHandler = {
  canHandle(handlerInput) {
    console.log("Inside DefinitionHandler");
    const attributes = handlerInput.attributesManager.getSessionAttributes();
    const request = handlerInput.requestEnvelope.request;

    return attributes.state !== states.QUIZ &&
           request.type === 'IntentRequest' &&
           request.intent.name === 'HobbiesIntent' || request.intent.name === 'NameIntent' || request.intent.name === 'StrengthIntent' || request.intent.name === 'WeaknessIntent' || request.intent.name === 'RoleModelIntent';
  },
  handle(handlerInput) {
      
    const response = handlerInput.responseBuilder;
   const speakOutput = "Yo-Yo";
      return response.speak(speakOutput).getResponse();    
  }
};

const sentimentscore = '0.55';


function askQuestion(handlerInput){
    let attributes = handlerInput.attributesManager.getSessionAttributes();
    let counter = attributes.counter;
    if(counter > 5 || counter < 0){
        return "Sorry didn't find any more questions?";
    }else{
        attributes.counter = counter+1;
        return questions[counter];
    }
}


function getFinalScore(){
    //const attributes = handlerInput.attributesManager.getSessionAttributes();
    return {
      'confidence' : confidencelevel,
      'sentiment' : sentimentscore,
      'traits' : personality
    } ;
}

const skillBuilder = Alexa.SkillBuilders.custom();
const ErrorHandler = {
  canHandle() {
    console.log("Inside ErrorHandler");
    return true;
  },
  handle(handlerInput, error) {
    console.log("Inside ErrorHandler - handle");
    console.log(`Error handled: ${JSON.stringify(error)}`);
    console.log(`Handler Input: ${JSON.stringify(handlerInput)}`);

    return handlerInput.responseBuilder
      .speak(`${JSON.stringify(error)}`)
      .reprompt(`${JSON.stringify(error)}`)
      .getResponse();
  },
};

const states = {
  START: `_START`,
  QUIZ: `_QUIZ`,
};

/* LAMBDA SETUP */
exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    InterviewHandler,
    InterviewAnswerHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda();
