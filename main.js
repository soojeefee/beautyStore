const http = require('http');
const path = require("path");
const express = require("express");
const axios = require('axios');
const ejs = require('ejs');
const bodyParser = require("body-parser");

const portNumber = 5000;
const httpSuccessStatus = 200;
const app = express(); 

app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");
app.listen(portNumber);
app.use(bodyParser.urlencoded({extended:false}));

app.get("/", (request, response) => {
    response.render("homePage");
});

app.get('/index', async (req, res) => {
    try {
        const apiURL = await axios.get('https://api.ipify.org?format=json');
        const getIP = apiURL.data.ip;
        res.render('index', {getIP});
    } catch (error) {
        console.error('Error fetching IP address:', error);
    }
});

app.get("/inventoryPage", (request, response) => {
    response.render("inventoryPage");
});

app.get("/addToCartPage", (request, response) => {
    response.render("addToCartPage");
});

app.get("/removeFromCartPage", (request, response) => {
    response.render("removeFromCartPage");
});

app.get("/stockListPage", (request, response) => {
    response.render("stockListPage");
});

app.get("/popularItemsPage", (request, response) => {
    response.render("popularItemsPage");
});

app.get("/checkoutPage", (request, response) => {
    response.render("checkoutPage");
});

require("dotenv").config({ path: path.resolve(__dirname, '.env') });
const username = process.env.MONGO_DB_USERNAME;
const password = process.env.MONGO_DB_PASSWORD;
const databaseAndCollection = {db: "CMSC335_DB", collection:"finalExamProj"};
const { MongoClient, ServerApiVersion } = require('mongodb');

