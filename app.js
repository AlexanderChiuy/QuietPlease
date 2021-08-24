// Require the Bolt package (github.com/slackapi/bolt)
const { App, AwsLambdaReceiver } = require('@slack/bolt');
const { WebClient } = require('@slack/web-api');
const { findSpecificConversation } = require('./helpers.js');

//custom reciever
const awsLambdaReceiver = new AwsLambdaReceiver({
    signingSecret: process.env.SLACK_SIGNING_SECRET,
});

//initialize the app with the proper tokens
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver: awsLambdaReceiver,
  processBeforeResponse: true
});

// A list so that the async function findSpecificConversation can mutate this value
let conversationID = [""];

const client = new WebClient(process.env.SLACK_BOT_TOKEN);
const chatName = "general"
// the main slash command
app.command('/quietdown', async ({ command, ack, respond }) => {
  // Acknowledge command request
  await ack();

  try {
    //check that slashcommand was called with users as arguments
    if (command.text.trim() == ""){
      throw "Must enter user(s) to mention"
    }
    
    try{
      // Find the proper conversation ID for the general chat
      await findSpecificConversation(chatName, client, conversationID);
      // Call the chat.postMessage method using the WebClient
      await client.chat.postMessage({
        link_names: true,
        //the general chat id
        channel: conversationID[0],
        text: `Users are asking ${command.text} to please quiet down`,
        as_user: true
      });
    }
    catch(e){
      console.error(e);
    }
    //give user feedback that the command was executed
    await respond("The following user(s) have been asked to quiet down");
  }
  catch (error) {
    //notify user that they must enter a user into this command
    await respond(error);
    console.error(error);
  }
});

//show home page
app.event('app_home_opened', async ({ event, client, context }) => {
  try {
    /* view.publish is the method that your app uses to push a view to the Home tab */
    const result = await client.views.publish({

      /* the user that opened your app's app home */
      user_id: event.user,

      /* the view object that appears in the app home*/
      view: {
        type: 'home',
        callback_id: 'home_view',

        /* body of the view */
        blocks: [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "Welcome to *_Quiet Please_* :tada:"
            }
          },
          {
            "type": "divider"
          },
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "This app is meant to anonymous and _politely_ ask other users to quiet down (either in real life or in the slack workspace)."
            }
          },
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "*_Directions_*:"
            }
          },
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "Send this slash command _'/quietdown @users'_ in any chat and an anonymous quiet down message will be sent to the 'general' chat in your workspace. You can mention as many users (seperated by a space) as you want after the slash command"
            }
          },
          {
            "type": "divider"
          },
          {
            "type": "image",
            "title": {
              "type": "plain_text",
              "text": "Please be polite",
              "emoji": true
            },
            "image_url": "https://c.tenor.com/1S-HNr-doAgAAAAM/quiet-ross-geller.gif",
            "alt_text": "inspiration"
          }
        ]
      }
    });
  }
  catch (error) {
    console.error(error);
  }
});

//set up custom lamda reciever to be exported to serverless
module.exports.handler = async (event, context, callback) => {
  const handler = await awsLambdaReceiver.start();
  return handler(event, context, callback);
}