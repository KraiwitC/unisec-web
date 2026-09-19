import { imageUrlFor } from "../../src/sanity/sanityClient";

const HomeCard = (props) => {
  const img = props.image
    ? imageUrlFor(props.image).url()
    : "/assets/blank.webp";

  return (
    <div className="vision-glass glass-transition relative cursor-pointer group/card overflow-hidden rounded-[24px]">
      <div className="grid grid-cols-1 md:grid-cols-2 relative">
        <div
          className="rounded-b-none rounded-t-2xl md:rounded-r-none md:rounded-l-2xl"
          style={{
            backgroundImage: `url('${img}')`,
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            backgroundPosition: "center",
            paddingTop: "56.25%",
          }}
        ></div>
        <div className="px-8 py-6 pb-16">
          <h3 className="font-impact text-3xl text-white">
            {props.title || "Untitled"}
          </h3>
          <div className="text-sm text-gray-300">{props.author}</div>
          <div className="mt-4 font-helvethaica-med-cond text-2xl text-gray-200">
            {props.description
              ? props.description.slice(0, 150) +
                (props.description.length > 150 ? "..." : "")
              : ""}
          </div>
        </div>
        <div className="absolute bottom-0 w-full px-8 py-4 flex flex-row justify-end items-center">
          <div className="right-4 bottom-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24"
              fill="none"
              viewBox="0 0 60 30"
              className="transition-transform group-hover/card:translate-x-1"
            >
              <path
                stroke="#fff"
                strokeMiterlimit="10"
                strokeWidth="2"
                d="M58.53 14.75H0M44.69.9l13.84 13.85-13.84 13.84"
              ></path>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeCard;
