import Post from '../models/Post';
import llmService from './llm';

class SearchService {
    async searchPosts(userQuery: string) {
        const parsedQuery = await llmService.parseSearchQuery(userQuery);
        console.log('Parsed LLM Query:', JSON.stringify(parsedQuery, null, 2));

        const pipeline: any[] = [];

        // 1. Add commentsCount field for filtering
        pipeline.push({
            $lookup: {
                from: 'comments',
                localField: '_id',
                foreignField: 'postId',
                as: 'comments'
            }
        });
        pipeline.push({
            $addFields: {
                commentsCount: { $size: '$comments' }
            }
        });

        // 2. Apply filters from LLM
        const matchStage: any = {};

        if (parsedQuery.message) {
            const keywords = Array.isArray(parsedQuery.message) ? parsedQuery.message : [parsedQuery.message];
            if (keywords.length > 0) {
                matchStage.$or = keywords.map((keyword: string) => ({
                    message: { $regex: keyword, $options: 'i' }
                }));
            }
        }

        if (parsedQuery.likeCount) {
            matchStage.likeCount = parsedQuery.likeCount;
        }

        if (parsedQuery.createdAt) {
            matchStage.createdAt = {};
            if (parsedQuery.createdAt.$gte) matchStage.createdAt.$gte = new Date(parsedQuery.createdAt.$gte);
            if (parsedQuery.createdAt.$lte) matchStage.createdAt.$lte = new Date(parsedQuery.createdAt.$lte);
        }

        if (parsedQuery.commentsCount) {
            matchStage.commentsCount = parsedQuery.commentsCount;
        }

        if (Object.keys(matchStage).length > 0) {
            pipeline.push({ $match: matchStage });
        }

        // 3. Sort
        pipeline.push({ $sort: { _id: -1 } });

        // 4. Populate author and image data (manual as it is aggregation)
        pipeline.push({
            $lookup: {
                from: 'users',
                localField: 'author',
                foreignField: '_id',
                as: 'author'
            }
        });
        pipeline.push({ $unwind: '$author' });

        // Populate author's profile image
        pipeline.push({
            $lookup: {
                from: 'images',
                localField: 'author.profileImage',
                foreignField: '_id',
                as: 'author.profileImage'
            }
        });
        pipeline.push({
            $unwind: {
                path: '$author.profileImage',
                preserveNullAndEmptyArrays: true
            }
        });

        pipeline.push({
            $lookup: {
                from: 'images',
                localField: 'image',
                foreignField: '_id',
                as: 'image'
            }
        });
        pipeline.push({
            $unwind: {
                path: '$image',
                preserveNullAndEmptyArrays: true
            }
        });

        // Remove comments array to reduce payload size
        pipeline.push({ $project: { comments: 0 } });

        const posts = await Post.aggregate(pipeline);

        return posts;
    }
}

export default new SearchService();
