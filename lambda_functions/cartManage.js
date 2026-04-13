import {
  DynamoDBClient,
  DeleteItemCommand,
  QueryCommand,
  BatchWriteItemCommand
} from "@aws-sdk/client-dynamodb";

// Initialize DynamoDB client (region via environment)
const client = new DynamoDBClient({});

export const handler = async (event) => {
  try {
    const tableName = process.env.TABLE_NAME || "EcommerceTable";
    const body = JSON.parse(event.body || "{}");

    // 🔐 Extract user from JWT (API Gateway authorizer)
    const user = event.requestContext?.authorizer?.jwt?.claims;
    const userId = user?.sub;

    if (!userId) {
      return {
        statusCode: 401,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Unauthorized" })
      };
    }

    const { action, productId } = body;

    // =========================
    // REMOVE SINGLE ITEM
    // =========================
    if (action === "remove") {
      if (!productId) {
        return {
          statusCode: 400,
          headers: { "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify({ error: "productId required" })
        };
      }

      await client.send(new DeleteItemCommand({
        TableName: tableName,
        Key: {
          PK: { S: `USER#${userId}` },
          SK: { S: `CART#${productId}` }
        }
      }));

      return {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ message: "Item removed" })
      };
    }

    // =========================
    // CLEAR CART
    // =========================
    if (action === "clear") {
      const cart = await client.send(new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
        ExpressionAttributeValues: {
          ":pk": { S: `USER#${userId}` },
          ":sk": { S: "CART#" }
        }
      }));

      if (!cart.Items || cart.Items.length === 0) {
        return {
          statusCode: 200,
          headers: { "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify({ message: "Cart already empty" })
        };
      }

      const deleteRequests = cart.Items.map(item => ({
        DeleteRequest: {
          Key: {
            PK: item.PK,
            SK: item.SK
          }
        }
      }));

      await client.send(new BatchWriteItemCommand({
        RequestItems: {
          [tableName]: deleteRequests
        }
      }));

      return {
        statusCode: 200,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ message: "Cart cleared" })
      };
    }

    // =========================
    // INVALID ACTION
    // =========================
    return {
      statusCode: 400,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Invalid action" })
    };

  } catch (error) {
    console.error("CartManage Error:", error);

    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        error: "Internal Server Error"
      })
    };
  }
};