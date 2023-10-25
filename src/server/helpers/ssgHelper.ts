import {appRouter} from "~/server/api/root";
import {db} from "~/server/db";
import superjson from "superjson";
import {createServerSideHelpers} from "@trpc/react-query/server";

export const generateSSGHelper = () => {
    return createServerSideHelpers({
        router: appRouter,
        ctx: {db, userId: null},
        transformer: superjson,
    });
}