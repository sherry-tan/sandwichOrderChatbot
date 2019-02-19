const bodyParser = require('body-parser');
const functions = require('firebase-functions');
const {WebhookClient,Card,} = require('dialogflow-fulfillment');
const {dialogflow, BasicCard, Button} = require('actions-on-google');
const admin = require('firebase-admin');
const rq = require('request');
const express = require('express');
const expressApp = express().use(bodyParser.json());

process.env.DEBUG = 'dialogflow:*'; 

admin.initializeApp({
	credential: admin.credential.cert({
		projectId: "subwaydelivery-63e06",
		clientEmail: "firebase-adminsdk-0p73x@subwaydelivery-63e06.iam.gserviceaccount.com",
		privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDRtui92tF0bcNX\nvS+bbz7nPpFoVzeUVzi5NouoWTp3XYVlomg/34Qd3KYYJaGwxcB0pmb0q/lnSten\ndGMy22c9ZPWrLRihtMDTOh1ZoIQehWtXJZsnb3YylwgWIQfOK7OdOQuRy7+LDWCu\nUNo1t/zxtQFkTVGcTNvWZjzMwyisQT7rkgp9A1pY5Hnc93j/lnL1HT5CdWFLisFS\nNpvl83MQ0CvwCxmhdwa2pobM+hKVC1lWjkURGO47Jkp8vqbRdrKtGrzuxNs3Jd6d\nVpMsiHaxyDIBBeLiLjGChUrV/wNGE9IUX7qS9OtyESjA/oneNW+MM2GlBUZ0fnb/\nDIMbwgihAgMBAAECggEACqqMJ13aAds0UIHXikcL8rx4rk8jTUjrYmYvD7qsEdag\nmoT6WudOI6utifReByzjpzswaNjXWETS95ogkn1cwJ9iLFjglBbqqMOfqweSOLAt\n/7Jys/yEDTonx+JZsIeB/OjiGQH9JcAiLvN/SbSoKY38emLBWBsDomG0TXDOoIYg\nb5vXkFyFlU6KrVoMLEl7sASRGdtGqXbhe72WIEsZ0eybmlLN0USE4z+E1mqMst2x\nciD8dveP5F9I+pgej4pgr3NWSFRe4naZhnCGrx0Ynz2ugSeqtw6Y8szDED4dKF0W\nQk+PuGrhSzfjhPIdO+872Wco+g9XirdCu5q4+VzbnQKBgQDr2qdrdqIe3jT7vG/R\nGkef4qVwgWZ7UFZ+UgpQjROkKcHlVSEbE0fJxIDMzmSvoWCR75FSov9NfYaXfcY2\nWbY5YKD2H7dnAuv64tEgNI29ELPQPrkRaJiM1+eYDmGyT/6W1WE8M59QuHy5UJ37\noH4Gbx4rA4jxyY+Th7j+I1+azQKBgQDjoKsXve4IoV1pb+gZE3kbHL1qYNqiG7n6\nVjR75SyGTbntDzMFrFxsj89HhrRUMXF/x2sJDUUgt4r5YACMmniWzcoJMPaWwihD\nsIh5KOF1WHp9iRHJaamcfrUiKU/oVu450FsEs1kVKKjnapGAxx4XmNkzsgf8uZ4T\n4YIh1OVNJQKBgQChXrE97aVuyUonEv7OatSmqEPZfi/IH2eOdkNoaZ4OrCNl7aEB\nDWgIvNIDTxPEtv2D3A3qJGvZcREthXigpzDugRagT4MEkBM1TQsYpdx0h4D/8mpd\nZts5Ql/KwcxGXEUsnkIxFoDikdeEU4xEJcMUU+KoO3rvM6Fwp2QDPeCj4QKBgA0v\nPTm+0o7Fafe1d6gcLKOZYo9K1N8W5ArP+3JBr/aHggFtI/NsLF5NZiAqeT93La/N\nCTIZBqwCdZZELUP3nox9lvo5T88jp9lj3EPITmbRnSawTctwx1Y9MJit8+btQhcv\nLlZzXPGQzVe6IHtpDSEoxUvtP/Evfyx/n13+StnRAoGBAK7UNBSpJ2oPstJlf3Sa\nd20evokSp70CR+C52RoG1LBszXSueW0A9eNZyNf0BdfdYtMnKmDunNV2sCU9Zo2F\nQY4185e+obbIj0tTPpM4OAEDsVSoUZGIhe44h9hMdO2TG4nl3onhXgu2ajuFaLaB\nCpUoeZ1ioHQF0Lwysk0l9h2A\n-----END PRIVATE KEY-----\n",
	}),
	databaseURL: "https://subwaydelivery-63e06.firebaseio.com"
});

