import Head from "next/head";
import { PageLayout } from "~/components/layout";

const SinglePostPage = () => {

  return (
    <>
      <Head>
        <title>Post</title>
      </Head>
      <PageLayout>
        <div>
          Single Post
        </div >
      </PageLayout >
    </>
  );
};

export default SinglePostPage;
