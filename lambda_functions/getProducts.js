import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

// Initialize DynamoDB client (region via environment)
const client = new DynamoDBClient({});

export const handler = async () => {
  try {
    const tableName = process.env.TABLE_NAME || "EcommerceTable";

    // 🔄 Fetch all items with pagination
    let items = [];
    let lastKey = undefined;

    do {
      const result = await client.send(new ScanCommand({
        TableName: tableName,
        ExclusiveStartKey: lastKey
      }));

      items = items.concat(result.Items || []);
      lastKey = result.LastEvaluatedKey;

    } while (lastKey);

    // 🧠 Transform DynamoDB structure → clean product objects
    const productMap = {};

    items.forEach(item => {
      const pk = item?.PK?.S;
      const sk = item?.SK?.S;

      if (!pk || !sk) return;
      if (!pk.startsWith("PRODUCT#")) return;

      const id = pk.split("#")[1];

      if (!productMap[id]) {
        productMap[id] = {
          id,
          name: "",
          price: 0,
          stock: 0
        };
      }

      if (sk === "INFO") {
        productMap[id].name = item.name?.S || "Product";
        productMap[id].price = Number(item.price?.N || 0);
      }

      if (sk === "INVENTORY") {
        productMap[id].stock = Number(item.stock?.N || 0);
      }
    });

    const products = Object.values(productMap);

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify(products)
    };

  } catch (error) {
    console.error("GetProducts Error:", error);

    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        error: "Internal Server Error"
      })
    };
  }
};