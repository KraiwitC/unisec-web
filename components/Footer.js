import Link from "next/link";
import Image from "next/image";
const Footer = () => {
  return (
    <div className="border-t border-white/15">
      <div className="container mx-auto py-10">
        <div className="glass-panel px-4 sm:px-6">
          <div className="container grid grid-cols-2 md:grid-cols-2 lg:grid-cols-7 gap-8 py-8 px-6">
            <div className="flex flex-col justify-center items-center lg:col-span-2 mt-2">
              <div className="justify-center items-center my-auto pr-4">
              <Image
                src="/assets/logo-w.webp"
                width={200}
                height={66}
                style={{ height: "auto" }}
                className=""
                alt="UNISEC-Thailand"
              />
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <a
              href="https://www.facebook.com/unisecthailand"
              className="my-2 flex flex-row justify-start items-end"
            >
              <div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                  className="svg-inline--fa fa-facebook-square w-6"
                  data-icon="facebook-square"
                  data-prefix="fab"
                  viewBox="0 0 448 512"
                >
                  <path
                    fill="currentColor"
                    d="M400 32H48A48 48 0 000 80v352a48 48 0 0048 48h137.25V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.27c-30.81 0-40.42 19.12-40.42 38.73V256h68.78l-11 71.69h-57.78V480H400a48 48 0 0048-48V80a48 48 0 00-48-48z"
                  ></path>
                </svg>
              </div>
              <div className="ml-4">Facebook</div>
            </a>
            <a
              href="https://www.instagram.com/unisec_thailand/"
              className="my-2 flex flex-row justify-start items-end"
            >
              <div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="currentColor"
                  className="bi bi-instagram"
                  viewBox="0 0 16 16"
                >
                  <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.917 3.917 0 0 0-1.417.923A3.927 3.927 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.916 3.916 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.926 3.926 0 0 0-.923-1.417A3.911 3.911 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0h.003zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599.28.28.453.546.598.92.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.47 2.47 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.478 2.478 0 0 1-.92-.598 2.48 2.48 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233 0-2.136.008-2.388.046-3.231.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92.28-.28.546-.453.92-.598.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045v.002zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92zm-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217zm0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334z" />
                </svg>
              </div>
              <div className="ml-4">Instagram</div>
            </a>
            <a
              href="https://www.youtube.com/channel/UCRv9v1-S1Zgcx3nkTewcKHg"
              className="my-2 flex flex-row justify-start items-end"
            >
              <div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="currentColor"
                  className="bi bi-youtube"
                  viewBox="0 0 16 16"
                >
                  <path d="M8.051 1.999h.089c.822.003 4.987.033 6.11.335a2.01 2.01 0 0 1 1.415 1.42c.101.38.172.883.22 1.402l.01.104.022.26.008.104c.065.914.073 1.77.074 1.957v.075c-.001.194-.01 1.108-.082 2.06l-.008.105-.009.104c-.05.572-.124 1.14-.235 1.558a2.007 2.007 0 0 1-1.415 1.42c-1.16.312-5.569.334-6.18.335h-.142c-.309 0-1.587-.006-2.927-.052l-.17-.006-.087-.004-.171-.007-.171-.007c-1.11-.049-2.167-.128-2.654-.26a2.007 2.007 0 0 1-1.415-1.419c-.111-.417-.185-.986-.235-1.558L.09 9.82l-.008-.104A31.4 31.4 0 0 1 0 7.68v-.123c.002-.215.01-.958.064-1.778l.007-.103.003-.052.008-.104.022-.26.01-.104c.048-.519.119-1.023.22-1.402a2.007 2.007 0 0 1 1.415-1.42c.487-.13 1.544-.21 2.654-.26l.17-.007.172-.006.086-.003.171-.007A99.788 99.788 0 0 1 7.858 2h.193zM6.4 5.209v4.818l4.157-2.408L6.4 5.209z" />
                </svg>
              </div>
              <div className="ml-4">YouTube</div>
            </a>
          </div>
          <div>
            <h4 className="font-bold">About us</h4>
            <ul className="mt-2 text-sm">
              <Link href="/about">
                <li className="cursor-pointer hover:underline font-helvethaica-med-cond text-lg">
                  UNISEC
                </li>
              </Link>
              <Link href="/about#partners">
                <li className="cursor-pointer hover:underline font-helvethaica-med-cond text-lg">
                  Partners
                </li>
              </Link>
              <Link href="/about#sponsors">
                <li className="cursor-pointer hover:underline font-helvethaica-med-cond text-lg">
                  Sponsors
                </li>
              </Link>
              <Link href="/documents/registration-certificate.pdf">
                <li className="cursor-pointer hover:underline font-helvethaica-med-cond text-lg">
                  Certificate
                </li>
              </Link>
            </ul>
          </div>
          <div>
            <h4 className="font-bold">Contact</h4>
            <ul className="mt-2 text-sm">
              <li className="cursor-pointer hover:underline font-helvethaica-med-cond text-lg">
                unisec-thailand@unisec-thailand.org
              </li>
              {/*
              <Link href="https://www.google.com/maps">
                <li className="cursor-pointer hover:underline font-helvethaica-med-cond text-lg">
                  Location
                </li>
  </Link>*/}
            </ul>
          </div>
          <div>
            <h4 className="font-bold">Project</h4>
            <ul className="mt-2 text-sm">
              <li className="cursor-pointer hover:underline font-helvethaica-med-cond text-lg">
                Comming Soon
              </li>
              {/*projectsData.slice(0, 3).map((item, i) => (
                <Link key={i} href={"/activity/" + item.id}>
                  <li
                    key={item.title}
                    className="cursor-pointer hover:underline font-helvethaica-med-cond text-lg"
                  >
                    {item.title}
                  </li>
                </Link>
              ))*/}
            </ul>
          </div>
          <div>
            <h4 className="font-bold">Activity</h4>
            <ul className="mt-2 text-sm">
              <Link href="/activity#online-meeting">
                <li className="cursor-pointer hover:underline font-helvethaica-med-cond text-lg">
                  Online Meeting
                </li>
              </Link>
              <Link href="/activity#our-activity">
                <li className="cursor-pointer hover:underline font-helvethaica-med-cond text-lg">
                  Our Activity
                </li>
              </Link>
              <Link href="/activity#upcomming-activity">
                <li className="cursor-pointer hover:underline font-helvethaica-med-cond text-lg">
                  Upcomming Activity
                </li>
              </Link>
            </ul>
          </div>
        </div>
        </div>
      </div>
      <div className="text-center mt-8 text-sm text-white/70">
        Copyright © {new Date().getFullYear()} UNISEC Thailand. All rights reserved
      </div>
    </div>
  );
};

export default Footer;
