import { SignInButton, useUser } from "@clerk/nextjs";
import Head from "next/head";
import Image from "next/image";
import { api } from "~/utils/api";
import type { RouterOutputs } from "~/utils/api";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const CreatePostWizard = () => {
  const { user } = useUser();

  if (!user) return null;

  return (
    <div className="flex gap-3  w-full">
      <Image
        src={user.imageUrl}
        alt="Profile image"
        className="w-14 h-14 rounded-full"
        width={56}
        height={56} />
      <input placeholder="Type some emojis" className="bg-transparent grow outline-none" />
    </div>
  );
}

type PostWithUser = RouterOutputs["posts"]["getAll"][number];

const PostView = (props: PostWithUser) => {
  const { post, author } = props;
  return (
    <div key={post.id} className="flex p-4 border-b border-slate-400 gap-3">
      <Image
        src={author.profilePicture}
        alt="Profile image"
        className="w-14 h-14 rounded-full"
        width={56}
        height={56} />
      <div className="flex flex-col">
        <div className="flex text-slate-400">
          <span>{`@${author.username}`}</span>
          <span className="mx-1">·</span>
          <span className="font-thin">{dayjs(post.createdAt).fromNow()}</span>
        </div>
        <span className="">{post.content}</span>
      </div>
    </div>
  )
}

export default function Home() {
  const user = useUser();

  const { data, isLoading } = api.posts.getAll.useQuery();

  if (isLoading) {
    if (user.isSignedIn === false) {
      return (
        <>
          <div>loading...</div>
          <div className="flex justify-center text-slate-100">
            <SignInButton />
          </div>
        </>
      );
    }

    return (<div>loading...</div>);
  }

  if (!data) {
    return (<div>no data</div>);
  }

  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex justify-center h-screen">
        <div className="h-full w-full border-x border-slate-400 md:max-w-2xl">
          <div className="border-b border-slate-400 p-4 flex">
            {!user.isSignedIn && (
              <div className="flex justify-center text-slate-100">
                <SignInButton />
              </div>)}
            {user.isSignedIn && <CreatePostWizard />}
          </div>
          <div className="flex flex-col">
            {
              data?.map((fullpost) => (
                <PostView {...fullpost} key={fullpost.post.id} />
              ))
            }
          </div>
        </div>
      </main>
    </>
  );
}
