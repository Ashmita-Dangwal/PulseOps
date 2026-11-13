
import { jest } from "@jest/globals";
import logger from "../src/utils/logger.js";

describe("Winston Logger", () => {
  test("Should log an info message", () => {
    const spy = jest.spyOn(logger, "info").mockImplementation(() => {});

    logger.info("PulseOps logger test successful");

    expect(spy).toHaveBeenCalledWith(
      "PulseOps logger test successful"
    );

    spy.mockRestore();
  });

  test("Should log a warning message", () => {
    const spy = jest.spyOn(logger, "warn").mockImplementation(() => {});

    logger.warn("Warning test");

    expect(spy).toHaveBeenCalledWith("Warning test");

    spy.mockRestore();
  });

  test("Should log an error message", () => {
    const spy = jest.spyOn(logger, "error").mockImplementation(() => {});

    logger.error("Error test");

    expect(spy).toHaveBeenCalledWith("Error test");

    spy.mockRestore();
  });
});
