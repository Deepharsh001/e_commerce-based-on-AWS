# 🛒 Serverless E-Commerce on AWS (Cognito + API Gateway + Lambda + DynamoDB)

## 🚀 Overview

This project is a **fully serverless e-commerce web app** built on AWS using:

* Amazon S3 → Frontend hosting
* Amazon CloudFront → CDN + HTTPS
* Amazon API Gateway → REST APIs
* AWS Lambda → Backend logic
* Amazon DynamoDB → Database
* Amazon Cognito → Authentication

---

# 📦 Features

* User authentication (Signup/Login)
* Product listing
* Add to cart / remove / clear cart
* Place order
* Per-user order history (isolated via Cognito)
* Serverless architecture (no servers)

---

# 🏗️ Architecture Flow

```text
Frontend (S3 + CloudFront)
        ↓
API Gateway (JWT Authorizer)
        ↓
Lambda Functions
        ↓
DynamoDB (Single Table Design)
```

---

# ⚙️ SETUP GUIDE (STEP-BY-STEP)

---

## 🔹 1. Create DynamoDB Table

Go to:
👉 Amazon DynamoDB

Create table:

```text
Table Name: EcommerceTable
Partition Key (PK): String
Sort Key (SK): String
```

---

## 🔹 2. Insert Sample Products

Each product needs **2 entries**:

### Product INFO

```json
{
  "PK": "PRODUCT#p1",
  "SK": "INFO",
  "name": "Laptop",
  "price": 50000,
  "GSI1PK": "PRODUCT"
}
```

### Product INVENTORY

```json
{
  "PK": "PRODUCT#p1",
  "SK": "INVENTORY",
  "stock": 10
}
```

---

## 🔹 3. Setup Cognito

Go to:
👉 Amazon Cognito

### Create User Pool

* Enable email login
* Create App Client (NO secret)

---

### Configure Login Pages

* OAuth Flow → ✅ Implicit grant
* Scopes → `openid`, `email`
* Callback URL:

```text
https://your-cloudfront-url/
```

---

### Create Domain

Example:

```text
https://yourdomain.auth.us-east-1.amazoncognito.com
```

---

## 🔹 4. Setup API Gateway

Go to:
👉 Amazon API Gateway

---

### Create HTTP API

---

### Create JWT Authorizer

* Issuer:

```text
https://cognito-idp.us-east-1.amazonaws.com/YOUR_POOL_ID
```

* Audience:

```text
YOUR_CLIENT_ID
```

---

## 🔹 5. Create Lambda Functions

Go to:
👉 AWS Lambda

---

### Required APIs

| API            | Purpose         |
| -------------- | --------------- |
| `/products`    | Get products    |
| `/cart/add`    | Add item        |
| `/cart/manage` | Remove/clear    |
| `/order/place` | Place order     |
| `/orders`      | Get user orders |

---

### IMPORTANT

In ALL secured Lambdas:

```javascript
const user = event.requestContext.authorizer.jwt.claims;
const userId = user.sub;
```

❌ Never take `userId` from frontend

---

## 🔹 6. Attach Authorizer

Attach JWT Authorizer to:

```text
/cart/add
/cart/manage
/order/place
/orders
```

---

## 🔹 7. Deploy API

Click:

```text
Deploy API
```

---

## 🔹 8. Setup Frontend Hosting

Upload frontend to:
👉 Amazon S3

Enable:

* Static website hosting

---

## 🔹 9. Setup CloudFront

Use:
👉 Amazon CloudFront

* Origin → S3 bucket
* Enable HTTPS

---

## 🔹 10. Configure Frontend Auth

### Login Function

```javascript
function login() {
  window.location.href =
    "https://YOUR_DOMAIN.auth.us-east-1.amazoncognito.com/login" +
    "?client_id=YOUR_CLIENT_ID" +
    "&response_type=token" +
    "&scope=email+openid" +
    "&redirect_uri=YOUR_CLOUDFRONT_URL";
}
```

---

### Handle Token

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

### API Call with Token

```javascript
fetch(API_URL, {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`
  }
});
```

---

# 🔐 Security Notes

* Never trust frontend `userId`
* Always use Cognito JWT (`sub`)
* Protect APIs with JWT authorizer

---

# 🧪 Testing Checklist

* [ ] Login works
* [ ] Token stored in localStorage
* [ ] Add to cart works
* [ ] Different users see different carts
* [ ] Orders stored per user
* [ ] Order history is user-specific

---

# 🚫 Common Mistakes

* ❌ Wrong client_id in frontend
* ❌ Missing JWT authorizer
* ❌ Using localStorage for orders
* ❌ Missing `GSI1PK` in products
* ❌ Not deploying API after changes

---

# 🚀 Future Improvements

* Admin panel for product management
* Payment integration
* Product images
* Search & filtering
* Inventory auto-sync

---

# 🧠 Final Note

This project demonstrates:

```text
Real-world scalable serverless architecture
```

👉 You are NOT building a demo
👉 You are building a **production-ready backend system**

---
