import Header from "../../components/Header";
import Navbar from "../../components/Navbar";
import Activity from "../../components/Home/Activity";
import Divider from "../../components/Divider";
import Footer from "../../components/Footer";
import Partner from "../../components/Partner";
import Sponsor from "../../components/Sponsor";

import sortByTimestamp from "../../utils/sortByTimestamp";
import {
  getBanners,
  getPartners,
  getSponsors,
} from "../sanity/sanityClient";
import { useRouter } from "next/router";
import { useState, useEffect, useCallback } from "react";

function Home(props) {
  let banners = sortByTimestamp(props.banners);
  const [index, setIndex] = useState(0);
  const [logoStyle, setLogoStyle] = useState({
    left: 48,
    width: 121,
    top: 11,
  });
  const [logoBlockHeight, setLogoBlockHeight] = useState(0);
  const [showHomeText, setShowHomeText] = useState(true);
  const [isClient, setIsClient] = useState(false);

  if (banners.length == 0) {
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

  const handleScroll = useCallback(() => {
    if (!isClient) return;

    try {
      let userWidth = window.innerWidth;
      var pp = ((250 - window.scrollY) / 250) * 100;
      if (pp < 0) pp = 0;
      if (pp > 100) pp = 100;

      if (userWidth > 960) {
        var maxWidth = 420;
        const newStyle = {
          left: 48 + (((userWidth / 2 - maxWidth) / 2 - 48) / 100) * pp,
          width: 121 + ((maxWidth - 121) / 100) * pp,
          top: 11 + ((60 - 11) / 100) * pp,
        };
        setLogoStyle(newStyle);
        setShowHomeText(true);
        setLogoBlockHeight(0);
      } else if (userWidth < 768) {
        var ppMax = 0.4 * userWidth - 28.6;
        var pp = ((ppMax - window.scrollY) / ppMax) * 100;
        if (pp < 0) pp = 0;
        if (pp > 100) pp = 100;
        var maxWidth = userWidth - 260;
        var offsetTopFactor = 0.22;
        var offsetLeftFactor = 0.8;
        if (userWidth < 560) {
          maxWidth = userWidth - 120;
          offsetTopFactor = 0.5;
          offsetLeftFactor = 0.2;
        }
        const newStyle = {
          left: 48 + offsetLeftFactor * pp,
          width: 121 + ((maxWidth - 121) / 100) * pp,
          top: 11 + offsetTopFactor * pp,
        };
        setLogoStyle(newStyle);
        setLogoBlockHeight((maxWidth / 113) * 40 - 50);
        setShowHomeText(false);
      } else {
        var maxWidth = userWidth / 2 - 121;
        // Get home text height safely
        const homeTextElement = document.getElementById("home-text");
        var offsetTop = homeTextElement
          ? (homeTextElement.offsetHeight - 200) / 2
          : 0;

        const newStyle = {
          left: 48,
          width: 121 + ((maxWidth - 121) / 100) * pp,
          top: 11 + ((100 + offsetTop - 11) / 100) * pp,
        };
        setLogoStyle(newStyle);
        setShowHomeText(true);
        setLogoBlockHeight(0);
      }
    } catch (e) {
      console.warn("Scroll handler error:", e);
    }
  }, [isClient, setLogoStyle, setShowHomeText, setLogoBlockHeight]);

  const memoizedHandleScroll = useCallback(() => {
    handleScroll();
  }, [handleScroll]);

  // Throttled scroll handler for better mobile performance
  const throttledScrollHandler = useCallback(() => {
    if (typeof window !== "undefined" && window.requestAnimationFrame) {
      window.requestAnimationFrame(memoizedHandleScroll);
    } else {
      memoizedHandleScroll();
    }
  }, [memoizedHandleScroll]);

  const router = useRouter();
  useEffect(() => {
    if (!isClient) return;

    // Use passive listeners for better mobile performance
    window.addEventListener("scroll", throttledScrollHandler, {
      passive: true,
    });
    window.addEventListener("resize", throttledScrollHandler, {
      passive: true,
    });
    router.events.on("routeChangeComplete", memoizedHandleScroll);

    // Initial call
    memoizedHandleScroll();

    return () => {
      window.removeEventListener("scroll", throttledScrollHandler);
      window.removeEventListener("resize", throttledScrollHandler);
      router.events.off("routeChangeComplete", memoizedHandleScroll);
    };
  }, [router.events, isClient, memoizedHandleScroll, throttledScrollHandler]);

  return (
    <div className="relative min-h-screen bg-gradient">
      <Header />
      <main className="">
        <Navbar page="home" logoStyle={logoStyle} isClient={isClient} />
        <div className="pt-32 px-4 lg:px-16 md:px-8 lg:pb-0">
          <div className="grid mb-32 grid-cols-1 md:grid-cols-2 md:mb-12">
            <div
              className="grid gap-8"
              id="logo-block"
              style={{
                height: logoBlockHeight > 0 ? `${logoBlockHeight}px` : "auto",
              }}
            ></div>
            <div
              className="relative m-4 lg:max-w-[80%]"
              id="home-text"
              style={{ display: showHomeText ? "block" : "none" }}
            >
              <div className="bg-custom-primary relative rounded-2xl border-2 border-white z-25">
                <div
                  className="p-10 text-sm xl:text-base"
                  data-aos="fade"
                >
                  UNISEC-Global is an international nonprofit body, consisting
                  of local-chapters across the world. Since its establishment in
                  November 2013 in Japan, UNISEC-Global has provided a forum
                  every year to promote practical space development activities,
                  mainly at university level.
                </div>
              </div>
              {/* Echo layer: keeps the offset depth effect */}
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
