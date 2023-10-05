import { auth, clerkClient } from "@clerk/nextjs";
import { z } from "zod";
import type { User } from "@clerk/nextjs/api";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

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
        });

        const users = (
            await clerkClient.users.getUserList({
                userId: (await posts).map((post) => post.authorId),
                limit: 100,
            })
        ).map(filerUserForClient);

        console.log('Users:' + users);

        return (await posts).map(post => {
            const author = users.find((user) => user.id === post.authorId);

            if (!author || !author.username) {
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
});

