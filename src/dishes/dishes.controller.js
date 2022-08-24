const path = require("path")

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"))

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId")

// TODO: Implement the /dishes handlers needed to make the tests pass

// Check if Dish exists in array
function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId)
  if (foundDish) {
    res.locals.dish = foundDish
    return next()
  }
  next({
    status: 404,
    message: `Dish ID not found: ${dishId}`,
  })
}

// Check if data has specified property, propertyName is parameter for this function.
function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next()
    }
    next({ status: 400, message: `Dish must include a ${propertyName}` })
  };
}

function priceIsValid(req, res, next) {
  const { data: { price } = {} } = req.body;
  // Checking if price is below 0 and a valid interger
  if (price < 0 || !Number.isInteger(price)) {
    return next({
      status: 400,
      message: `Dish must have a price that is an integer greater than 0`,
    })
  }
  next()
}

function idIsValid(req, res, next) {
  const { data: { id } = {} } = req.body;
  // Check if ID was entered
  if (id) {
    // If ID was entered and matches route execute Next()
    if (id == res.locals.dish.id) {
      return next();
    }
    // If ID was entered and doesn't match route then return this error
    next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${res.locals.dish.id}`,
    });
  }
  // If ID was not entered proceed Next()
  return next();
}

function list(req, res) {
  res.json({ data: dishes });
}

// Create a new dish
function create(req, res) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  // new dish structure
  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };
  // Push new dish to dishes array
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function update(req, res) {
  const dish = res.locals.dish;
  const { data: { name, description, price, image_url } = {} } = req.body;

  // Updating all required fields
  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;

  // Responding with the updated json data
  res.json({ data: dish });
}

function read(req, res) {
  res.json({ data: res.locals.dish });
}

module.exports = {
  create: [
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    bodyDataHas("image_url"),
    priceIsValid,
    create,
  ],
  list,
  read: [dishExists, read],
  update: [
    dishExists,
    bodyDataHas("name"),
    bodyDataHas("description"),
    bodyDataHas("price"),
    bodyDataHas("image_url"),
    priceIsValid,
    idIsValid,
    update,
  ],
};
