export interface LlmSearchQuery {
    message?: string[];
    likeCount?: { $gte?: number; $lte?: number; $eq?: number };
    createdAt?: { $gte?: string; $lte?: string };
    commentsCount?: { $gte?: number; $lte?: number; $eq?: number };
}

class LlmService {
    private baseUrl: string;
    private authHeader: string;
    private model: string;

    constructor() {
        this.baseUrl = process.env.LLM_BASE_URL || 'http://10.10.248.41';
        const username = process.env.LLM_USERNAME || 'student1';
        const password = process.env.LLM_PASSWORD || 'pass123';
        this.authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
        this.model = process.env.LLM_MODEL || 'llama3.1:8b';
    }

    async parseSearchQuery(userQuery: string): Promise<LlmSearchQuery> {
        const prompt = `
            You are a translation service that converts natural language queries into a structured JSON search filter for a blog posts database.
            The database has the following fields:
            - message: string (free text)
            - likeCount: number (number of likes)
            - createdAt: Date (post creation date)
            - commentsCount: number (number of comments)

            Translate the following user query into a JSON object with these optional keys: "message", "likeCount", "createdAt", "commentsCount".
            For "message", use an array of keywords found in the query. Additionally, include contextually related synonyms or related terms to enrich the search results (e.g., if searching for "technology", also include "tech", "software", "gadget").
            For numeric fields (likeCount, commentsCount), use MongoDB-style operators: $gte, $lte, $eq.
            For date fields (createdAt), use ISO strings and $gte, $lte operators.
            Assume "today" is ${new Date().toISOString()}.

            Example queries:
            - "posts with more than 10 likes" -> {"likeCount": {"$gt": 10}}
            - "recent posts from last week" -> {"createdAt": {"$gte": "${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}"}}
            - "posts about cats" -> {"message": ["cats", "feline", "kitten", "pets"]}
            - "posts about sports and football with 5 comments" -> {"message": ["sports", "football", "soccer", "match", "game"], "commentsCount": {"$eq": 5}}

            User Query: "${userQuery}"
            Respond ONLY with the JSON object.
        `;

        try {
            const response = await fetch(`${this.baseUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Authorization': this.authHeader,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.model,
                    prompt: prompt,
                    stream: false,
                    format: 'json',
                }),
                signal: AbortSignal.timeout(30000)
            });

            if (!response.ok) {
                throw new Error(`LLM service error: ${response.status} ${response.statusText}`);
            }

            const data: any = await response.json();
            try {
                return JSON.parse(data.response);
            } catch (e) {
                console.error("Failed to parse LLM response as JSON:", data.response);
                return {};
            }
        } catch (error) {
            console.error("Error calling LLM service:", error);
            return {};
        }
    }
}

export default new LlmService();
