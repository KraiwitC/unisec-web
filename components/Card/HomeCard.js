import { imageUrlFor } from "../../src/sanity/sanityClient";

const HomeCard = (props) => {
  const img = props.image
    ? imageUrlFor(props.image).url()
    : "/assets/blank.webp";

  return (
    <div className="vision-glass glass-transition relative cursor-pointer group/card overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 relative">
          <div
            className="rounded-b-none rounded-t-2xl md:rounded-r-none md:rounded-l-2xl lg:rounded-r-none lg:rounded-l-2xl"
            style={{
              backgroundImage: `url('${img}')`,
              backgroundRepeat: "no-repeat",
              backgroundSize: "cover",
              backgroundPosition: "center",
              paddingTop: "56.25%",
            }}
          ></div>
          <div className="px-8 py-4 pb-16">
            <h3 className="font-impact text-3xl">
              {props.title || "Untitled"}
            </h3>
            <div className="text-sm">{props.author}</div>
            <div className="mt-4 font-helvethaica-med-cond text-2xl">
              {props.description
                ? props.description.slice(0, 150) +
                  (props.description.length > 150 ? "..." : "")
                : ""}
            </div>
          </div>
          <div className="absolute bottom-0 w-full px-8 py-6 flex flex-row align-tems-end">
            <div className="absolute right-4 bottom-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="25"
                fill="none"
                viewBox="0 0 60 30"
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
