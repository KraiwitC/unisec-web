import { useState, useEffect } from "react";
import Hamburger from "hamburger-react";
import ActiveLink from "./ActiveLink";
import Link from "next/link";
import Image from "next/image";

const Menus = ({ text, link, isOpen, subMenus }) => (
  <div className="relative group">
    <ActiveLink href={link} activeClassName="btn-active">
      <div
        className={`relative cursor-pointer h-full text-center flex flex-col justify-center items-center px-4 py-2 text-sm md:text-base font-medium transition-colors ${
          isOpen ? "p-2" : "btn"
        }`}
      >
        {text}
      </div>
    </ActiveLink>
    {subMenus && subMenus.length > 0 ? (
      <div className="nav-glass absolute top-full right-0 mt-2 w-full z-50 hidden group-hover:block">
        <ul>
          {subMenus.map(({ text, link }) => (
            <Link href={link} key={text}>
              <li className="cursor-pointer px-4 py-2 text-center hover:bg-white/10 rounded-md">
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

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY >= 50);
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

  return (
    <>
      {/* Floating Navbar Pill */}
      <div className="fixed top-0 left-0 right-0 z-40 px-3 sm:px-6 pt-3 transition-all duration-300 ease-out">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 h-14 md:h-16 !rounded-full nav-glass">
          {/* Logo placeholder inside navbar pill */}
          <div className="flex items-center h-full">
            {!isHome ? (
              <Link href="/" className="flex items-center h-full">
                <Image
                  src="/assets/logo-w.webp"
                  width={484}
                  height={160}
                  className="w-[72px] md:w-[85px] h-auto object-contain cursor-pointer"
                  alt="UNISEC-Thailand"
                  priority
                />
              </Link>
            ) : (
              <div className="w-[72px] md:w-[85px] h-full" />
            )}
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

          {/* Mobile Hamburger */}
          <div className="flex md:hidden items-center">
            <Hamburger toggled={isOpen} toggle={setOpen} size={18} />
            {isOpen && (
              <div className="nav-glass absolute top-full right-3 mt-2 w-52 p-3 z-50 rounded-2xl">
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
            )}
          </div>
        </div>
      </div>

      {/* Discrete 2-State Dynamic Logo for Homepage */}
      {isHome && (
        <Link
          href="/"
          className={`fixed z-50 pointer-events-auto transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            scrolled
              ? "left-7 sm:left-10 md:left-14 lg:left-20 xl:left-28 top-4 md:top-5 w-[72px] md:w-[85px]"
              : "left-6 sm:left-12 md:left-16 lg:left-24 xl:left-32 top-20 md:top-24 xl:top-28 w-[220px] sm:w-[260px] md:w-[320px] lg:w-[360px] xl:w-[400px]"
          }`}
        >
          <Image
            src="/assets/logo-w.webp"
            width={484}
            height={160}
            className="w-full h-auto object-contain nav-hero-logo cursor-pointer filter drop-shadow-lg"
            alt="UNISEC-Thailand"
            priority
          />
        </Link>
      )}
    </>
  );
};

export default Navbar;
