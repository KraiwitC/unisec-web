import Header from "../../components/Header";
import Navbar from "../../components/Navbar";

import Unisec from "../../components/About/Unisec";
import Mission from "../../components/About/Mission";
import Partner from "../../components/Partner";
import Sponsor from "../../components/Sponsor";

import Divider from "../../components/Divider";
import Footer from "../../components/Footer";
import { getPartners, getSponsors } from "../sanity/sanityClient";

const About = (props) => {
  return (
    <div className="relative min-h-screen bg-gradient">
      <Header />

      <main className="pt-18">
        <Navbar />
        <Unisec />
        <Divider />
        <Mission />
        <Divider />
        <a className="anchor" id="partners"></a>
        <Partner partners={props.partners} />
        <a className="anchor" id="sponsors"></a>
        <Sponsor sponsors={props.sponsors} />
      </main>

      <footer className="absolute top-full w-full">
        <Footer />
      </footer>
    </div>
  );
};

export async function getStaticProps() {
  const partners = await getPartners();
  const sponsors = await getSponsors();

  return {
    props: {
      partners,
      sponsors,
    },
    revalidate: 300,
  };
}

export default About;
