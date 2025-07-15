import { refreshDatabaseConnection } from "./database/dbConnection";

export default async () => {
  // In CI, don't fail startup if database connection fails
  // The connection will be retried when needed
  if (process.env.CI) {
    console.log(
      "Running in CI - database connection will be established when needed",
    );
    return;
  }

  try {
    await refreshDatabaseConnection(false);
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        `Failed to connect to database during startup: ${error.message}`,
      );
      console.log(
        "Server will start anyway - database connection will be retried when needed",
      );
    } else {
      console.error("Unknown error connecting to database:", error);
    }
  }
};