app.post("/postInventory", (request, response) => {
    postInventoryFunction(request,response);
});
async function postInventoryFunction(request, response) {
    const uri = `mongodb+srv://sfee:${password}@cluster0.cpvgcfu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, 
                    serverApi: ServerApiVersion.v1 });
    try {
        await client.connect();
        let date = new Date();
        let total = 0;
        let totalCurr = "";
        const connection = client.db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .find({});
        const userCart = await connection.toArray();
        // console.log(userCart);
        let cartTable = "<h1>Your Cart</h1><table border='1'>";
        cartTable += '<tr><th>Item Name</th><th>Item Price</th><th>Quantity</th><th>Total Price</th></tr>';
        userCart.forEach(elem => {
            cartTable += `<tr><td>${elem.name}</td><td>${elem.invPriceCurr}</td><td>${elem.quantity}</td>
                <td>${elem.tPriceCurr}</td></tr>`;
            total += elem.tPriceNum;
        });
        totalCurr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(total); 
        cartTable += `</table><br><b>Total: </b>${totalCurr}<br><br>`;
        cartTable += `<hr><b>Cart last updated at ${date}</b><hr><a href=/>HOME</a>`;
        response.end(cartTable);
    } 
    catch (e) 
    {
        console.error(e);
        let cartTable = "<h1>Your Cart</h1><table border='1'>";
        cartTable += '<tr><th>Item Name</th><th>Item Price</th><th>Quantity</th><th>Total Price</th></tr>';
        cartTable += `</table><br><b>Total: </b>$0.00<br><br>`;
        cartTable += `<hr><b>Cart last updated at ${date}</b><hr><a href=/>HOME</a>`;
        response.end(cartTable);
    } 
    finally 
    {
        await client.close();
    }           
}

app.post("/postAddToCart", (request, response) => {
    postAddToCartFunction(request,response);
});
async function postAddToCartFunction(request, response) {
    const uri = `mongodb+srv://sfee:${password}@cluster0.cpvgcfu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, 
                    serverApi: ServerApiVersion.v1 });
    try {
        await client.connect();
        let date = new Date(); 
        let itemName = request.body.nameInput;
        let itemQuantity = request.body.quanInput;
        let myValue = Number(itemQuantity);

        const filter = { name: itemName };
        const removedItem = await client.db(databaseAndCollection.db)
            .collection(databaseAndCollection.collection)
            .findOne(filter);
        if (removedItem) {
            const finder = {name: itemName};
            
            let quan = Number(removedItem.quantity);
            let updatedQuantity = quan + myValue;
            let itemTotal = itemQuantity * removedItem.invPriceNum;
            let itemTotalFormat = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(itemTotal); 
            let adjustedTotal = itemTotal + removedItem.tPriceNum;
            let adjustedTotalFormat = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(adjustedTotal);
            const updater = {
                $set: { quantity: updatedQuantity, tPriceCurr: adjustedTotalFormat, tPriceNum: adjustedTotal }
            };
            let executeUpdate = await client.db(databaseAndCollection.db)
                .collection(databaseAndCollection.collection)
                .updateOne(finder, updater);
            let itemDetails = "<h1>Item Added To Cart</h1>";
            itemDetails += `<b>Item Added: </b>${itemName}<br><b>Quantity: </b>${itemQuantity}<br>`;
            itemDetails += `<b>Price Per Item: </b>${removedItem.invPriceCurr}<br><b>Total Price: </b>${itemTotalFormat}<br>`;
            itemDetails += `<hr><b>Item(s) added at ${date}</b><hr><a href=/>HOME</a>`;
            response.end(itemDetails);
        }
        else {
            let itemPrice = 0;
            let totalPrice = 0;
            let itemPriceCurr = "";
            let totalPriceCurr = "";
            if (itemName == "IT Cosmetics CC Cream Foundation") {
                itemPrice = 47.00;
                itemPriceCurr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(itemPrice);
                totalPrice = itemQuantity * itemPrice;
                totalPriceCurr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalPrice); 
            }
            else if (itemName == "Dior Backstage Face and Body Foundation") {
                itemPrice = 43.00;
                itemPriceCurr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(itemPrice);
                totalPrice = itemQuantity * itemPrice;
                totalPriceCurr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalPrice); 
            }
            else if (itemName == "Makeup By Mario Surreal Skin Foundation") {
                itemPrice = 42.00;
                itemPriceCurr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(itemPrice);
                totalPrice = itemQuantity * itemPrice;
                totalPriceCurr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalPrice); 
            }
            else if (itemName == "Kosas Revealer Concealer") {
                itemPrice = 30.00;
                itemPriceCurr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(itemPrice);
                totalPrice = itemQuantity * itemPrice;
                totalPriceCurr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalPrice); 
            }
            else if (itemName == "Make Up For Ever HD Skin Concealer") {
                itemPrice = 29.00;
                itemPriceCurr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(itemPrice);
                totalPrice = itemQuantity * itemPrice;
                totalPriceCurr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalPrice); 
            }
            else if (itemName == "Rare Beauty Liquid Touch Concealer") {
                itemPrice = 22.00;
                itemPriceCurr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(itemPrice);
                totalPrice = itemQuantity * itemPrice;
                totalPriceCurr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalPrice); 
            }
            else if (itemName == "Huda Beauty Easy Bake Loose Setting Powder") {
                itemPrice = 38.00;
                itemPriceCurr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(itemPrice);
                totalPrice = itemQuantity * itemPrice;
                totalPriceCurr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalPrice); 
            }
            else if (itemName == "Laura Mercier Translucent Loose Setting Powder") {
                itemPrice = 59.00;
                itemPriceCurr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(itemPrice);
                totalPrice = itemQuantity * itemPrice;
                totalPriceCurr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalPrice); 
            }
            else if (itemName == "Charlotte Tilbury Airbrush Flawless Setting Spray") {
                itemPrice = 38.00;
                itemPriceCurr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(itemPrice);
                totalPrice = itemQuantity * itemPrice;
                totalPriceCurr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalPrice); 
            }
            else if (itemName == "Makeup By Mario Soft Sculpt Bronzer") {
                itemPrice = 32.00;
                itemPriceCurr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(itemPrice);
                totalPrice = itemQuantity * itemPrice;
                totalPriceCurr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalPrice); 
            }
            else if (itemName == "Rare Beauty Warm Wishes Bronzer Stick") {
                itemPrice = 26.00;
                itemPriceCurr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(itemPrice);
                totalPrice = itemQuantity * itemPrice;
                totalPriceCurr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalPrice); 
            }
            else if (itemName == "Saie Beauty Dew Liquid Blush") {
                itemPrice = 25.00;
                itemPriceCurr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(itemPrice);
                totalPrice = itemQuantity * itemPrice;
                totalPriceCurr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalPrice); 
            }
            else if (itemName == "Dior Rosy Glow Blush") {
                itemPrice = 40.00;
                itemPriceCurr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(itemPrice);
                totalPrice = itemQuantity * itemPrice;
                totalPriceCurr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalPrice); 
            }
            else if (itemName == "Benefit Cosmetics Cookie Powder Highlight") {
                itemPrice = 35.00;
                itemPriceCurr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(itemPrice);
                totalPrice = itemQuantity * itemPrice;
                totalPriceCurr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalPrice); 
            }
            else if (itemName == "Ilia Limitless Lash Mascara") {
                itemPrice = 26.00;
                itemPriceCurr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(itemPrice);
                totalPrice = itemQuantity * itemPrice;
                totalPriceCurr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalPrice); 
            }
            else if (itemName == "Lancome Lash Idole Mascara") {
                itemPrice = 30.00;
                itemPriceCurr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(itemPrice);
                totalPrice = itemQuantity * itemPrice;
                totalPriceCurr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalPrice); 
            }
            else if (itemName == "KVD Beauty Tattoo Liquid Eyeliner") {
                itemPrice = 25.00;
                itemPriceCurr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(itemPrice);
                totalPrice = itemQuantity * itemPrice;
                totalPriceCurr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalPrice); 
            }
            else if (itemName == "Anastasia Beverly Hills Brow Pencil") {
                itemPrice = 25.00;
                itemPriceCurr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(itemPrice);
                totalPrice = itemQuantity * itemPrice;
                totalPriceCurr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalPrice); 
            }
            else if (itemName == "Benefit Cosmetics 24HR Brow Setter Brow Gel") {
                itemPrice = 26.00;
                itemPriceCurr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(itemPrice);
                totalPrice = itemQuantity * itemPrice;
                totalPriceCurr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalPrice); 
            }
            else if (itemName == "Tarte Maracuja Juicy Lip Balm") {
                itemPrice = 26.00;
                itemPriceCurr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(itemPrice);
                totalPrice = itemQuantity * itemPrice;
                totalPriceCurr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalPrice); 
            }
            else if (itemName == "Charlotte Tilbury Lip Cheat Lip Liner") {
                itemPrice = 25.00;
                itemPriceCurr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(itemPrice);
                totalPrice = itemQuantity * itemPrice;
                totalPriceCurr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalPrice); 
            }
            else if (itemName == "Huda Beauty Faux Filler Lip Gloss") {
                itemPrice = 19.00;
                itemPriceCurr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(itemPrice);
                totalPrice = itemQuantity * itemPrice;
                totalPriceCurr = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalPrice); 
            }
            let addedItem = {name: itemName, quantity: itemQuantity, invPriceNum: itemPrice, invPriceCurr: itemPriceCurr, 
                tPriceCurr: totalPriceCurr, tPriceNum: totalPrice};
            await client.db(databaseAndCollection.db)
            .collection(databaseAndCollection.collection)
            .insertOne(addedItem);
        
            let itemDetails = "<h1>Item Added To Cart</h1>";
            itemDetails += `<b>Item Added: </b>${addedItem.name}<br><b>Quantity: </b>${addedItem.quantity}<br>`;
            itemDetails += `<b>Price Per Item: </b>${addedItem.invPriceCurr}<br><b>Total Price: </b>${addedItem.tPriceCurr}<br>`;
            itemDetails += `<hr><b>Item added at ${date}</b><hr><a href=/>HOME</a>`;
            response.end(itemDetails);
        }
    } 
    catch (e) 
    {
        console.error(e);
        let date = new Date(); 
        let itemDetails = "<h1>Item Added To Cart</h1>";
        itemDetails += `<b>Item Added: </b>NONE<br><b>Quantity: </b>NONE<br>`;
        itemDetails += `<hr><b>Item(s) added at ${date}</b><hr><a href=/>HOME</a>`;
        response.end(itemDetails);
    } 
    finally 
    {
        await client.close();
    }          
}

