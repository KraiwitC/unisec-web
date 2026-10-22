import "../../styles/global.css";
import "../../styles/custom.css";

import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import "leaflet/dist/leaflet.css";

import Head from "next/head";

function MyApp({ Component, pageProps, router }) {
  useEffect(() => {
    AOS.init({});
  }, []);

  return (
    <>
      <Head>
        <link rel="author" href="/humans.txt" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
