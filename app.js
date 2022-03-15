const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));


mongoose.connect('mongodb://localhost:27017/todolistDB');


  const itemSchema = new mongoose.Schema({
    name: {     // Validator
      type: String,
      required: [true, "Item name required"],
    }
  });

  // Name of the collection and its content
  const Item = mongoose.model("Item", itemSchema);


  const item1 = new Item({
    name: "Welcome to your todo list!"
  });

  const item2 = new Item({
    name: "Hit the + button to add new item"
  });

  const item3 = new Item({
    name: "<-- Hit this to delete an item"
  });

  const defaultItems = [item1, item2, item3];

  const listSchema = new mongoose.Schema({
    name: String,
    items: [itemSchema]
  });

  const List = mongoose.model("List", listSchema);

//Get the home route and render
app.get("/", function(req, res) {

  //Finds items in the Item model
  Item.find({}, (err, foundItems) => {
      //Checks if items is empty and inserts if it is
      if(foundItems.length === 0) {
        Item.insertMany(defaultItems, (err) => {
          if(err) {
            console.log(err);
          } else {
            console.log("Items succesfully inserted!");
          }
        });
        res.redirect("/");
      } else {
        res.render('list', {listTitle: "Today", newListItems: foundItems});
      }
  });
});

//Search for list name typed in the url - if found: show - if not: make it, save it and show it
app.get("/:customListName", (req,res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, (err, foundList) => {
    if(!err) {
      if(!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        res.render('list', {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });

});

app.post("/", function(req, res) {
  //Saves user input
  const itemName = req.body.newItem;
  const listName = req.body.list;

  //Make and add new document from user input
  const item = new Item ({
    name: itemName
  });

  //Checks if item is added from default list or custom list
  if (listName === "Today") {
    item.save();
    //redirects to / and runs function within
    res.redirect("/");
  } else {
    //finds the name of the custom list and redirects to the name of it
    List.findOne({name: listName}, (err, foundList) => {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
  }

})


app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, (err) => {
      if(err) {
        console.log(err);
      } else {
        console.log("Item deleted");
        res.redirect("/");
      }
    })
  } else {
    //Finds and pulls an item in the item array with the checkedItemId
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, (err, foundList) => {
      if(!err) {
        res.redirect("/" + listName);
      }
    })
  }


})


app.get("/about", function(req, res) {
  res.render("about");
})

//Prevents favicon from getting added as database entry
app.get('/favicon.ico', (req, res) => res.status(204).end());

app.listen(3000, function() {
  console.log("listening on port 3000");
})
