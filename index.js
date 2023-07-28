import express from "express";
import mongoose from "mongoose";
import _ from 'lodash';

const { Schema } = mongoose;
const app = express();
const port = process.env.port || 3000;
const username = process.env.MONGODB_USERNAME;
const password = process.env.MONGODB_PASSWORD;

const date = new Date();
const currentYear = date.getFullYear();
const options = { weekday: 'long', month: 'long', day: 'numeric' };
const formattedDate = date.toLocaleDateString("en-US", options);

mongoose.connect(`mongodb+srv://${username}:${password}@cluster0.c5dbd2e.mongodb.net/todolistDB`);

const itemsSchema = new Schema({
    name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome To Your ToDo List"
});

const item2 = new Item({
    name: "Hit the + button to add new item."
});

const item3 = new Item({
    name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = new Schema({
    name: String,
    items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);

app.use(express.urlencoded({ extended:true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
    Item.find()
    .then(foundItems => {
        if (foundItems.length === 0){
            Item.insertMany(defaultItems)
                .then(() => console.log("Successfully saved default items to DB"))
                .catch(err => console.log(err));
        }
    })
    .catch(err => console.log(err));
    Item.find()
        .then((foundItems) => {
            res.render("index.ejs", { tasks: foundItems, currentYear, listTitle: formattedDate });
        })
        .catch(err => console.log(err));
    
});

app.post("/addTask", (req, res) => {
    const itemName = req.body.newTask;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if (listName === formattedDate) {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({name: listName})
        .then(foundList => {
            foundList.items.push(item)
            foundList.save();
            res.redirect("/" + listName);
        })
        .catch(err => console.log(err));
    }

});

app.get("/:customListName", (req, res) => {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName})
    .then(foundList => {
        if (!foundList) {
            const list = new List({
                name: customListName,
                items: defaultItems
            });
            list.save();
            res.redirect("/" + customListName);
        } else {
            res.render("index.ejs", { tasks: foundList.items, listTitle: customListName, currentYear });
        }
    })
    .catch(err => console.log(err))



});

app.post("/delete", (req, res) => {
    const checkedItemID = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === formattedDate) {
        Item.findByIdAndRemove(checkedItemID)
        .catch(err => console.log(err))
        res.redirect("/");
    } else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemID}}})
        .then(foundList => {
            res.redirect("/" + listName);
        })
        .catch(err => console.log(err));
    }

})

app.post("/addWorkTask", (req, res) => {
    const newTask = req.body.newWorkTask;
    workTasks.push(newTask);
    res.redirect("/work");
});

app.listen(port, () => {
    console.log(`Port is running on server ${port}`);
});