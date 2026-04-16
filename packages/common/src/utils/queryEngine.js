class QueryEngine {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    static EXCLUDED_FIELDS = ['page', 'sort', 'limit', 'fields', 'populate', 'expand', 'count'];

    /**
     * Builds a MongoDB query object from the query string parameters.
     * Handles special suffixes like _gt, _gte, _lt, _lte.
     * @param {boolean} excludeCount - Whether to explicitly exclude 'count' from the query (legacy parameter)
     * @returns {Object} MongoDB query object
     */
    _buildMongoQuery(excludeCount = false) {
        const queryObj = { ...this.queryString };
        
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
            } else {
                mongoQuery[key] = queryObj[key];
            }
        }
        return mongoQuery;
    }

    filter() {
        this.query = this.query.find(this._buildMongoQuery(true));
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
        return await this.query.model.countDocuments(this.query.getQuery());
    }
}

module.exports = QueryEngine;
