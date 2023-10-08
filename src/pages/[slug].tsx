import Head from "next/head";
import { api } from "~/utils/api";
import { createServerSideHelpers } from '@trpc/react-query/server';
import { appRouter } from '~/server/api/root';
import { db } from '~/server/db';
import superjson from 'superjson';
import { GetStaticProps, NextPage } from "next";
import { PageLayout } from "~/components/layout";

const ProfilePage: NextPage<{ username: string }> = ({ username }) => {
  const { data, isLoading } = api.profile.getUserByUsername.useQuery({
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
        <div>
          {data.username} Profile
        </div>
      </PageLayout>
    </>
  );
};

export const getStaticProps: GetStaticProps = async (context) => {
  const helpers = createServerSideHelpers({
    router: appRouter,
    ctx: { db, userId: null },
    transformer: superjson,
  });

  const slug = context.params?.slug;

  if (typeof slug !== "string") {
    throw new Error("no slug");
  }

  const username = slug.replace("@", "");

  helpers.profile.getUserByUsername.prefetch({
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
  return { paths: [], fallback: "blocking" }
};

export default ProfilePage;
