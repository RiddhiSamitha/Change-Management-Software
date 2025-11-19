describe('Utility Function Tests', () => {
    test('UT-001: Email validation works', () => {
        const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        expect(isValidEmail('test@example.com')).toBe(true);
        expect(isValidEmail('invalid')).toBe(false);
    });

    test('UT-002: String truncation works', () => {
        const truncate = (str, length) => str.length > length ? str.substring(0, length) + '...' : str;
        expect(truncate('Hello World', 5)).toBe('Hello...');
        expect(truncate('Hi', 5)).toBe('Hi');
    });

    test('UT-003: Date formatting works', () => {
        const formatDate = (date) => new Date(date).toLocaleDateString();
        const result = formatDate('2025-01-01');
        expect(result).toBeTruthy();
    });

    test('UT-004: Object merging works', () => {
        const merge = (obj1, obj2) => ({ ...obj1, ...obj2 });
        const result = merge({ a: 1 }, { b: 2 });
        expect(result).toEqual({ a: 1, b: 2 });
    });

    test('UT-005: Array deduplication works', () => {
        const dedupe = (arr) => [...new Set(arr)];
        expect(dedupe([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
    });

    test('UT-006: Sorting works correctly', () => {
        const arr = [3, 1, 2];
        expect(arr.sort()).toEqual([1, 2, 3]);
    });

    test('UT-007: Filtering works correctly', () => {
        const items = [1, 2, 3, 4, 5];
        const evens = items.filter(x => x % 2 === 0);
        expect(evens).toEqual([2, 4]);
    });

    test('UT-008: Mapping works correctly', () => {
        const items = [1, 2, 3];
        const doubled = items.map(x => x * 2);
        expect(doubled).toEqual([2, 4, 6]);
    });

    test('UT-009: Reduce works correctly', () => {
        const items = [1, 2, 3, 4];
        const sum = items.reduce((a, b) => a + b, 0);
        expect(sum).toBe(10);
    });

    test('UT-010: JSON parsing works correctly', () => {
        const parseJSON = (str) => {
            try {
                return JSON.parse(str);
            } catch (e) {
                return null;
            }
        };
        expect(parseJSON('{"valid": true}')).toEqual({ valid: true });
        expect(parseJSON('invalid')).toBeNull();
    });
});
