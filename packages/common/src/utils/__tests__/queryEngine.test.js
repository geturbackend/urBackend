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

        expect(mockQuery.find).toHaveBeenCalledWith({ name: 'John', isDeleted: { $ne: true } });
    });

    test('should apply existing comparison operators (_gt, _lt, etc)', () => {
        const queryString = { age_gt: '18', age_lt: '30' };
        const engine = new QueryEngine(mockQuery, queryString);
        engine.filter();

        expect(mockQuery.find).toHaveBeenCalledWith({
            age: { $gt: '18', $lt: '30' },
            isDeleted: { $ne: true }
        });
    });

    test('should apply _ne (not equal) operator', () => {
        const queryString = { status_ne: 'inactive' };
        const engine = new QueryEngine(mockQuery, queryString);
        engine.filter();

        expect(mockQuery.find).toHaveBeenCalledWith({
            status: { $ne: 'inactive' },
            isDeleted: { $ne: true }
        });
    });

    test('should exclude special fields from filtering', () => {
        const queryString = { name: 'John', page: '1', sort: 'name' };
        const engine = new QueryEngine(mockQuery, queryString);
        engine.filter();

        expect(mockQuery.find).toHaveBeenCalledWith({ name: 'John', isDeleted: { $ne: true } });
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
            status: { $in: ['active', 'pending', 'archived'] },
            isDeleted: { $ne: true }
        });
    });

    test('should handle array input for _in operator (repeated params)', () => {
        const queryString = { status_in: ['active', 'pending'] };
        const engine = new QueryEngine(mockQuery, queryString);
        engine.filter();

        expect(mockQuery.find).toHaveBeenCalledWith({
            status: { $in: ['active', 'pending'] },
            isDeleted: { $ne: true }
        });
    });

    test('should apply _exists operator with boolean conversion', () => {
        const queryString = { email_exists: 'true', phone_exists: 'false' };
        const engine = new QueryEngine(mockQuery, queryString);
        engine.filter();

        expect(mockQuery.find).toHaveBeenCalledWith({
            email: { $exists: true },
            phone: { $exists: false },
            isDeleted: { $ne: true }
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

    test('should exclude soft-deleted documents by default', () => {
        const queryString = { name: 'test' };
        const engine = new QueryEngine(mockQuery, queryString);
        
        engine.filter();
        
        expect(mockQuery.find).toHaveBeenCalledWith(expect.objectContaining({
            name: 'test',
            isDeleted: { $ne: true }
        }));
    });

    test('should include soft-deleted documents when include_deleted=true is passed', () => {
        const queryString = { name: 'test', include_deleted: 'true' };
        const engine = new QueryEngine(mockQuery, queryString);
        
        engine.filter();
        
        expect(mockQuery.find).toHaveBeenCalledWith({
            name: 'test'
        });
        
        const callArgs = mockQuery.find.mock.calls[0][0];
        expect(callArgs).not.toHaveProperty('include_deleted');
        expect(callArgs).not.toHaveProperty('isDeleted');
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
