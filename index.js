import  Express  from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import _  from "lodash";

const app = Express();
const port = 3000;

app.set("view engine" , "ejs");

app.use(Express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect("mongodb://127.0.0.1:27017/todolistdb");

const itemsSchema = new mongoose.Schema({
    names: {
        type: String,
        required: true,
    },

});


const Item = mongoose.model("Item", itemsSchema);

const item = new Item({
    names : "Wakeup at 7.00 Am " 
});

const item2 = new Item({
    names : "Make up the Bed" 
});

const item3 = new Item({
    names : "and do morning duties" 
});

const defaultItems = [item,item2,item3];

const listSchema = new mongoose.Schema({
    names : String,
    items : [itemsSchema]
});

const List = mongoose.model("List", listSchema);

// Item.deleteMany({names: "Wakeup at 7.00 Am"});



app.get("/", (req, res) => {
    Item.find({})
    .then(function (foundItems){
        if(foundItems.length === 0){
             Item.insertMany(defaultItems);
        }else{
            res.render("index.ejs",{ FormattedDate : formattedDate , newItems: foundItems })
        }   
    }) 
    .catch(function(err){
        console.log(err);
    })
});


app.get("/:id",(req,res) => {
    const route = _.capitalize(req.params.id);

    List.findOne({names : route})
    .then(function(foundList){
        if(!foundList){
            const list = new List({
                names : route,
                items : defaultItems
            });
            list.save();
            console.log("saved");
            res.redirect("/" + route);
        }else{
            res.render("index.ejs",{FormattedDate : foundList.names , newItems: foundList.items})
            console.log("already have")
        }
    })
    .catch(function (error){
        console.log(err)
    });
   
});
// app.get("/work", (req, res) => {
//     res.render("work.ejs" ,{ workTasks})
// });

app.post("/submit", (req, res) => {
    const itemName  = req.body.newItem;
    const listName = req.body.list;

    const userItem = new Item({
        names : itemName,
    });

    if(listName === formattedDate){
        userItem.save();
        res.redirect("/");
    }else{
        List.findOne({ names: listName })
        .then((foundList) => {
          foundList.items.push(userItem);
          foundList.save();
          res.redirect("/" + listName);
        })
        .catch((err) => {
          console.error(err);
        });
    }
  });

// app.post("/submit2", (req, res) => {
//     const { newItem } = req.body;
//     if (newItem) {
//         workTasks.push(newItem);
//     }
//     res.redirect('/work');
// });

app.post("/delete",async (req,res) => {
    const checkboxId = (req.body.newItem);
    const listName = req.body.listName;
    if(listName === formattedDate){
        try{
            await Item.findByIdAndDelete(checkboxId);
            res.redirect("/");
        } catch (error) {
            console.log(error);
        }   
    }else{
        List.findOne({names: listName})
        .then(foundList =>{
            foundList.items.pull({_id: checkboxId});
            foundList.save();
            res.redirect("/" + listName);
        })
        .catch(err => {
            console.log(err);
        });
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

    const formattedString = `${dayName}, ${month} ${dayNumber}`;

    return formattedString;
}

const currentDate = new Date();
const formattedDate = formatDate(currentDate);
