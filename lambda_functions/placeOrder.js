import {
  DynamoDBClient,
  QueryCommand,
  TransactWriteItemsCommand
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

    // =========================
    // 1. GET CART ITEMS
    // =========================
    const cartData = await client.send(new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
      ExpressionAttributeValues: {
        ":pk": { S: `USER#${userId}` },
        ":sk": { S: "CART#" }
      }
    }));

    if (!cartData.Items || cartData.Items.length === 0) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ message: "Cart is empty" })
      };
    }

    const orderId = Date.now().toString();
    const transactItems = [];
    const orderItems = [];

    // =========================
    // 2. PROCESS CART ITEMS
    // =========================
    for (const item of cartData.Items) {
      const productId = item.productId?.S;
      const quantity = Number(item.quantity?.N || 0);

      if (!productId || quantity <= 0) continue;

      // =========================
      // 3. GET INVENTORY
      // =========================
      const inventory = await client.send(new QueryCommand({
        TableName: tableName,
        KeyConditionExpression: "PK = :pk AND SK = :sk",
        ExpressionAttributeValues: {
          ":pk": { S: `PRODUCT#${productId}` },
          ":sk": { S: "INVENTORY" }
        }
      }));

      if (!inventory.Items || inventory.Items.length === 0) {
        throw new Error(`Inventory not found for product ${productId}`);
      }

      const stock = Number(inventory.Items[0].stock?.N || 0);

      // ❌ Prevent oversell
      if (stock < quantity) {
        throw new Error(`Insufficient stock for product ${productId}`);
      }

      // =========================
      // UPDATE STOCK (Atomic)
      // =========================
      transactItems.push({
        Update: {
          TableName: tableName,
          Key: {
            PK: { S: `PRODUCT#${productId}` },
            SK: { S: "INVENTORY" }
          },
          UpdateExpression: "SET stock = stock - :q",
          ConditionExpression: "stock >= :q",
          ExpressionAttributeValues: {
            ":q": { N: String(quantity) }
          }
        }
      });

      // =========================
      // REMOVE FROM CART
      // =========================
      transactItems.push({
        Delete: {
          TableName: tableName,
          Key: {
            PK: item.PK,
            SK: item.SK
          }
        }
      });

      // =========================
      // ADD TO ORDER ITEMS
      // =========================
      orderItems.push({
        M: {
          productId: { S: productId },
          quantity: { N: String(quantity) }
        }
      });
    }

    // =========================
    // CREATE ORDER RECORD
    // =========================
    transactItems.push({
      Put: {
        TableName: tableName,
        Item: {
          PK: { S: `USER#${userId}` },
          SK: { S: `ORDER#${orderId}` },
          status: { S: "PLACED" },
          items: { L: orderItems }
        }
      }
    });

    // =========================
    // EXECUTE TRANSACTION
    // =========================
    await client.send(new TransactWriteItemsCommand({
      TransactItems: transactItems
    }));

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ orderId })
    };

  } catch (error) {
    console.error("OrderPlacement Error:", error);

    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        error: "Internal Server Error"
      })
    };
  }
};