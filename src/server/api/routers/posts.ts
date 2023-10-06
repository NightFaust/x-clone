import { clerkClient } from "@clerk/nextjs";
import type { User } from "@clerk/nextjs/api";

import { createTRPCRouter, privateProcedure, publicProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { Redis } from "@upstash/redis/nodejs";
import { Ratelimit } from "@upstash/ratelimit";

const filerUserForClient = (user: User) => {
    return {
        id: user.id,
        username: user.username,
        profilePicture: user.imageUrl,
    };
}

const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(3, "1 m"),
    analytics: true,
    prefix: "@upstash/ratelimit",
});

export const postRouter = createTRPCRouter({
    getAll: publicProcedure.query(async ({ ctx }) => {
        const posts = ctx.db.post.findMany({
            take: 100,
            orderBy: {
                createdAt: 'desc',
            }
        });

        const users = (
            await clerkClient.users.getUserList({
                userId: (await posts).map((post) => post.authorId),
                limit: 100,
            })
        ).map(filerUserForClient);

        return (await posts).map(post => {
            const author = users.find((user) => user.id === post.authorId);

            if (!author?.username) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Author for post not fount",
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
    }),

    create: privateProcedure
        .input(z.object({
            content: z.string().emoji().min(1).max(280),
        }))
        .mutation(async ({ ctx, input }) => {
            const authorId = ctx.userId;

            const { success } = await ratelimit.limit(authorId);

            if (!success) {
                throw new TRPCError({
                    code: "TOO_MANY_REQUESTS",
                });
            }

            const post = await ctx.db.post.create({
                data: {
                    authorId,
                    content: input.content,
                },
            });

            return post;
        }),
});

