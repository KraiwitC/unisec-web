import { useState, useEffect } from "react";
import Hamburger from "hamburger-react";
import ActiveLink from "./ActiveLink";
import Link from "next/link";
import Image from "next/image";

const Menus = ({ text, link, isOpen, subMenus }) => (
  <div className="relative group">
    <ActiveLink href={link} activeClassName="btn-active">
      <div
        className={`relative cursor-pointer h-full text-center flex flex-col justify-center items-center ${isOpen ? "p-2" : "btn"
          }`}
      >
        {text}
      </div>
    </ActiveLink>
    <div
      className={`glass-panel absolute top-full right-0 mt-2 w-full z-50 hidden group-hover:block`}
    >
      <ul>
        {subMenus
          ? subMenus.map(({ text, link }) => (
            <Link href={link} key={text}>
              <li
                className={`cursor-pointer px-4 py-2 text-center hover:bg-custom-primary rounded-md ${isOpen ? "p-2" : "btn"
                  }`}
              >
                {text}
              </li>
            </Link>
          ))
          : null}
      </ul>
    </div>
  </div>
);

const Navbar = ({ page, logoStyle, isClient }) => {
  const [isOpen, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Toggle "floating pill" state once the page has scrolled past the top.
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const menus = [
    {
      text: "Home",
      link: "/",
    },
    {
      text: "Activity",
      link: "/activity",
    },
    {
      text: "About us",
      link: "/about",
    },
    {
      text: "Support us",
      link: "/support",
    },
  ];

  // Homepage hero state: the large, dynamic logo. Prefer the `logoStyle`
  // prop computed by the home page (it interpolates between the hero pose
  // and the pill resting pose over the first ~250px of scroll, which gives
  // us a smooth, scroll-driven scale for free); otherwise fall back to a
  // centered large layout so the animation still works standalone.
  const isHome = page === "home" && !!isClient;
  const heroLogoStyle =
    logoStyle &&
    Number.isFinite(logoStyle.left) &&
    Number.isFinite(logoStyle.top) &&
    Number.isFinite(logoStyle.width)
      ? logoStyle
      : {
          left:
            typeof window !== "undefined"
              ? Math.max(48, (window.innerWidth - 280) / 2)
              : 48,
          width: 280,
          top: 60,
        };

  // Logo image aspect ratio (484x160) and the inner header height:
  // h-24 (96px) at the top, h-20 (80px) once scrolled.
  const LOGO_ASPECT = 160 / 484;
  const headerHeight = scrolled ? 80 : 96;
  const logoWidth = heroLogoStyle.width;
  const logoHeight = logoWidth * LOGO_ASPECT;

  // Final logo geometry (home page only — other pages use the static pill):
  //  - Hero pose (!scrolled): use the page's style as-is. The logo is
  //    allowed to extend past the bottom edge of the navbar and overflow
  //    cleanly below the pill (the logo cell keeps `overflow: visible`, so
  //    nothing ever clips it).
  //  - Pill pose (scrolled): snap into a neat, vertically-centered resting
  //    position inside the pill once the scroll interpolation has settled.
  const currentLogoStyle = scrolled
    ? {
        left: heroLogoStyle.left,
        width: logoWidth,
        height: logoHeight,
        top: (headerHeight - logoHeight) / 2,
      }
    : {
        left: heroLogoStyle.left,
        width: logoWidth,
        height: logoHeight,
        top: heroLogoStyle.top,
      };

  // At the very top: a subtle frosted surface so the navbar never blends
  // into the background or looks broken. Once scrolled: the richer
  // liquid-glass "vision-glass" pill.
  const panelClasses = scrolled ? "vision-glass" : "nav-glass-top";

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 px-3 pt-3 transition-all duration-300 ease-out">
        <div
          className={`grid grid-cols-3 md:grid-cols-2 xl:grid-cols-3 px-4 !rounded-[28px] transition-all duration-300 ease-out ${panelClasses}`}
        >
          <div
            className={`col-span-2 md:col-span-1 xl:col-span-2 flex items-center px-4 md:px-12 relative overflow-visible transition-all duration-300 ease-out ${
              scrolled ? "h-20" : "h-24"
            } z-30 pointer-events-auto`}
          >
            <Link href="/" className="relative flex items-center h-full pointer-events-auto">
              {page === "home" ? (
                <Image
                  src="/assets/logo-w.webp"
                  width={484}
                  height={160}
                  className="nav-hero-logo cursor-pointer absolute transition-[width,height,left,top] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  style={{
                    left: `${currentLogoStyle.left}px`,
                    top: `${currentLogoStyle.top}px`,
                    width: `${currentLogoStyle.width}px`,
                    height: `${currentLogoStyle.height}px`, // Hero pose may overflow the pill below
                    transform: "translateZ(0)", // Hardware acceleration
                  }}
                  alt="UNISEC-Thailand"
                  priority
                />
              ) : (
                // Sleek pill: logo scales down slightly once scrolled.
                <Image
                  src="/assets/logo-w.webp"
                  width={484}
                  height={160}
                  className={`cursor-pointer w-auto object-contain transition-[width,height,transform] duration-[450ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    scrolled ? "h-8 md:h-10" : "h-10 md:h-12"
                  }`}
                  alt="UNISEC-Thailand"
                  priority
                />
              )}
            </Link>
          </div>
          <div className={`hidden md:grid grid-cols-4 px-4`}>
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
          <div className="flex md:hidden flex-col justify-center items-end px-12">
            <Hamburger toggled={isOpen} toggle={setOpen} />
            <div
              className={`glass-panel ${isOpen ? "block" : "hidden"
                } absolute top-full right-0 mt-2 w-2/3 p-2`}
            >
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
          </div>
        </div>
      </div>
    </>
  );
};
export default Navbar;