app.post("/postRemoveFromCart", (request, response) => {
    postRemoveFromCartFunction(request,response);
});
async function postRemoveFromCartFunction(request, response) {
    const uri = `mongodb+srv://sfee:${password}@cluster0.cpvgcfu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, 
                    serverApi: ServerApiVersion.v1 });
    try {
        await client.connect();
        let date = new Date(); 
        let itemName = request.body.nameInput;
        let itemQuantity = request.body.quanInput;

        const filter = { name: itemName };
        const removedItem = await client.db(databaseAndCollection.db)
            .collection(databaseAndCollection.collection)
            .findOne(filter);
        
        let itemPrice = removedItem.invPriceNum;
        let totalPrice = itemPrice * itemQuantity;
        let totalPriceFormat = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalPrice);
        let itemTotal =  removedItem.tPriceNum;
        
        let itemDetails = "<h1>Item Removed From Cart</h1>";
        itemDetails += `<b>Item Removed: </b>${removedItem.name}<br><b>Quantity Removed: </b>${itemQuantity}<br>`;
        itemDetails += `<b>Price Per Item: </b>${removedItem.invPriceCurr}<br><b>Total Price: </b>${totalPriceFormat}<br>`;
        itemDetails += `<hr><b>Item(s) removed at ${date}</b><hr><a href=/>HOME</a>`;
        response.end(itemDetails);

        let updatedQuantity = removedItem.quantity - itemQuantity;

        if (updatedQuantity <= 0) {
            await client.db(databaseAndCollection.db)
            .collection(databaseAndCollection.collection)
            .deleteOne(removedItem);
        }
        else {
            const finder = {name: itemName};
            let adjustedTotal = itemTotal - totalPrice;
            let adjustedTotalFormat = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(adjustedTotal);
            const updater = {
                $set: { quantity: updatedQuantity, tPriceCurr: adjustedTotalFormat, tPriceNum: adjustedTotal }
            };
            const executeUpdate = await client.db(databaseAndCollection.db)
                .collection(databaseAndCollection.collection)
                .updateOne(finder, updater);
        }
    } 
    catch (e) 
    {
        console.error(e);
        let date = new Date(); 
        let itemDetails = "<h1>Item Removed From Cart</h1>";
        itemDetails += `<b>Item Removed: </b>NONE<br><b>Quantit Removed: </b>NONE<br>`;
        itemDetails += `<hr><b>Item removed at ${date}</b><hr><a href=/>HOME</a>`;
        response.end(itemDetails);
    } 
    finally 
    {
        await client.close();
    }               
}

app.post("/postCheckout", (request, response) => {
    postCheckoutFunction(request,response);
});
async function postCheckoutFunction(request, response) {
    const uri = `mongodb+srv://sfee:${password}@cluster0.cpvgcfu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, 
                    serverApi: ServerApiVersion.v1 });
    try {
        await client.connect();
        const connection = client.db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .find({});
        const result = await connection.toArray();

        let uniqueQuan = 0;
        let totalQuan = 0;
        let cartTotal = 0;
        let cartTotalFormat = "";
        let str = "<h1>Checkout</h1><table border='1'>";
        str += '<tr><th>Item</th><th>Item Price</th><th>Quantity</th><th>Total Price</th></tr>';
        result.forEach(elem => {
            const quan = Number(elem.quantity);
            str += `<tr><td>${elem.name}</td><td>${elem.invPriceCurr}</td><td>${elem.quantity}</td>
                <td>${elem.tPriceCurr}</td></tr>`;
            cartTotal += elem.tPriceNum;
            totalQuan += quan;
            uniqueQuan++;
        });
        str += '</table><br><br>';
        cartTotalFormat = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cartTotal); 
        str += `Your cart has been purchased at ${cartTotalFormat}. You have purchased ${uniqueQuan} unique item(s) 
            and ${totalQuan} item(s) in total.<br><br><a href=/>HOME</a>`;
        response.end(str);
        await client.db(databaseAndCollection.db)
        .collection(databaseAndCollection.collection)
        .deleteMany({});
    } 
    catch (e) 
    {
        console.error(e);
    } 
    finally 
    {
        await client.close();
    }          
}

console.log(`Web server started and running at http://localhost:${portNumber}`);
const prompt = "Stop to shutdown the server: ";
process.stdin.setEncoding("utf8");
process.stdout.write(prompt);
process.stdin.on("readable", function () {
const dataInput = process.stdin.read();
    if (dataInput !== null) {
        const command = dataInput.trim();
        if (command === "stop") {
            console.log("Shutting down the server");
            process.exit(0);
        }
    }
    process.stdout.write(prompt);
    process.stdin.resume();
});
