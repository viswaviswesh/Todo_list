import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import _ from "lodash";

const app = express();
const port = process.env.PORT || 3000;

app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect(process.env.MONGODB_CONNECT_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const itemsSchema = new mongoose.Schema({
  names: {
    type: String,
    required: true
  }
});

const Item = mongoose.model("Item", itemsSchema);

const item = new Item({
  names: "Wakeup at 7.00 AM"
});

const item2 = new Item({
  names: "Make up the Bed"
});

const item3 = new Item({
  names: "and do morning duties"
});

const defaultItems = [item, item2, item3];

const listSchema = new mongoose.Schema({
  names: String,
  items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);

app.get("/", (req, res) => {
  Item.find({})
    .then(foundItems => {
      if (foundItems.length === 0) {
        return Item.insertMany(defaultItems);
      }
      return foundItems;
    })
    .then(foundItems => {
      res.render("index.ejs", { FormattedDate: formattedDate, newItems: foundItems });
    })
    .catch(err => {
      console.error(err);
      res.status(500).send("Internal Server Error");
    });
});

app.get("/:id", (req, res) => {
  const route = _.capitalize(req.params.id);

  List.findOne({ names: route })
    .then(foundList => {
      if (!foundList) {
        const list = new List({
          names: route,
          items: defaultItems
        });
        return list.save();
      }
      return foundList;
    })
    .then(foundList => {
      res.render("index.ejs", { FormattedDate: foundList.names, newItems: foundList.items });
    })
    .catch(err => {
      console.error(err);
      res.status(500).send("Internal Server Error");
    });
});

app.post("/submit", (req, res) => {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const userItem = new Item({
    names: itemName,
  });

  if (listName === formattedDate) {
    userItem.save();
    res.redirect("/");
  } else {
    List.findOne({ names: listName })
      .then(foundList => {
        foundList.items.push(userItem);
        return foundList.save();
      })
      .then(() => {
        res.redirect("/" + listName);
      })
      .catch(err => {
        console.error(err);
        res.status(500).send("Internal Server Error");
      });
  }
});

app.post("/delete", async (req, res) => {
  const checkboxId = req.body.newItem;
  const listName = req.body.listName;

  try {
    if (listName === formattedDate) {
      await Item.findByIdAndDelete(checkboxId);
    } else {
      const foundList = await List.findOne({ names: listName });
      foundList.items.pull({ _id: checkboxId });
      await foundList.save();
    }
    res.redirect(listName === formattedDate ? "/" : "/" + listName);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

function formatDate(date) {
  const months = [
    "January", "February", "March", "April",
    "May", "June", "July", "August",
    "September", "October", "November", "December"
  ];

  const days = [
    "Sunday", "Monday", "Tuesday", "Wednesday",
    "Thursday", "Friday", "Saturday"
  ];

  const month = months[date.getMonth()];
  const dayNumber = date.getDate();
  const dayName = days[date.getDay()];

  return `${dayName}, ${month} ${dayNumber}`;
}

const currentDate = new Date();
const formattedDate = formatDate(currentDate);