admin.firestore().settings({timestampsInSnapshots: true})
db = admin.firestore();

expressApp.post('/fulfillment', functions.https.onRequest((request, response) => {
	const agent = new WebhookClient({ request, response });
	
	// gives user link to Subway Menu
	function menu(agent) {
   		agent.add(new Card({
	       	imageUrl: 'https://cdn1.imggmi.com/uploads/2018/12/30/710eafff6cb25a3664639288a2d4e508-full.jpg',
	       	buttonText: 'Click here for menu',
	       	buttonUrl: 'https://www.subway.com/en-SG/MenuNutrition/Menu',
	       	title: 'Subway Menu'
     	}));	 
	};

	// obtains and confirms user's order and gives brief nutritional information
	function getSandwichOrder(agent) {
	
	   	const size = agent.parameters.sandwichsize;
		const fillings = agent.parameters.fillings;
		const breadtype = agent.parameters.breadtype;
		const sauce = agent.parameters.sauce;
		const toppings = agent.parameters.toppings;
 
 		// get nutritional information of order
		const nutritioninfo = calcNutrition(fillings,breadtype,size,sauce,toppings);
		const calories = nutritioninfo['Calories'];

	  	// textresponses - confirm order selection, give calorie content and ask user if he/she wants to proceed
 		const ordersummary = "Fantastic! Your selection:\n\n" + size + " " + fillings + ", " + breadtype + "\nToppings: " + toppings + "\nSauce: " + sauce + "\n\n";
 		const nutritionsummary = "Your order contains " + calories + " calories.\n\n"
 		
 		var question = "Would you like to proceed with your order?"

		if (calories > 500) {
			question = "Are you sure you want to proceed with your order?"; //subtle encouragement to customer to change unhealthy order
		}

   		agent.add(ordersummary + nutritionsummary + question);	

	};

	// obtain user's delivery address and save user's order to database
  	function getaddress(agent) {
  		
   		const phone = agent.parameters.phone;
		const size = agent.parameters.sandwichsize;
		const fillings = agent.parameters.fillings;
		const breadtype = agent.parameters.breadtype;
		const sauce = agent.parameters.sauce;
		const toppings = agent.parameters.toppings;
		var textResponse;
		var postalcode = agent.parameters.postalcode;

		
		//retrieve address using customer-supplied postal code and OneMap, then save order to database
		return new Promise ((resolve,reject)=>{
			getAddressFromAPI(postalcode).then((address)=>{
				
				if (address!="") {
					textResponse = "Your" + " " + size + " " + fillings + ", " + breadtype + " will be delivered to:" +"\n" + address + "\nin 15 minutes!\n\nBon Appetit!";
				}
				else {
					postalcode = 'self-collect';
					textResponse ="Sorry, we are unable to deliver to that address.\nPlease collect at your nearest Subway!";
				};

				writetoDB(fillings,breadtype,size,sauce,toppings, phone, postalcode);
			
				agent.add(textResponse);
				resolve('got address');
			})
			.catch((error)=>{
				console.log("error retrieving address");
				agent.add("The system is experiencing difficulties, please try again later.")
				reject('encountered error');
			});
		});			
	};

	// obtain user's average nutritional information for past orders
	function getnutritionhistory(agent){

		const phone = agent.parameters.phone;
		const maxCalories = 2000;						// recommended daily calorie intake
		const maxSatFat = maxCalories * 0.3 / (9 * 3); 	// recommended daily saturated fat intake
		const threshold = 30;							// threshold percentage: for 1 meal, order should not exceed this value 
		
		var userRecords = db.collection('nutritionsummary').doc(phone);

		return new Promise((resolve,reject)=>{
			userRecords.get().then((doc)=>{
				if(!doc.exists){
					agent.add( "You do not have any previous orders with Subway. What would you like to order today? ");
				}
				else {
					
					const data = doc.data();
					const avgCalories = data.Calories;
					const avgSatFat = data.SatFat;
					const startDate = data.startDate.toDate().toDateString().slice(4);
					const endDate = data.endDate.toDate().toDateString().slice(4);
					const numOrders = data.numOrders;
					const caloriesPercent = avgCalories*100/maxCalories; //as percent of daily requirement
					const satFatPercent = avgSatFat*100/maxSatFat;
			
					// textresponses
					const orderhistory = "You placed " + numOrders + " orders from " + startDate + " to " + endDate + "." + "\n\nOn average, your order contained:\n" + 
					avgCalories.toFixed(0) + " calories - " + caloriesPercent.toFixed(0) + " % of the recommended daily calorie intake,\n" + avgSatFat.toFixed(1) + 
					"g of saturated fat - " + satFatPercent.toFixed(0) + " % of the recommended daily saturated fat intake."
					const advice = "\n\nYou may want to consider healthier options like Oven-Roasted Chicken Breast, Turkey Breast and low-fat sauces like mustard in future."
					const takeorder = "\n\nWhat would you like to order today?"
					var textResponse;

					// only give advice if order exceeds threshold
					if (caloriesPercent>threshold||satFatPercent>threshold){
						textResponse = orderhistory + advice + takeorder;
					}
					else {
						textResponse = orderhistory + takeorder;
					}
				
					agent.add(textResponse);
				};
				
				resolve("obtained info success");
			})
			.catch((error)=>{
				console.log("error");
				agent.add( "Error retrieving records.  What would you like to order today?");
				reject("error retrieving records");
			});
		});
	};

	// obtain user's last order details
	function getorderhistory(agent){

		const phone = agent.parameters.phone;
		var userRecords = db.collection('records').doc(phone).collection('orders').orderBy('date', 'desc').limit(1);
		
		return new Promise ((resolve, reject)=> {
			userRecords.get().then((snapshot)=>{
			
				if (snapshot.size>0){
					snapshot.forEach((doc)=>{
						const fillings = doc.data().fillings;
						const sandwichsize = doc.data()['size'];
						const breadtype = doc.data().breadtype;
						const sauce = doc.data().sauce;
						const toppings = doc.data().toppings;
						const date = doc.data().date.toDate().toDateString().slice(4,);
				
						var textResponse = "You last placed an order on " + date + " for :\n" + fillings + ", " + sandwichsize + " " + breadtype  + "\nToppings: " + 
						toppings + "\nSauce: " + sauce + ".\n\nWhat would you like to order today?";
						agent.add(textResponse);						
					})
				}
				else {
					agent.add("No records exist. What would you like to order?");
				}

				resolve("success reading db");
			}).
			catch((error)=>{
				agent.add("The system is experiencing difficulties. Please try again later");
				reject("error reading db");
			});	
			
		});
		
	};
	
	let intentMap = new Map();
	intentMap.set('getMenu', menu);
	intentMap.set('getAddress', getaddress);
	intentMap.set('getSandwichOrder', getSandwichOrder);
	intentMap.set('getNutritionHistory',getnutritionhistory);
	intentMap.set('getOrderHistory',getorderhistory);
	agent.handleRequest(intentMap);
 
	})
 );


