# sandwichOrderChatbot

This chatbot takes customized Subway orders from users, with the following functions
- Looks up delivery addresses using user-supplied postal codes and OneMap SG API 
- Returns nutritional information on sandwich order, prompting user to reconsider selection if it exceeds 500 calories
- Stores details of order and nutritional information in Firebase database, using user's handphone number as an identifier
- Updates user's aggregate(average) nutritional content over all his/her previous orders in Firebase
- Allows user to query his/her last order or aggregate nutrition content. If average calories or saturated fat content exceed 30% of the daily recommended intake, the chatbot suggests healthier menu options

The chatbot was developed using the DialogFlow service and can be accessed on Telegram @subwayDeliveryBot (no longer maintained. See ChatbotDemo)

Subway's menu and nutritional information was used to provide content for the chatbot.
