import { describe, expect, it } from "vitest";
import * as schema from "../src/db/schema";

describe("database schema", () => {
  it("exports model definitions", () => {
    expect(Object.keys(schema).length).toBeGreaterThan(0);
  });
});
