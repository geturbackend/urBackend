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

  describe("getActivationFunnel", () => {
    it("should return status of activation funnel steps", async () => {
      mockPlatformEventFind.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([
          { event: "signup_completed", timestamp: "2026-06-10T00:00:00Z" },
          { event: "email_verified", timestamp: "2026-06-10T00:05:00Z" },
        ]),
      });

      await controller.getActivationFunnel(req, res, next);

      expect(res.json).toHaveBeenCalledTimes(1);
      const responseData = res.json.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      const steps = responseData.data.steps;
      expect(steps[0]).toEqual({
        step: "signup_completed",
        order: 1,
        completed: true,
        completedAt: "2026-06-10T00:00:00Z",
      });
      expect(steps[1]).toEqual({
        step: "email_verified",
        order: 2,
        completed: true,
        completedAt: "2026-06-10T00:05:00Z",
      });
      expect(steps[2]).toEqual({
        step: "project_created",
        order: 3,
        completed: false,
        completedAt: null,
      });
    });
  });

  describe("getRetention", () => {
    it("should return d1/d7/d30 retention flags", async () => {
      mockPlatformEventFindOne.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue({
          timestamp: "2026-06-10T12:00:00Z",
        }),
      });

      mockDeveloperActivityFindOne.mockImplementation(({ date }) => {
        return {
          lean: jest.fn().mockResolvedValue({ date }),
        };
      });

      await controller.getRetention(req, res, next);

      expect(res.json).toHaveBeenCalledTimes(1);
      const responseData = res.json.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data.d1).toBe(true);
      expect(responseData.data.d7).toBe(true);
      expect(responseData.data.d30).toBe(true);
    });

    it("should return false flags if no signup event exists", async () => {
      mockPlatformEventFindOne.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null),
      });

      await controller.getRetention(req, res, next);

      expect(res.json).toHaveBeenCalledTimes(1);
      const responseData = res.json.mock.calls[0][0];
      expect(responseData.data).toEqual({
        d1: false,
        d7: false,
        d30: false,
        signupDate: null,
      });
    });
  });

  describe("getEngagement", () => {
    it("should return aggregated engagement metrics", async () => {
      mockDeveloperActivityAggregate.mockResolvedValueOnce([
        {
          totalApiCalls: 500,
          totalMailSent: 50,
          totalStorageUploads: 10,
          totalWebhooksFired: 5,
          activeDays: 3,
          allProjectIds: [["proj1"], ["proj2", "proj1"]],
        },
      ]);

      await controller.getEngagement(req, res, next);

      expect(res.json).toHaveBeenCalledTimes(1);
      const responseData = res.json.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data).toEqual({
        window: "30d",
        totalApiCalls: 500,
        totalMailSent: 50,
        totalStorageUploads: 10,
        totalWebhooksFired: 5,
        activeDays: 3,
        uniqueActiveProjects: 2,
      });
    });
  });

  describe("getNorthStar", () => {
    it("should return north star metrics", async () => {
      mockProjectFind.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([
            { _id: "proj1", name: "Proj 1" },
            { _id: "proj2", name: "Proj 2" },
          ]),
        }),
      });

      mockLogDistinct.mockResolvedValueOnce(["proj1"]);

      await controller.getNorthStar(req, res, next);

      expect(res.json).toHaveBeenCalledTimes(1);
      const responseData = res.json.mock.calls[0][0];
      expect(responseData.success).toBe(true);
      expect(responseData.data).toEqual({
        activeProjects: 1,
        totalProjects: 2,
        percentage: 50,
      });
    });

    it("should return 0 metrics if developer has no projects", async () => {
      mockProjectFind.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([]),
        }),
      });

      await controller.getNorthStar(req, res, next);

      expect(res.json).toHaveBeenCalledTimes(1);
      const responseData = res.json.mock.calls[0][0];
      expect(responseData.data).toEqual({
        activeProjects: 0,
        totalProjects: 0,
        percentage: 0,
      });
    });
  });
});
