const QueryEngine = require('../queryEngine');

describe('QueryEngine', () => {
    let mockQuery;

    beforeEach(() => {
        // Mock Mongoose Query Object
        mockQuery = {
            find: jest.fn().mockReturnThis(),
            sort: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            maxTimeMS: jest.fn().mockReturnThis(),
            populate: jest.fn().mockReturnThis(),
            model: {
                countDocuments: jest.fn().mockResolvedValue(10)
            },
            getQuery: jest.fn().mockReturnValue({})
        };
    });

    test('should apply basic equality filter', () => {
        const queryString = { name: 'John' };
        const engine = new QueryEngine(mockQuery, queryString);
        engine.filter();

        expect(mockQuery.find).toHaveBeenCalledWith({ name: 'John' });
    });

    test('should apply existing comparison operators (_gt, _lt, etc)', () => {
        const queryString = { age_gt: '18', age_lt: '30' };
        const engine = new QueryEngine(mockQuery, queryString);
        engine.filter();

        expect(mockQuery.find).toHaveBeenCalledWith({
            age: { $gt: '18', $lt: '30' }
        });
    });

    test('should apply _ne (not equal) operator', () => {
        const queryString = { status_ne: 'inactive' };
        const engine = new QueryEngine(mockQuery, queryString);
        engine.filter();

        expect(mockQuery.find).toHaveBeenCalledWith({
            status: { $ne: 'inactive' }
        });
    });

    test('should exclude special fields from filtering', () => {
        const queryString = { name: 'John', page: '1', sort: 'name' };
        const engine = new QueryEngine(mockQuery, queryString);
        engine.filter();

        expect(mockQuery.find).toHaveBeenCalledWith({ name: 'John' });
        // page and sort should NOT be in the find() call
        const filterArg = mockQuery.find.mock.calls[0][0];
        expect(filterArg).not.toHaveProperty('page');
        expect(filterArg).not.toHaveProperty('sort');
    });

    test('should apply _in operator by splitting comma-separated values', () => {
        const queryString = { status_in: 'active,pending,archived' };
        const engine = new QueryEngine(mockQuery, queryString);
        engine.filter();

        expect(mockQuery.find).toHaveBeenCalledWith({
            status: { $in: ['active', 'pending', 'archived'] }
        });
    });

    test('should handle array input for _in operator (repeated params)', () => {
        const queryString = { status_in: ['active', 'pending'] };
        const engine = new QueryEngine(mockQuery, queryString);
        engine.filter();

        expect(mockQuery.find).toHaveBeenCalledWith({
            status: { $in: ['active', 'pending'] }
        });
    });

    test('should apply _exists operator with boolean conversion', () => {
        const queryString = { email_exists: 'true', phone_exists: 'false' };
        const engine = new QueryEngine(mockQuery, queryString);
        engine.filter();

        expect(mockQuery.find).toHaveBeenCalledWith({
            email: { $exists: true },
            phone: { $exists: false }
        });
    });

    test('should apply _regex operator with case-insensitive flag', () => {
        const queryString = { name_regex: 'John' };
        const engine = new QueryEngine(mockQuery, queryString);
        engine.filter();

        const filterArg = mockQuery.find.mock.calls[0][0];
        expect(filterArg.name.$regex).toBeInstanceOf(RegExp);
        expect(filterArg.name.$regex.source).toBe('John');
        expect(filterArg.name.$regex.flags).toContain('i');
        expect(mockQuery.maxTimeMS).toHaveBeenCalledWith(QueryEngine.REGEX_MAX_TIME_MS);
    });

    test('should throw a query validation error for invalid _regex pattern', () => {
        const queryString = { name_regex: '[' }; // Invalid regex
        const engine = new QueryEngine(mockQuery, queryString);

        expect(() => engine.filter()).toThrow('Invalid regex pattern');
    });

    test('should throw a query validation error for oversized _regex pattern', () => {
        const queryString = { name_regex: 'a'.repeat(QueryEngine.MAX_REGEX_PATTERN_LENGTH + 1) };
        const engine = new QueryEngine(mockQuery, queryString);

        expect(() => engine.filter()).toThrow('exceeds');
    });
});
