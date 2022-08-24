const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// Check if data has specified property, propertyName is parameter for this function.
function bodyDataHas(propertyName) {
  return function (req, res, next) {
    const { data = {} } = req.body;
    if (data[propertyName]) {
      return next();
    }
    next({ status: 400, message: `Order must include a ${propertyName}` });
  };
}

function dishQuantityExists(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  const index = dishes.findIndex((dish) => !dish.quantity);
  // If dish quantity exists then proceed next, otherwise return error below.
  if (index >= 0) {
    next({
      status: 400,
      message: `Dish ${index} must have a quantity that is an integer greater than 0`,
    });
  }
  return next();
}

function dishQuantityIsInteger(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  const index = dishes.findIndex((dish) => !Number.isInteger(dish.quantity));

  // If the dishes quantity is an integer proceed next, otherwise return the error below
  if (index >= 0) {
    next({
      status: 400,
      message: `Dish ${index} must have a quantity that is an integer greater than 0`,
    });
  }
  return next();
}

function dishExists(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  // If dishes is not an array and if it's empty return the error below
  if (!Array.isArray(dishes) || dishes.length === 0) {
    next({
      status: 400,
      message: `Order must include at least one dish`,
    });
  }
  return next();
}

function idIsValid(req, res, next) {
  const { data: { id } = {} } = req.body;
  // Check if ID was entered
  if (id) {
    // If ID was entered and matches route execute Next
    if (id == res.locals.order.id) {
      return next();
    }
    // If Id was entered and doesn't match route then return this error
    next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${res.locals.order.id}`,
    });
  }
  // If ID was not entered proceed Next
  return next();
}

// Check if order exists in array
function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  // If order is in array then proceed to next and assign the found order to res.locals.order
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }

  // If order is not in array return the error below
  return next({
    status: 404,
    message: `Order ID not found: ${orderId}`,
  });
}

function statusExists(req, res, next) {
  const { data: { status } = {} } = req.body;
  // If status is any of the following 4 then proceed to Next
  if (
    status === "pending" ||
    status === "preparing" ||
    status === "out-for-delivery" ||
    status === "delivered"
  ) {
    return next();
  }
  // If status is not any of the 4 above then return the error below
  next({
    status: 400,
    message:
      "Order must have a status of pending, preparing, out-for-delivery, delivered",
  });
}

// Find if Status is pending
function statusPending(req, res, next) {
  const status = res.locals.order.status;
  // If status is pending then proceed Next
  if (status === "pending") {
    return next();
  }
  // If status is NOT Pending then return this error
  return next({
    status: 400,
    message: "An order cannot be deleted unless it is pending",
  });
}

function list(req, res) {
  res.json({ data: orders });
}

function create(req, res) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  // New order data structure
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status,
    dishes,
  };
  // Pusing new order to orders array
  orders.push(newOrder);
  // Return code 201 with new order as json response
  res.status(201).json({ data: newOrder });
}

function read(req, res) {
  res.json({ data: res.locals.order });
}

function update(req, res) {
  const order = res.locals.order;
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;

  // Updating all required fields for order
  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.status = status;
  order.dishes = dishes;

  // Responding with the updated json data
  res.json({ data: order });
}

function destroy(req, res) {
  const orderId = res.locals.order.id;
  // finding the index of the order ID requested to delete
  const index = orders.findIndex((order) => order.id === orderId);
  const deletedOrder = orders.splice(index, 1);

  // Respond with 204 once delete occurs
  res.sendStatus(204);
}

module.exports = {
  list,
  create: [
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("dishes"),
    dishExists,
    dishQuantityExists,
    dishQuantityIsInteger,
    create,
  ],
  read: [orderExists, read],
  update: [
    orderExists,
    bodyDataHas("deliverTo"),
    bodyDataHas("mobileNumber"),
    bodyDataHas("dishes"),
    dishExists,
    dishQuantityExists,
    dishQuantityIsInteger,
    idIsValid,
    statusExists,
    update,
  ],
  delete: [orderExists, statusPending, destroy],
};
