import { clerkClient } from "@clerk/nextjs";
import type { User } from "@clerk/nextjs/api";

import { createTRPCRouter, privateProcedure, publicProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

const filerUserForClient = (user: User) => {
    return {
        id: user.id,
        username: user.username,
        profilePicture: user.imageUrl,
    };
}

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

            const post = await ctx.db.post.create({
                data: {
                    authorId,
                    content: input.content,
                },
            });

            return post;
        }),
});

