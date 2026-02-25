class QueryEngine {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    filter() {
        const queryObj = { ...this.queryString };
        const excludedFields = ['page', 'sort', 'limit', 'fields'];
        excludedFields.forEach(el => delete queryObj[el]);

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
        
        this.query = this.query.find(mongoQuery);
        
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

    paginate() {
        const page = parseInt(this.queryString.page, 10) || 1;
        const limit = parseInt(this.queryString.limit, 10) || 100;
        const skip = (page - 1) * limit;

        this.query = this.query.skip(skip).limit(limit);
        
        return this;
    }
}

module.exports = QueryEngine;
