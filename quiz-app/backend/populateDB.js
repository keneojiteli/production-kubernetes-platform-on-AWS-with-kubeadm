require("dotenv").config();

const mongoose = require("mongoose");

const Question = require("./Question");
const { data } = require("./data");

const MONGO_CONNECTION_OPTIONS = {
  serverSelectionTimeoutMS: 10_000,
  connectTimeoutMS: 10_000,
};

function validateConfiguration() {
  if (!process.env.MONGO_URI) {
    throw new Error(
      "MONGO_URI environment variable is not configured"
    );
  }

  if (process.env.ALLOW_DB_RESET !== "true") {
    throw new Error(
      "Database reset blocked. Set ALLOW_DB_RESET=true to run this script."
    );
  }
}

function validateSeedData(seedData) {
  if (!Array.isArray(seedData)) {
    throw new TypeError(
      "Expected data imported from ./data to be an array"
    );
  }

  if (seedData.length === 0) {
    throw new Error(
      "Seed data is empty. Database population was cancelled to prevent accidental data loss."
    );
  }

  const invalidRecordIndex = seedData.findIndex(
    (question) =>
      question === null ||
      typeof question !== "object" ||
      Array.isArray(question)
  );

  if (invalidRecordIndex !== -1) {
    throw new TypeError(
      `Invalid question record found at array index ${invalidRecordIndex}`
    );
  }
}

async function connectToDatabase() {
  console.log("Connecting to MongoDB...");

  await mongoose.connect(
    process.env.MONGO_URI,
    MONGO_CONNECTION_OPTIONS
  );

  console.log("Connected to MongoDB");
}

async function replaceQuestions(session) {
  let deletedCount = 0;
  let insertedCount = 0;

  /*
   * The transaction ensures that deleting and inserting behave as one
   * operation. If insertion fails, MongoDB rolls back the deletion.
   */
  await session.withTransaction(async () => {
    const deleteResult = await Question.deleteMany(
      {},
      { session }
    );

    deletedCount = deleteResult.deletedCount;

    const insertedQuestions = await Question.insertMany(data, {
      session,
      ordered: true,
    });

    insertedCount = insertedQuestions.length;
  });

  return {
    deletedCount,
    insertedCount,
  };
}

async function closeDatabaseConnection() {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB");
}

async function populateDatabase() {
  let session;

  try {
    validateConfiguration();
    validateSeedData(data);

    console.log(`Validated ${data.length} question record(s)`);

    await connectToDatabase();

    session = await mongoose.startSession();

    console.log("Starting database population transaction...");

    const result = await replaceQuestions(session);

    console.log(
      `Deleted ${result.deletedCount} existing question(s)`
    );

    console.log(
      `Imported ${result.insertedCount} question(s) successfully`
    );

    console.log("Database population transaction committed");
  } catch (error) {
    console.error("Database population failed:", error);

    process.exitCode = 1;
  } finally {
    if (session) {
      try {
        await session.endSession();
      } catch (sessionError) {
        console.error(
          "Failed to close MongoDB session:",
          sessionError
        );

        process.exitCode = 1;
      }
    }

    try {
      await closeDatabaseConnection();
    } catch (disconnectError) {
      console.error(
        "Failed to close MongoDB connection:",
        disconnectError
      );

      process.exitCode = 1;
    }
  }
}

populateDatabase();

// require("dotenv").config();

// const mongoose = require("mongoose");

// const Question = require("./Question");
// const { data } = require("./data");

// /**
//  * Connect once, replace the existing quiz questions,
//  * and disconnect whether the operation succeeds or fails.
//  */

// async function populateDatabase() {
//   const session = await mongoose.startSession();

//   try {
//     const mongoUri = process.env.MONGO_URI;

//     if (!mongoUri) {
//       throw new Error("MONGO_URI environment variable is not configured");
//     }

//     if (!Array.isArray(data) || data.length === 0) {
//       throw new TypeError(
//         "Expected data imported from ./data to be a non-empty array"
//       );
//     }

//     console.log("Connecting to MongoDB...");

//     await mongoose.connect(mongoUri, {
//       serverSelectionTimeoutMS: 10_000,
//       connectTimeoutMS: 10_000,
//     });

//     console.log("Connected to MongoDB");

//     await session.withTransaction(async () => {
//       const deleteResult = await Question.deleteMany({}).session(session);

//       console.log(
//         `Deleted ${deleteResult.deletedCount} existing question(s)`
//       );

//       const insertedQuestions = await Question.insertMany(data, {
//         session,
//         ordered: true,
//       });

//       console.log(
//         `Imported ${insertedQuestions.length} question(s) successfully`
//       );
//     });

//     console.log("Database population transaction committed");
//   } catch (error) {
//     console.error("Database population failed:", error);
//     process.exitCode = 1;
//   } finally {
//     await session.endSession();

//     try {
//       await mongoose.disconnect();
//       console.log("Disconnected from MongoDB");
//     } catch (disconnectError) {
//       console.error(
//         "Failed to close MongoDB connection:",
//         disconnectError
//       );
//       process.exitCode = 1;
//     }
//   }
// }
