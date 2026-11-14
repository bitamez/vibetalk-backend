require("dotenv").config();

const pool = require("./config/db");

async function testDB() {
  try {
    const result = await pool.query(
      "SELECT NOW(), current_database(), current_user"
    );

    console.log("DATABASE CONNECTION SUCCESSFUL!");
    console.log(result.rows[0]);
  } catch (error) {
    console.log("DATABASE CONNECTION FAILED!");
    console.error(error.message);
  } finally {
    await pool.end();
  }
}

testDB();