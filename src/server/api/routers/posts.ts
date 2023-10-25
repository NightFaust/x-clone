import {clerkClient} from "@clerk/nextjs";
import {createTRPCRouter, privateProcedure, publicProcedure} from "~/server/api/trpc";
import {TRPCError} from "@trpc/server";
import {z} from "zod";
import {Redis} from "@upstash/redis/nodejs";
import {Ratelimit} from "@upstash/ratelimit";
import {filterUserForClient} from "~/server/helpers/filterUserForClient";
import {type Post} from "@prisma/client";
import emojiRegex from 'emoji-regex';

const addUserDataToPosts = async (posts: Post[]) => {
    const users = (
        await clerkClient.users.getUserList({
            userId: posts.map((post) => post.authorId),
            limit: 100,
        })
    ).map(filterUserForClient);

    return posts.map(post => {
        const author = users.find((user) => user.id === post.authorId);

        if (!author?.username) {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "Author for post not found",
            });
        }

        return {
            post,
            author: {
                ...author,
                username: author.username,
            },
        };
    });
};

const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(3, "1 m"),
    analytics: true,
    prefix: "@upstash/ratelimit",
});

export const postRouter = createTRPCRouter({

    getById: publicProcedure.input(z.object({
        id: z.string(),
    }))
        .query(async ({ctx, input}) => {
            const post = await ctx.db.post.findUnique({
                where: {
                    id: input.id,
                }
            });

            if (!post) {
                throw new TRPCError({code: "NOT_FOUND"});
            }

            return (await addUserDataToPosts([post]))[0];
        }),

    getAll: publicProcedure.query(async ({ctx}) => {
        const posts = await ctx.db.post.findMany({
            take: 100,
            orderBy: [{
                createdAt: 'desc',
            }],
        });

        return addUserDataToPosts(posts);
    }),

    getPostByUserId: publicProcedure
        .input(z.object({
            userId: z.string(),
        }))
        .query(({ctx, input}) => ctx.db.post.findMany({
                where: {
                    authorId: input.userId,
                },
                take: 100,
                orderBy: [{
                    createdAt: 'desc',
                }],
            }).then(addUserDataToPosts)
        ),

    create: privateProcedure
        .input(z.object({
            content: z.string().emoji("Only emojis are allowed").min(1).max(280),
        }))
        .mutation(async ({ctx, input}) => {
            const authorId = ctx.userId;

            const {success} = await ratelimit.limit(authorId);

            const validatedInput = input.content.match(emojiRegex());

            if (!validatedInput) {
                throw new TRPCError({
                    code: "PARSE_ERROR",
                });
            }

            if (!success) {
                throw new TRPCError({
                    code: "TOO_MANY_REQUESTS",
                });
            }

            return await ctx.db.post.create({
                data: {
                    authorId,
                    content: validatedInput.join(""),
                },
            });
        }),
});