var listener = expressApp.listen(
       process.env.PORT,
       process.env.IP,
       function(){
           console.log("server started");
           console.log("listening on port " +
           listener.address().port);
       });


// retrieve address using postal code and API
function getAddressFromAPI(postalcode) {	
	

	return new Promise((resolve,reject) =>{
		rq("https://developers.onemap.sg/commonapi/search?searchVal=" + postalcode + "&returnGeom=N&getAddrDetails=Y&pageNum=1", 
			function (error, response, body) {
			
			var obj = JSON.parse(body);
			var formatted_address = "";
			
			if ((obj.found!=0)&&(postalcode.length==6)){
				var s = obj.results[0].BLK_NO + " " + obj.results[0].ROAD_NAME;
				var address_strings = s.split(" ");

				for(i=0; i<address_strings.length; i++){
					formatted_address = formatted_address + " " + changecase(address_strings[i]);
				};

				formatted_address = formatted_address + " S(" + postalcode+")";
				formatted_address = formatted_address.trim();
				}
			
			resolve(formatted_address);

			}	
		)
	});
};

// format address
function changecase(string) {
	string = string.toLowerCase();
	return string.charAt(0).toUpperCase() + string.slice(1);
};

// calculate nutritional info of order
function calcNutrition(fillings,breadtype,size,sauce,toppings){
	 
	var nutritionInOrder = {
		'Calories':0,
	 	'Protein':0,
	 	'TotalFat':0,
	 	'SatFat':0,
	 	'Cholesterol':0,
	 	'Carb':0,
	 	'DietaryFibre':0,
	 	'Sugar':0,
	 	'Sodium':0
	 };

	 var itemdata;
	 var value;
		 					
	 // get nutritional info file
	const nutritiondata = require('./subway.json')
	
	// concatenate all sandwich components into list
	var allitems = [fillings, breadtype];
 	allitems = allitems.concat(toppings,sauce);

 	//sum nutritional info over all components in list
 	for(var i=0; i < allitems.length; i++){
 		if(allitems[i] in nutritiondata){
			
			itemdata = nutritiondata[allitems[i]]; 
	 		
	 		for (var key in nutritionInOrder){		 			
	 			
	 			value = parseFloat(itemdata[key]);
	 				
	 			if(size=='12-in'){
	 				value = 2 * value;
	 			};
	 		
	 			nutritionInOrder[key] = nutritionInOrder[key] + value;
	 		};
 		};	
 	}; 
	
	return nutritionInOrder;
	
};

