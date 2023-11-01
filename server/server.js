const express = require("express");
const cors = require("cors");
const bodyparser = require("body-parser");
const path = require("path");
const http = require("http");

const app = express();

app.use(bodyparser.urlencoded({ extended: false }));
app.use(bodyparser.json());

app.use(express.static(path.join(_dirname, "dist")));

app.use(cors({ origin: true, credentials: true }));

const stripe = require("stripe")(
  "sk_test_51O4kHLDBNF3PwfuVr5DiekqkBNHFXLNI1UXzClhTV0jsi1If4t4zbvKZb2qx7tu3bsS4ij4wf30r68pllTUAWe0h00JKufCM7l"
);

const port = process.env.PORT || "4242";
app.set("port", port);

app.post("/checkout", async (req, res, next) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      shipping_address_collection: {
        allowed_countries: ["US", "CA"],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: 0,
              currency: "usd",
            },
            display_name: "Free shipping",
            // Delivers between 5-7 business days
            delivery_estimate: {
              minimum: {
                unit: "business_day",
                value: 5,
              },
              maximum: {
                unit: "business_day",
                value: 7,
              },
            },
          },
        },
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: {
              amount: 1500,
              currency: "usd",
            },
            display_name: "Next day air",
            // Delivers in exactly 1 business day
            delivery_estimate: {
              minimum: {
                unit: "business_day",
                value: 1,
              },
              maximum: {
                unit: "business_day",
                value: 1,
              },
            },
          },
        },
      ],
      line_items: req.body.items.map((item) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: item.name,
            images: [item.product],
          },
          unit_amount: item.price * 100,
        },
        quantity: item.quantity,
      })),
      mode: "payment",
      success_url: `http://localhost:${port}}/success.html`,
      cancel_url: `http://localhost:${port}/cancel.html`,
    });

    res.status(200).json(session);
  } catch (error) {
    next(error);
  }
});

const server = http.createServer(app);

server.listen(port, () => console.log(`API running on localhost:${port}`));

// app.listen(4242, () => console.log("app is running on 4242"));
