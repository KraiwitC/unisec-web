import { imageUrlFor } from "../../src/sanity/sanityClient";

const Card = (props) => {
  const img = props.image
    ? imageUrlFor(props.image).url()
    : "/assets/blank.webp";

  return (
    <div className="vision-glass glass-transition relative h-full cursor-pointer group/card rounded-[24px] overflow-hidden">
      <div className="relative h-full flex flex-col">
        <div
          className="rounded-t-[23px] overflow-hidden flex-shrink-0"
          style={{
            backgroundImage: `url('${img}')`,
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            backgroundPosition: "center",
            paddingTop: "56.25%",
          }}
        ></div>
        <div className="p-5 flex-grow flex flex-col">
          <h3 className="font-impact text-3xl text-white">
            {props.title || "Untitled"}
          </h3>
          <div className="text-sm text-gray-300">by {props.author}</div>
          <div className="mt-4 font-helvethaica-med-cond text-2xl text-gray-200">
            {props.description
              ? props.description.slice(0, 150) +
                (props.description.length > 150 ? "..." : "")
              : ""}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Card;
