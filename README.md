# 🛒 Serverless E-Commerce App (AWS)

## 🚀 Overview

This project is a **fully serverless e-commerce application** built using AWS services.
It supports authentication, product browsing, cart management, and order placement — all without managing servers.

---

# 🧱 Tech Stack

* Amazon S3 — Frontend hosting
* Amazon CloudFront — CDN + HTTPS
* Amazon API Gateway — REST APIs
* AWS Lambda — Backend logic
* Amazon DynamoDB — Database (single-table design)
* Amazon Cognito — Authentication (JWT-based)

---

# ✨ Features

* 🔐 User authentication (Signup / Login)
* 🛍️ Product listing with stock
* 🛒 Add to cart / remove / clear cart
* 📦 Place order (transaction-safe)
* 👤 User-specific cart & orders (multi-user isolation)
* ⚡ Fully serverless (auto-scalable)

---

# 🏗️ Architecture

```text
CloudFront (Frontend)
        ↓
API Gateway (JWT Authorizer)
        ↓
Lambda Functions
        ↓
DynamoDB (Single Table)
```

---

# 🧩 Database Design (Single Table)

Table: `EcommerceTable`

| PK         | SK        | Description     |
| ---------- | --------- | --------------- |
| PRODUCT#id | INFO      | Product details |
| PRODUCT#id | INVENTORY | Stock           |
| USER#id    | CART#id   | Cart items      |
| USER#id    | ORDER#id  | Orders          |

---

# ⚙️ Setup Guide

---

## 🔹 1. DynamoDB Setup

Create table:

```text
Table Name: EcommerceTable
Partition Key: PK (String)
Sort Key: SK (String)
```

---

### Insert Sample Product

```json
{
  "PK": "PRODUCT#p1",
  "SK": "INFO",
  "name": "Laptop",
  "price": 50000,
  "GSI1PK": "PRODUCT"
}
```

```json
{
  "PK": "PRODUCT#p1",
  "SK": "INVENTORY",
  "stock": 10
}
```

---

## 🔹 2. Cognito Setup

Using Amazon Cognito:

* Create User Pool
* Create App Client (no secret)

### Configure Login Pages

* OAuth Flow → ✅ Implicit grant
* Scopes → `openid`, `email`
* Callback URL → your CloudFront URL

---

## 🔹 3. API Gateway Setup

Using Amazon API Gateway:

### Create HTTP API

---

### Create JWT Authorizer

* **Issuer**

```
https://cognito-idp.<region>.amazonaws.com/<user_pool_id>
```

* **Audience**

```
<client_id>
```

---

### Attach Authorizer to Routes

```
/cart/add
/cart/manage
/order/place
/orders
```

---

## 🔹 4. Lambda Functions

Using AWS Lambda

---

### Required APIs

| Endpoint       | Description         |
| -------------- | ------------------- |
| `/products`    | Fetch all products  |
| `/cart/add`    | Add to cart         |
| `/cart/manage` | Remove / clear cart |
| `/order/place` | Place order         |
| `/orders`      | Get user orders     |

---

### 🔐 Authentication Rule

In all protected Lambdas:

```javascript
const user = event.requestContext?.authorizer?.jwt?.claims;
const userId = user?.sub;
```

❌ Never trust frontend userId
✅ Always use JWT

---

## 🔹 5. Environment Variables

Create `.env` (DO NOT COMMIT):

```text
TABLE_NAME=EcommerceTable
```

Create `.env.example`:

```text
TABLE_NAME=EcommerceTable
```

---

## 🔹 6. Frontend Setup

Host on Amazon S3
Serve via Amazon CloudFront

---

### Login Function

```javascript
function login() {
  window.location.href =
    "https://<your-domain>.auth.<region>.amazoncognito.com/login" +
    "?client_id=<client_id>" +
    "&response_type=token" +
    "&scope=email+openid" +
    "&redirect_uri=<cloudfront_url>";
}
```

---

### Token Handling

```javascript
function handleAuth() {
  const hash = window.location.hash;

  if (hash.includes("id_token")) {
    const params = new URLSearchParams(hash.substring(1));
    const token = params.get("id_token");

    localStorage.setItem("token", token);
    window.location.hash = "";
  }
}
```

---

### API Call with Auth

```javascript
fetch(API_URL, {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`
  }
});
```

---

# 🧪 Testing Checklist

* [ ] Login works
* [ ] Token stored in localStorage
* [ ] Add to cart works
* [ ] Different users see different carts
* [ ] Orders stored per user
* [ ] Order history is user-specific
* [ ] Stock updates correctly

---

# 🚫 Common Mistakes

* ❌ Wrong client_id in frontend
* ❌ JWT authorizer not attached
* ❌ Using localStorage for orders
* ❌ Missing `GSI1PK` in products
* ❌ Not deploying API after changes
* ❌ Not sending Authorization header

---

# 🔐 Security Notes

* Never expose credentials
* Never trust frontend data
* Always validate JWT
* Use environment variables

---

# 🚀 Future Improvements

* Admin panel (add/edit products)
* Product images
* Payment gateway integration
* Order status tracking
* Search & filtering

---

# 🧠 Final Insight

This project demonstrates:

```text
Production-level serverless architecture with real authentication and data isolation
```

👉 Not a demo — a **real scalable backend system**

---
