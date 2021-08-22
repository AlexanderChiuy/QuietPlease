async function findSpecificConversation(conversationName, client, conversationID) {
  try {
    // Call the conversations.list method using the WebClient
    const conversations = await client.conversations.list();
    conversations.channels.forEach(function(conversation) {
      // find the specific conversation id
      if (conversation["name"] == conversationName) {
        conversationID[0] = conversation["id"];
      }
    });
  }
  catch (error) {
    console.error(error);
  }
}

module.exports = { findSpecificConversation };
