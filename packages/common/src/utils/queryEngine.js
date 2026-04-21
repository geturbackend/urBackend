class QueryEngine {
    static QueryFilterError = class QueryFilterError extends Error {
        constructor(message) {
            super(message);
            this.name = 'QueryFilterError';
            this.statusCode = 400;
        }
    };

    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
        this.hasRegexFilter = false;
    }

    static EXCLUDED_FIELDS = ['page', 'sort', 'limit', 'fields', 'populate', 'expand', 'count', 'meta'];
    static MAX_REGEX_PATTERN_LENGTH = 128;
    static REGEX_MAX_TIME_MS = 2000;

    /**
     * Builds a MongoDB query object from the query string parameters.
     * Handles special suffixes like _gt, _gte, _lt, _lte, _ne, _in, _exists, _regex.
     * @param {boolean} excludeCount - Whether to explicitly exclude 'count' from the query (legacy parameter)
     * @returns {Object} MongoDB query object
     */
    _buildMongoQuery(excludeCount = false) {
        const queryObj = { ...this.queryString };
        this.hasRegexFilter = false;
        
        QueryEngine.EXCLUDED_FIELDS.forEach(el => delete queryObj[el]);

        const mongoQuery = {};
        for (const key in queryObj) {
            if (key.endsWith('_gt')) {
                const field = key.replace(/_gt$/, '');
                mongoQuery[field] = { ...mongoQuery[field], $gt: queryObj[key] };
            } else if (key.endsWith('_gte')) {
                const field = key.replace(/_gte$/, '');
                mongoQuery[field] = { ...mongoQuery[field], $gte: queryObj[key] };
            } else if (key.endsWith('_lt')) {
                const field = key.replace(/_lt$/, '');
                mongoQuery[field] = { ...mongoQuery[field], $lt: queryObj[key] };
            } else if (key.endsWith('_lte')) {
                const field = key.replace(/_lte$/, '');
                mongoQuery[field] = { ...mongoQuery[field], $lte: queryObj[key] };
            } else if (key.endsWith('_ne')) {
                const field = key.replace(/_ne$/, '');
                mongoQuery[field] = { ...mongoQuery[field], $ne: queryObj[key] };
            } else if (key.endsWith('_in')) {
                const field = key.replace(/_in$/, '');
                const rawValue = queryObj[key];
                // Handle both comma-separated strings and arrays (repeated params)
                const values = Array.isArray(rawValue) 
                    ? rawValue.flatMap(val => String(val).split(',')).map(val => val.trim()).filter(Boolean)
                    : String(rawValue).split(',').map(val => val.trim()).filter(Boolean);
                mongoQuery[field] = { ...mongoQuery[field], $in: values };
            } else if (key.endsWith('_exists')) {
                const field = key.replace(/_exists$/, '');
                const raw = queryObj[key];
                if (raw !== 'true' && raw !== 'false') {
                    throw new QueryEngine.QueryFilterError(`Invalid value for "${field}_exists"; expected "true" or "false".`);
                }
                mongoQuery[field] = { ...mongoQuery[field], $exists: raw === 'true' };
            } else if (key.endsWith('_regex')) {
                const field = key.replace(/_regex$/, '');
                try {
                    const pattern = String(queryObj[key]);
                    if (pattern.length > QueryEngine.MAX_REGEX_PATTERN_LENGTH) {
                        throw new QueryEngine.QueryFilterError(
                            `Regex pattern for "${field}_regex" exceeds ${QueryEngine.MAX_REGEX_PATTERN_LENGTH} characters.`,
                        );
                    }
                    const value = new RegExp(pattern, 'i');
                    mongoQuery[field] = { ...mongoQuery[field], $regex: value };
                    this.hasRegexFilter = true;
                } catch (e) {
                    if (e instanceof QueryEngine.QueryFilterError) throw e;
                    throw new QueryEngine.QueryFilterError(`Invalid regex pattern for "${field}_regex".`);
                }
            } else {
                mongoQuery[key] = queryObj[key];
            }
        }
        return mongoQuery;
    }

    filter() {
        this.query = this.query.find(this._buildMongoQuery(true));
        if (this.hasRegexFilter && typeof this.query.maxTimeMS === 'function') {
            this.query = this.query.maxTimeMS(QueryEngine.REGEX_MAX_TIME_MS);
        }
        return this;
    }

    sort() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').map(item => {
                const [field, order] = item.split(':');
                if (order && (order === '-1' || order.toLowerCase() === 'desc')) {
                    return `-${field}`;
                }
                return field;
            }).join(' ');
            
            this.query = this.query.sort(sortBy);
        } else {
            this.query = this.query.sort('-createdAt');
        }
        
        return this;
    }

    limitFields() {
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fields);
        } else {
            this.query = this.query.select('-__v');
        }

        if (this.queryString.meta === 'false') {
            this.query = this.query.select('-schemaVersion -createdAt -updatedAt -__v');
        }

        return this;
    }

    paginate() {
        const page = parseInt(this.queryString.page, 10) || 1;
        const limit = Math.min(parseInt(this.queryString.limit, 10) || 100, 100);
        const skip = (page - 1) * limit;

        this.query = this.query.skip(skip).limit(limit);
        
        return this;
    }

    populate() {
        const rawParam = this.queryString.populate || this.queryString.expand;
        if (!rawParam) return this;
        const populateParam = Array.isArray(rawParam) ? rawParam.join(',') : String(rawParam);
        const fields = populateParam.split(',').map(f => f.trim()).filter(Boolean);
        fields.forEach(f => {
            this.query = this.query.populate(f);
        });
        return this;
    }

    async count() {
        // Clone the query to avoid affecting the original query's skip/limit
        const countQuery = this.query.model.countDocuments(this.query.getQuery());
        if (this.hasRegexFilter && countQuery && typeof countQuery.maxTimeMS === 'function') {
            countQuery.maxTimeMS(QueryEngine.REGEX_MAX_TIME_MS);
        }
        return await countQuery;
    }
}

module.exports = QueryEngine;
