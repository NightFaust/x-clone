import Head from "next/head";
import {api} from "~/utils/api";
import type {GetStaticProps, NextPage} from "next";
import {PageLayout} from "~/components/layout";
import {generateSSGHelper} from "~/server/helpers/ssgHelper";
import {PostView} from "~/components/postview";

const SinglePostPage: NextPage<{ id: string }> = ({id}) => {
    const {data} = api.posts.getById.useQuery({
        id,
    });

    if (!data) {
        return (
            <div>404</div>
        );
    }

    return (
        <>
            <Head>
                <title>{data.post.content} - {data.author.username}</title>
            </Head>
            <PageLayout>
                <PostView {...data} />
            </PageLayout>
        </>
    );
};

export const getStaticProps: GetStaticProps = async (context) => {
    const helpers = generateSSGHelper();

    const id = context.params?.id;

    if (typeof id !== "string") {
        throw new Error("no id");
    }

    await helpers.posts.getById.prefetch({id});

    return {
        props: {
            trpcState: helpers.dehydrate(),
            id: id,
        },
    };
};

export const getStaticPaths = () => {
    return {paths: [], fallback: "blocking"}
};

export default SinglePostPage;