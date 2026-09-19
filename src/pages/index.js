import Header from "../../components/Header";
import Navbar from "../../components/Navbar";
import Activity from "../../components/Home/Activity";
import Divider from "../../components/Divider";
import Footer from "../../components/Footer";
import Partner from "../../components/Partner";
import Sponsor from "../../components/Sponsor";
import Image from "next/image";

import sortByTimestamp from "../../utils/sortByTimestamp";
import {
  getBanners,
  getPartners,
  getSponsors,
} from "../sanity/sanityClient";
import { useState, useEffect } from "react";

function Home(props) {
  let banners = sortByTimestamp(props.banners);
  const [index, setIndex] = useState(0);
  const [isClient, setIsClient] = useState(false);

  if (banners.length === 0) {
    banners.push({
      title: "No Banner",
    });
  }

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((seconds) => (seconds === banners.length - 1 ? 0 : seconds + 1));
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length]);

  return (
    <div className="relative min-h-screen bg-gradient">
      <Header />
      <main className="">
        <Navbar page="home" isClient={isClient} />
        <div className="pt-20 sm:pt-24 md:pt-24 px-4 lg:px-16 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            
            {/* Hero Large Logo in `#logo-block` */}
            <div
              className="flex justify-center items-center py-4"
              id="logo-block"
            >
              <Image
                src="/assets/logo-w.webp"
                width={484}
                height={160}
                className="w-[240px] sm:w-[300px] md:w-[360px] lg:w-[420px] h-auto object-contain filter drop-shadow-xl"
                alt="UNISEC-Thailand"
                priority
              />
            </div>

            {/* Hero Text Box */}
            <div
              className="relative m-2 md:m-4 lg:max-w-[90%] xl:max-w-[85%]"
              id="home-text"
            >
              <div className="bg-custom-primary relative rounded-2xl border-2 border-white z-20">
                <div
                  className="p-6 sm:p-8 lg:p-10 text-sm md:text-base leading-relaxed"
                  data-aos="fade"
                >
                  UNISEC-Global is an international nonprofit body, consisting
                  of local-chapters across the world. Since its establishment in
                  November 2013 in Japan, UNISEC-Global has provided a forum
                  every year to promote practical space development activities,
                  mainly at university level.
                </div>
              </div>
              <div className="absolute w-full top-3 left-3 rounded-2xl bg-custom-primary border-2 border-white z-10 h-full"></div>
            </div>
          </div>
        </div>
        <Activity activity={banners[index]} />
        <Divider />
        <Partner partners={props.partners} />
        <Sponsor sponsors={props.sponsors} />
      </main>

      <footer className="absolute top-full w-full">
        <Footer />
      </footer>
    </div>
  );
}

export async function getStaticProps() {
  const banners = await getBanners();
  const partners = await getPartners();
  const sponsors = await getSponsors();

  return {
    props: {
      banners,
      partners,
      sponsors,
    },
    revalidate: 300,
  };
}

export default Home;
