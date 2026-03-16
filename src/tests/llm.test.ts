import llmService from '../services/llm';

const originalFetch = global.fetch;

afterEach(() => {
    global.fetch = originalFetch;
});

describe('LLM Service', () => {
    test('should parse a valid search query response', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                response: JSON.stringify({ message: ['cats', 'kitten'] })
            })
        });

        const result = await llmService.parseSearchQuery('posts about cats');
        expect(result).toEqual({ message: ['cats', 'kitten'] });
        expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    test('should parse query with numeric filters', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                response: JSON.stringify({ likeCount: { $gte: 10 } })
            })
        });

        const result = await llmService.parseSearchQuery('posts with more than 10 likes');
        expect(result).toEqual({ likeCount: { $gte: 10 } });
    });

    test('should parse query with combined filters', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                response: JSON.stringify({
                    message: ['sports'],
                    commentsCount: { $eq: 5 }
                })
            })
        });

        const result = await llmService.parseSearchQuery('sports posts with 5 comments');
        expect(result).toEqual({
            message: ['sports'],
            commentsCount: { $eq: 5 }
        });
    });

    test('should return empty object when LLM returns non-OK status', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error'
        });

        const result = await llmService.parseSearchQuery('anything');
        expect(result).toEqual({});
    });

    test('should return empty object when LLM returns invalid JSON', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                response: 'not valid json'
            })
        });

        const result = await llmService.parseSearchQuery('anything');
        expect(result).toEqual({});
    });

    test('should return empty object when fetch throws (network error)', async () => {
        global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

        const result = await llmService.parseSearchQuery('anything');
        expect(result).toEqual({});
    });

    test('should send correct request to LLM API', async () => {
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                response: JSON.stringify({})
            })
        });

        await llmService.parseSearchQuery('test query');

        const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
        const url = fetchCall[0];
        const options = fetchCall[1];
        const body = JSON.parse(options.body);

        expect(url).toContain('/api/generate');
        expect(options.method).toBe('POST');
        expect(options.headers['Content-Type']).toBe('application/json');
        expect(options.headers['Authorization']).toMatch(/^Basic /);
        expect(body.stream).toBe(false);
        expect(body.format).toBe('json');
        expect(body.prompt).toContain('test query');
    });
});
