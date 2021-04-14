const puppy = require("puppeteer");
const fs = require("fs");

let place = process.argv[2];
let allDaysTemp = [];
let placesInfo = [];
let hotelDetails = [];
let restDetails = [];

async function temp(){
    let browser = await puppy.launch({
        headless: false,
        defaultViewport: false,
        args: ["--start-maximized"]

    });
    var tabs = await browser.pages();
    let tab = tabs[0];

    await tab.goto("https://www.timeanddate.com/weather/usa/california");
    await tab.waitForSelector(".picker-city__input",{visible:true});
    await tab.type(".picker-city__input",place);
    await tab.keyboard.press("Enter");
    await tab.waitForSelector("td:first-child a",{visible: true});
    await tab.click("td:first-child a");

    await tab.waitForSelector(".zebra.tb-wt.fw.tc",{visible: true});

    let days = await tab.$$(".wa .wt-dn");
    let temps = await tab.$$(".wa p");
    
    for(let i = 0; i<days.length;i++){
        let day = await tab.evaluate(function(ele){
            return ele.textContent;
        },days[i]);
        allDaysTemp.push(day + " April");

        let temp = await tab.evaluate(function(ele){
            return ele.textContent;
        },temps[i]);
        allDaysTemp.push(" temperature: "+temp);
    }
   // console.log(allDaysTemp);
    travel(tab);

}

async function travel(tab){
    await tab.goto("https://www.google.com/travel/things-to-do?dest_src=ut&tcfs&ved=2ahUKEwi5h6O9mvvvAhWwiWYCHdKBBL4QyJABegQIABAV&ictx=3");
    await tab.waitForSelector('input[placeholder="Where to? Find things to see and do"]',{visible:true});
    await tab.type('input[placeholder="Where to? Find things to see and do"]',place);
    await tab.keyboard.press("Enter");

    await tab.waitForSelector(".kQb6Eb .skFvHc.YmWhbc");
    let placesNames = await tab.$$(".kQb6Eb .skFvHc.YmWhbc");
    let totalStars = await tab.$$(".kQb6Eb .ta47le");
    
    let rating = '';

    for(let i = 0;i<totalStars.length;i++){
        let placeName = await tab.evaluate(function(ele){
            return ele.textContent;
        },placesNames[i]);
        placesInfo.push({"PlaceToVisit" : placeName,"ratings":rating});

        rating = await tab.evaluate(function(ele){
            return ele.getAttribute("aria-label");
        },totalStars[i]);
        placesInfo[i].ratings = rating;
    }

    console.log(placesInfo);
    await tab.waitForSelector('path[d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"]',{visible:true});
    await tab.click('path[d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"]');
    await tab.waitForNavigation({ waitUntil: 'networkidle2' })
    await tab.waitForSelector("div[data-tab='8']",{visible:true});
    await tab.click("div[data-tab='8']");
    hotel(tab);
    
}

async function hotel(tab){
    await tab.waitForSelector(".BgYkof.ogfYpf.ykx2he",{visible:true});
    let hotelNames = await tab.$$(".BgYkof.ogfYpf.ykx2he");
    let hotelPrices = await tab.$$('.kXk0e.W8vlAc.lRagtb .JGa7fd');
    let ratings = await tab.$$(".NPG4zc .sSHqwe");
    let urls = await tab.$$('a[class = "PVOOXe"]');

    for(let i = 0;i<hotelNames.length;i++){
        let hotelName = await tab.evaluate(function(ele){
            return ele.textContent;
        },hotelNames[i]);
        hotelDetails.push({"HotelName": hotelName}); 

        let price = await tab.evaluate(function(ele){
            return ele.getAttribute("aria-label");
        },hotelPrices[i]);
        hotelDetails[i].PricePerDay = price;

        let rating = await tab.evaluate(function(ele){
            return ele.textContent;
        },ratings[i*2]);
        hotelDetails[i].Ratings = rating;

        let url = await tab.evaluate(function(ele){
            return "https://www.google.com"+ele.getAttribute("href");
        },urls[i]);
        hotelDetails[i].knowMore = url;
    }
   // console.log(hotelDetails);
    restaraunts(tab);

}

async function restaraunts(tab){
    await tab.goto("https://www.tripadvisor.in/Restaurants");
    await tab.waitForSelector('input[placeholder="City or restaurant name"]',{visible:true});
    await tab.type('input[placeholder="City or restaurant name"]',place);
    let clickPlace = await tab.$('._1c2ocG0l');
    await clickPlace.click();

    await tab.waitForNavigation({ waitUntil: 'networkidle2' });
    await tab.waitForSelector('a[data-filter-id="EATERY"]',{visible:true});
    await tab.click('a[data-filter-id="EATERY"]');

    await tab.waitForSelector('.result-title span',{visible:true});
    let nameOfRest = await tab.$$('.result-title span',{visible:true});
    let addresses = await tab.$$('[class="address-text"]');
    let reviews = await tab.$$('[class="review-snippet-block"]')

    for(let i = 0;i<nameOfRest.length;i++){
        let name = await tab.evaluate(function(ele){
            return ele.textContent;
        },nameOfRest[i]);

        restDetails.push({"NameOfRestaraunt":name});

        let restAdd = await tab.evaluate(function(ele){
            return ele.textContent;
        },addresses[i]);
        restDetails[i].RestarauntAddress = restAdd;

        let review = await tab.evaluate(function(ele){
            return ele.textContent;
        },reviews[i]);
        restDetails[i].Reviews = review;
    }
 //   console.log(restDetails);

    let finalData = [{"the temperature for the next two weeks is": allDaysTemp},{"Some exciting place to visit here":placesInfo},
    {"Some nice places to stay":hotelDetails},
    {"Some nice restaraunts":restDetails}];
    console.log(finalData);

    fs.writeFileSync("places.json", JSON.stringify(finalData));

}
temp();

