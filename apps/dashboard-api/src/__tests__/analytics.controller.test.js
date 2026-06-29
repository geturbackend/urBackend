"use strict";

const mongoose = require("mongoose");

class mockAppError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

class mockApiResponse {
  constructor(data, message = "") {
    this.data = data;
    this.message = message;
  }
  send(res) {
    return res.json({
      success: true,
      data: this.data,
      message: this.message,
    });
  }
}

const mockProjectAggregate = jest.fn();
const mockProjectFind = jest.fn();
const mockDeveloperFindById = jest.fn();
const mockLogCountDocuments = jest.fn();
const mockLogFind = jest.fn();
const mockLogDistinct = jest.fn();
const mockWebhookCountDocuments = jest.fn();
const mockGetConnection = jest.fn();
const mockPlatformEventFind = jest.fn();
const mockPlatformEventFindOne = jest.fn();
const mockDeveloperActivityFindOne = jest.fn();
const mockDeveloperActivityAggregate = jest.fn();

jest.mock("@urbackend/common", () => ({
  Project: {
    aggregate: mockProjectAggregate,
    find: mockProjectFind,
  },
  Developer: {
    findById: mockDeveloperFindById,
  },
  Log: {
    countDocuments: mockLogCountDocuments,
    find: mockLogFind,
    distinct: mockLogDistinct,
  },
  Webhook: {
    countDocuments: mockWebhookCountDocuments,
  },
  PlatformEvent: {
    find: mockPlatformEventFind,
    findOne: mockPlatformEventFindOne,
  },
  DeveloperActivity: {
    findOne: mockDeveloperActivityFindOne,
    aggregate: mockDeveloperActivityAggregate,
  },
  getConnection: mockGetConnection,
  resolveEffectivePlan: jest.fn((dev) => dev?.plan || "free"),
  getPlanLimits: jest.fn(() => ({ maxProjects: 5, maxCollections: 10 })),
  getProjectAccessQuery: jest.fn((userId) => ({ owner: userId })),
  AppError: mockAppError,
  ApiResponse: mockApiResponse,
}));

const controller = require("../controllers/analytics.controller");

describe("Analytics Controller", () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      user: { _id: new mongoose.Types.ObjectId().toString() },
    };
    res = {
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  describe("getGlobalStats", () => {
    it("should return aggregated global stats with user counts fetched in parallel", async () => {
      const userId = req.user._id;

      mockProjectAggregate.mockResolvedValueOnce([
        {
          _id: null,
          totalProjects: 2,
          totalDatabaseUsed: 100,
          totalStorageUsed: 200,
          totalCollections: 5,
        },
      ]);

      mockDeveloperFindById.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          plan: "pro",
          maxProjects: 10,
          maxCollections: 20,
          planExpiresAt: null,
        }),
      });

      mockProjectFind.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest
            .fn()
            .mockResolvedValue([
              { _id: new mongoose.Types.ObjectId("60c72b2f9b1d8b22fc5a87ba") },
              { _id: new mongoose.Types.ObjectId("60c72b2f9b1d8b22fc5a87bb") },
            ]),
        }),
      });

      mockLogCountDocuments.mockResolvedValueOnce(150);
      mockWebhookCountDocuments.mockResolvedValueOnce(25);

      const mockDbConn1 = {
        collection: jest.fn().mockReturnValue({
          countDocuments: jest.fn().mockResolvedValue(10),
        }),
      };
      const mockDbConn2 = {
        collection: jest.fn().mockReturnValue({
          countDocuments: jest.fn().mockResolvedValue(20),
        }),
      };

      let firstResolve;
      let secondConnectionStarted = false;
      const firstConnectionPromise = new Promise((resolve) => {
        firstResolve = resolve;
      });

      mockGetConnection
        .mockImplementationOnce(async (projectId) => {
          expect(projectId).toBe("60c72b2f9b1d8b22fc5a87ba");
          return firstConnectionPromise;
        })
        .mockImplementationOnce(async (projectId) => {
          expect(projectId).toBe("60c72b2f9b1d8b22fc5a87bb");
          secondConnectionStarted = true;
          return mockDbConn2;
        });

      const resultPromise = controller.getGlobalStats(req, res, next);
      await new Promise((resolve) => setImmediate(resolve));
      expect(secondConnectionStarted).toBe(true);

      firstResolve(mockDbConn1);
      await resultPromise;

      expect(mockGetConnection).toHaveBeenCalledTimes(2);
      expect(res.json).toHaveBeenCalledTimes(1);
      const responseData = res.json.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data.usage).toEqual({
        totalProjects: 2,
        totalCollections: 5,
        totalStorageUsed: 200,
        totalDatabaseUsed: 100,
        totalRequests: 150,
        totalWebhooks: 25,
        totalUsers: 30, // 10 + 20
      });
    });

    it("should handle db connection errors gracefully without failing the entire request", async () => {
      mockProjectAggregate.mockResolvedValueOnce([]);
      mockDeveloperFindById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });
      mockProjectFind.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest
            .fn()
            .mockResolvedValue([
              { _id: new mongoose.Types.ObjectId("60c72b2f9b1d8b22fc5a87bc") },
              { _id: new mongoose.Types.ObjectId("60c72b2f9b1d8b22fc5a87bd") },
            ]),
        }),
      });

      mockLogCountDocuments.mockResolvedValueOnce(0);
      mockWebhookCountDocuments.mockResolvedValueOnce(0);

      // First project connection fails, second succeeds
      const mockDbConn = {
        collection: jest.fn().mockReturnValue({
          countDocuments: jest.fn().mockResolvedValue(5),
        }),
      };
      mockGetConnection
        .mockRejectedValueOnce(new Error("Connection timeout"))
        .mockResolvedValueOnce(mockDbConn);

      await controller.getGlobalStats(req, res, next);

      expect(res.json).toHaveBeenCalledTimes(1);
      const responseData = res.json.mock.calls[0][0];
      expect(responseData.data.usage.totalUsers).toBe(5); // 0 + 5
    });
  });

  describe("getRecentActivity", () => {
    it("should return formatted recent logs", async () => {
      mockProjectFind.mockReturnValue({
        distinct: jest.fn().mockResolvedValue(["proj1"]),
      });

      mockLogFind.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([
          {
            _id: "log1",
            projectId: { _id: "proj1", name: "My Project" },
            method: "GET",
            path: "/api/users",
            status: 200,
            timestamp: "2026-06-17T00:00:00Z",
          },
        ]),
      });

      await controller.getRecentActivity(req, res, next);

      expect(res.json).toHaveBeenCalledTimes(1);
      const responseData = res.json.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data).toEqual([
        {
          id: "log1",
          projectName: "My Project",
          projectId: "proj1",
          method: "GET",
          path: "/api/users",
          status: 200,
          timestamp: "2026-06-17T00:00:00Z",
        },
      ]);
    });
  });

});

