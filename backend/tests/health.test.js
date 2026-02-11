const request = require("supertest");
const app = require("../app");

describe("Health Check API", () => {
  it("should return 200 and success message", async () => {
    const res = await request(app).get("/");

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("success");
  });
});
