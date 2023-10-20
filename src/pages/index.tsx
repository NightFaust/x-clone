import {SignInButton, useUser} from "@clerk/nextjs";
import Image from "next/image";
import {api} from "~/utils/api";
import {LoadingPage, LoadingSpinner} from "~/components/loading";
import {useState} from "react";
import toast from "react-hot-toast";
import {PageLayout} from "~/components/layout";
import {PostView} from "~/components/postview";

const CreatePostWizard = () => {
  const {user} = useUser();

  const [input, setInput] = useState("");

  const ctx = api.useContext();

  const {mutate, isLoading: isPosting} = api.posts.create.useMutation({
    onSuccess: () => {
      setInput("");
      void ctx.posts.getAll.invalidate();
    },
    onError: (e) => {
      const errorMessage = e.data?.zodError?.fieldErrors.content;
      if (errorMessage?.[0]) {
        toast.error(errorMessage[0])
      } else {
        toast.error("Failed to post! Please try again later.");
      }
    },
  });

  if (!user) return null;

  return (
    <div className="flex gap-3  w-full">
      <Image
        src={user.imageUrl}
        alt="Profile image"
        className="w-14 h-14 rounded-full"
        width={56}
        height={56}/>
      <input
        placeholder="Type some emojis"
        className="bg-transparent grow outline-none"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (input !== "") {
              mutate({content: input});
            }
          }
        }}/>
      {input !== "" && !isPosting && (
        <button onClick={() => mutate({content: input})}>
          Post
        </button>
      )}

      {isPosting && (
        <div className="flex justify-center items-center">
          <LoadingSpinner size={20}/>
        </div>
      )}
    </div>
  );
};

const Feed = () => {
  const {data, isLoading: postLoading} = api.posts.getAll.useQuery();

  if (postLoading) {
    return (<LoadingPage/>);
  }

  if (!data) {
    return (<div>Something went wrong</div>);
  }

  return (
    <div className="flex flex-col">
      {
        data.map((fullpost) => (
          <PostView {...fullpost} key={fullpost.post.id}/>
        ))
      }
    </div>
  );
};

const Home = () => {
  const {isLoaded: userLoaded, isSignedIn} = useUser();

  // Start fetching asap
  api.posts.getAll.useQuery();

  // Return empty div if user isn't loaded
  if (!userLoaded) {
    return <div/>;
  }

  return (
    <PageLayout>
      <div className="border-b border-slate-400 p-4 flex">
        {!isSignedIn && (
          <div className="flex justify-center text-slate-100">
            <SignInButton/>
          </div>
        )}
        {isSignedIn && <CreatePostWizard/>}
      </div>
      <Feed/>
    </PageLayout>
  );
};

export default Home;
