import Header from "../../components/Header";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Link from "next/link";

const custom404 = (props) => {
  return (
    <div className="relative min-h-screen">
      <Header />

      <main className="pb-20 pt-28">
        <Navbar />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
          <h2 className="text-lg">404 | This page could not be found.</h2>
          <div className="mt-4">
            Return to{" "}
            <span className="underline">
              <Link href="/">Home</Link>
            </span>
          </div>
        </div>
      </main>

      <footer className="absolute top-full w-full">
        <Footer />
      </footer>
    </div>
  );
};

export default custom404;
