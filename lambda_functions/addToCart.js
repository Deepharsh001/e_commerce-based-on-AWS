import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

// Initialize DynamoDB client (region will be picked from environment)
const client = new DynamoDBClient({});

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");

    // 🔐 Extract user identity from JWT (via API Gateway authorizer)
    const user = event.requestContext?.authorizer?.jwt?.claims;
    const userId = user?.sub;

    if (!userId) {
      return {
        statusCode: 401,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Unauthorized" })
      };
    }

    const { productId, quantity } = body;

    // ✅ Basic validation
    if (!productId || !quantity) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          error: "productId and quantity are required"
        })
      };
    }

    // 📦 Prepare DynamoDB item
    const params = {
      TableName: process.env.TABLE_NAME || "EcommerceTable", // env variable for flexibility
      Item: {
        PK: { S: `USER#${userId}` },
        SK: { S: `CART#${productId}` },
        productId: { S: productId },
        quantity: { N: String(quantity) }
      }
    };

    await client.send(new PutItemCommand(params));

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        message: "Item added to cart"
      })
    };

  } catch (error) {
    console.error("AddToCart Error:", error);

    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        error: "Internal Server Error"
      })
    };
  }
};