// save user record to db
function writetoDB(fillings,breadtype,size,sauce,toppings,phone, postalcode){

	const date = new Date()
	const order = { 'postalcode': postalcode ,
			'size': size,
			'fillings': fillings,
			'breadtype': breadtype,
			'sauce': sauce.join(', '),
			'toppings': toppings.join(', '),
			'date': date};

	//get nutritional content of order
	const nutrition = calcNutrition(fillings,breadtype,size,sauce,toppings); 

	//concatenate order details and nutrition into a single dict
	const newentry = Object.assign({},order,nutrition);
	
	//save the dict as a record to db
	db.collection('records').doc(phone).collection('orders').add(newentry).then(()=>{
		console.log("Wrote to DB");
	}).
	catch(() => {
		console.log("Error writing to DB");
	});

	
	//update user's aggregated nutritional information for all previous orders
	var ref = db.collection('nutritionsummary').doc(phone);

	return db.runTransaction(transaction => {
        return transaction.get(ref).then(doc => {
            // if this is user's first order, sets value equivalent to the first order
            if (!doc.exists) {
                
                console.log("doc does not exist")   
                transaction.set(ref, nutrition);
                transaction.update(ref, 
                	{'numOrders':1,
            		'startDate': order.date,
            		'endDate': order.date});
            	}
            // otherwise update the records to reflect the new average values
            else {         	
            	
            	var updatedNumOrders = doc.data()['numOrders'] + 1 
            	
            	var updateentry = {
            		'numOrders': updatedNumOrders,
            		'startDate': doc.data()['startDate'],
            		'endDate': order.date
            		};
            
            	for (var key in nutrition){
            		updateentry[key] = (nutrition[key] + doc.data()[key] * doc.data()['numOrders'])/updatedNumOrders;	
            		};
            	
            	transaction.set(ref,updateentry);
            	};
         	})
		.catch(()=>{
            console.log("error writing to db")
       		});
           
        });
    };    
            

