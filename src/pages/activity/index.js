import Header from "../../../components/Header";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import CardList from "../../../components/CardList";
import MeetingCardList from "../../../components/MeetingCardList";
import sortByTimestamp from "../../../utils/sortByTimestamp";
import { getAllPosts, getAllMeetingPosts } from "../../sanity/sanityClient";
import Link from "next/link";

const Activity = (props) => {
  return (
    <div className="relative min-h-screen bg-gradient">
      <Header />
      <main className="pt-20">
        <Navbar />
        <div className="gap-8 xl:px-4">
          <div className="relative my-8">
            <h1 className="font-impact text-6xl lg:text-8xl text-center text-gray-300">
              Activity
            </h1>
            <h1 className="absolute top-1 left-1/2 transform -translate-x-1/2 font-impact text-6xl lg:text-8xl text-center ">
              Activity
            </h1>
          </div>

          <section
            aria-labelledby="ssa-game-heading"
            className="mx-4 my-8 flex flex-col gap-5 rounded-2xl border border-cyan-300/40 bg-slate-900/80 p-6 text-white sm:flex-row sm:items-center sm:justify-between lg:mx-8"
          >
            <div>
              <p className="mb-2 text-sm font-semibold tracking-widest text-cyan-300">INTERACTIVE ACTIVITY</p>
              <h2 id="ssa-game-heading" className="text-2xl font-bold sm:text-3xl">SSA Satellite Party Game</h2>
              <p className="mt-2 max-w-2xl text-gray-300">เกมดาวเทียมและสถานีภาคพื้นดินสำหรับ 14 ทีม ดูแผนที่และติดตามเกมร่วมกันแบบเรียลไทม์</p>
            </div>
            <Link
              href="/ssa"
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-cyan-300 px-6 py-3 font-bold text-slate-950 transition hover:bg-cyan-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300"
            >
              เข้าเกม SSA →
            </Link>
          </section>

          <div className="flex flex-col lg:grid mt-8">
            <a className="anchor" id="online-meeting"></a>
            <h1
              className={`font-impact text-4xl text-white flex flex-col justify-end items-center cursor-pointer hover:text-white`}
            >
              Online Meeting
            </h1>

            <MeetingCardList cards={props.meetings} type="meetings" />

            <a className="anchor" id="our-activity"></a>
            <h1
              className={`font-impact text-4xl text-white flex flex-col justify-end items-center cursor-pointer hover:text-white`}
            >
              Our Activity
            </h1>
            <CardList cards={props.activities} type="activity" />

            <a className="anchor" id="upcomming-activity"></a>
            <h1
              className={`font-impact text-4xl text-white flex flex-col justify-end items-center cursor-pointer hover:text-white`}
            >
              Upcomming Activity
            </h1>
            <CardList cards={props.upcommings} type="activity" />
            <h1
              className={`font-impact text-4xl text-white flex flex-col justify-end items-center cursor-pointer hover:text-white`}
            >
              Research Projects
            </h1>
          </div>
          <CardList cards={props.none} type="activity" />
        </div>
      </main>
      <footer className="absolute top-full w-full">
        <Footer />
      </footer>
    </div>
  );
};

export async function getStaticProps() {
  const raw_meetings = await getAllMeetingPosts();
  const meetings = sortByTimestamp(raw_meetings, true);
  const articles = await getAllPosts();
  const upcommings = [];
  const activities = [];
  const none = [];

  articles.forEach((article) => {
    switch (article.type) {
      case "UPCOMMING":
        upcommings.push(article);
        break;
      case "ACTIVITY":
        activities.push(article);
        break;
      default:
        break;
    }
    return;
  });

  return {
    props: {
      upcommings,
      activities,
      meetings,
      none,
    },
    revalidate: 300,
  };
}

export default Activity;
