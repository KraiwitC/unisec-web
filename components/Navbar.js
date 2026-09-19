import { useState, useEffect } from "react";
import Hamburger from "hamburger-react";
import ActiveLink from "./ActiveLink";
import Link from "next/link";
import Image from "next/image";

const Menus = ({ text, link, isOpen, subMenus }) => (
  <div className="relative group w-full md:w-auto">
    <ActiveLink href={link} activeClassName="btn-active">
      <div
        className={`relative cursor-pointer h-full text-center flex flex-col justify-center items-center text-sm md:text-base font-medium transition-all duration-200 rounded-xl ${
          isOpen
            ? "w-full py-3 px-4 my-0.5 hover:bg-black/50 hover:bg-white/10 hover:shadow-inner text-white"
            : "px-4 py-2 btn"
        }`}
      >
        {text}
      </div>
    </ActiveLink>
    {subMenus && subMenus.length > 0 ? (
      <div
        className="absolute top-full right-0 mt-2 w-full z-50 hidden group-hover:block rounded-xl overflow-hidden border border-white/20"
        style={{
          backgroundColor: "rgba(15, 23, 42, 0.85)",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          transform: "translateZ(0)",
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.3)",
        }}
      >
        <ul>
          {subMenus.map(({ text, link }) => (
            <Link href={link} key={text}>
              <li className="cursor-pointer px-4 py-2 text-center hover:bg-white/10 transition-colors">
                {text}
              </li>
            </Link>
          ))}
        </ul>
      </div>
    ) : null}
  </div>
);

const Navbar = ({ page, isClient }) => {
  const [isOpen, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [logoScrolled, setLogoScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY >= 1);
      setLogoScrolled(window.scrollY >= 200);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const menus = [
    { text: "Home", link: "/" },
    { text: "Activity", link: "/activity" },
    { text: "About us", link: "/about" },
    { text: "Support us", link: "/support" },
  ];

  const isHome = page === "home" && (isClient === undefined ? true : !!isClient);
  const showSmallLogo = !isHome || logoScrolled;

  return (
    <div className="fixed top-0 left-0 right-0 z-40 px-3 sm:px-6 pt-3 transition-all duration-300 ease-out">
      {/* Floating Navbar Pill with Chrome + Safari compatible inline backdrop filter */}
      <div
        className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 h-16 md:h-18 !rounded-full transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{
          backgroundColor: scrolled ? "rgba(15, 23, 42, 0.75)" : "rgba(15, 23, 42, 0.45)",
          backdropFilter: scrolled ? "blur(28px) saturate(180%)" : "blur(16px)",
          WebkitBackdropFilter: scrolled ? "blur(28px) saturate(180%)" : "blur(16px)",
          border: scrolled ? "1px solid rgba(255, 255, 255, 0.22)" : "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow: scrolled
            ? "inset 0 1px 1px rgba(255, 255, 255, 0.3), 0 20px 40px rgba(0, 0, 0, 0.5)"
            : "0 8px 24px rgba(0, 0, 0, 0.2)",
          transform: scrolled ? "translateZ(0) scale(1.01)" : "translateZ(0) scale(1)",
        }}
      >
        {/* Small Logo inside Navbar Pill */}
        <div className="flex items-center h-full">
          <Link
            href="/"
            className={`flex items-center h-full transition-opacity duration-300 ease-out ${
              showSmallLogo
                ? "opacity-100 pointer-events-auto"
                : "opacity-0 pointer-events-none"
            }`}
          >
            <Image
              src="/assets/logo-w.webp"
              width={484}
              height={160}
              className="w-[72px] md:w-[85px] h-auto object-contain cursor-pointer"
              alt="UNISEC-Thailand"
              priority
            />
          </Link>
        </div>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center space-x-1 lg:space-x-4">
          {menus.map(({ text, link, children }, i) => (
            <Menus
              key={i}
              text={text}
              link={link}
              isOpen={isOpen}
              subMenus={children}
            />
          ))}
        </div>

        {/* Mobile Hamburger Toggle Icon */}
        <div className="flex md:hidden items-center">
          <Hamburger toggled={isOpen} toggle={setOpen} size={18} />
        </div>
      </div>

      {/* Mobile Menu Dropdown Panel */}
      {isOpen && (
        <div className="max-w-7xl mx-auto px-1 sm:px-6 mt-2 flex justify-end">
          <div
            className="w-56 p-2.5 rounded-2xl shadow-2xl flex flex-col space-y-1 border border-white/20"
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.85)",
              backdropFilter: "blur(24px) saturate(180%)",
              WebkitBackdropFilter: "blur(24px) saturate(180%)",
              transform: "translateZ(0)",
              boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.3)",
            }}
          >
            {menus.map(({ text, link, children }, i) => (
              <Menus
                key={i}
                text={text}
                link={link}
                isOpen={true}
                subMenus={children}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
