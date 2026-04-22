const redis = require("../config/redis");

async function setProjectByApiKeyCache(api, project) {
    if (redis.status !== "ready") return;

    try {
        console.time("cache stringify");
        const data = JSON.stringify(project);
        console.timeEnd("cache stringify");

        console.time("redis set");
        await redis.set(
            `project:apikey:${api}`,
            data,
            'EX',
            60 * 60 * 2
        );
        console.timeEnd("redis set");

    } catch (err) {
        console.log(err);
    }
}

async function getProjectByApiKeyCache(api) {
    if (redis.status !== "ready") return null;

    try {
        console.time("redis get");
        const data = await redis.get(`project:apikey:${api}`);
        console.timeEnd("redis get");

        if (!data) return null;

        console.time("cache parse");
        const parsedData = JSON.parse(data);
        console.timeEnd("cache parse");

        return parsedData;

    } catch (err) {
        console.log(err);
        return null;
    }
}

async function deleteProjectByApiKeyCache(api) {
    if (redis.status !== "ready") return;
    try {
        await redis.del(`project:apikey:${api}`);
    } catch (err) {
        console.log(err);
    }
}

async function setProjectById(id, project) {
    if (redis.status !== "ready") return;

    try {
        console.time("cache stringify by id");
        const data = JSON.stringify(project);
        console.timeEnd("cache stringify by id");

        console.time("redis set by id");
        await redis.set(
            `project:id:${id}`,
            data,
            'EX',
            60 * 60 * 2
        );
        console.timeEnd("redis set by id");

    } catch (err) {
        console.log(err);
    }
}

async function getProjectById(id) {
    if (redis.status !== "ready") return null;

    try {
        console.time("redis get by id");
        const data = await redis.get(`project:id:${id}`);
        console.timeEnd("redis get by id");

        if (!data) return null;

        console.time("cache parse by id");
        const parsedData = JSON.parse(data);
        console.timeEnd("cache parse by id");

        return parsedData;

    } catch (err) {
        console.log(err);
        return null;
    }
}

async function deleteProjectById(id) {
    if (redis.status !== "ready") return;
    try {
        await redis.del(`project:id:${id}`);
    } catch (err) {
        console.log(err);
    }
}

async function setDeveloperPlanCache(id, data) {
    if (redis.status !== "ready") return;
    try {
        await redis.set(
            `developer:plan:${id}`,
            JSON.stringify(data),
            'EX',
            60 * 5 // 5 minutes TTL as per plan.plan.md
        );
    } catch (err) {
        console.log(err);
    }
}

async function getDeveloperPlanCache(id) {
    if (redis.status !== "ready") return null;
    try {
        const data = await redis.get(`developer:plan:${id}`);
        return data ? JSON.parse(data) : null;
    } catch (err) {
        console.log(err);
        return null;
    }
}

async function deleteDeveloperPlanCache(id) {
    if (redis.status !== "ready") return;
    try {
        await redis.del(`developer:plan:${id}`);
    } catch (err) {
        console.log(err);
    }
}

module.exports = {
    setProjectByApiKeyCache,
    getProjectByApiKeyCache,
    deleteProjectByApiKeyCache,
    setProjectById,
    getProjectById,
    deleteProjectById,
    setDeveloperPlanCache,
    getDeveloperPlanCache,
    deleteDeveloperPlanCache
};