import Head from "next/head";
import Image from "next/image";
import {api} from "~/utils/api";
import type {GetStaticProps, NextPage} from "next";
import {PageLayout} from "~/components/layout";
import {LoadingPage} from "~/components/loading";
import {PostView} from "~/components/postview";
import {generateSSGHelper} from "~/server/helpers/ssgHelper";

const ProfileFeed = (props: { userId: string }) => {
    const {data, isLoading} = api.posts.getPostByUserId.useQuery({userId: props.userId});

    if (isLoading) return <LoadingPage/>;

    if (!data || data.length == 0) return <div>User has not posted</div>;

    return <div className="flex flex-col">
        {data.map((fullPost) => {
            return <PostView {...fullPost} key={fullPost.post.id}/>
        })}
    </div>
}

const ProfilePage: NextPage<{ username: string }> = ({username}) => {
    const {data} = api.profile.getUserByUsername.useQuery({
        username: username,
    });

    if (!data) {
        return (
            <div>404</div>
        );
    }

    return (
        <>
            <Head>
                <title>{data.username}</title>
            </Head>
            <PageLayout>
                <div className="h-36 bg-slate-600 relative">
                    <Image
                        src={data.profilePicture}
                        alt={`${data.username ?? ""}'s profile pic`}
                        width={128}
                        height={128}
                        className="-mb-[64px] absolute bottom-0 left-0 ml-4 rounded-full border-4 border-black bg-black"
                    />
                </div>
                <div className="h-[64px]"></div>
                <div className="p-4 text-2xl font-bold">
                    {`@${data.username ?? ""}`}
                </div>
                <div className="border-b border-slate-400 w-full"></div>
                <ProfileFeed userId={data.id}/>
            </PageLayout>
        </>
    );
};

export const getStaticProps: GetStaticProps = async (context) => {
    const helpers = generateSSGHelper();

    const slug = context.params?.slug;

    if (typeof slug !== "string") {
        throw new Error("no slug");
    }

    const username = slug.replace("@", "");

    await helpers.profile.getUserByUsername.prefetch({
        username: username,
    });

    return {
        props: {
            trpcState: helpers.dehydrate(),
            username: username,
        },
    };
};

export const getStaticPaths = () => {
    return {paths: [], fallback: "blocking"}
};

export default ProfilePage;
