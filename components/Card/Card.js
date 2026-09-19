import { imageUrlFor } from "../../src/sanity/sanityClient";

const Card = (props) => {
  const img = props.image
    ? imageUrlFor(props.image).url()
    : "/assets/blank.webp";

  return (
    <div className="vision-glass glass-transition relative h-full cursor-pointer group/card">
      <div className="relative h-full">
          <div
            className="rounded-t-[23px] overflow-hidden"
            style={{
              backgroundImage: `url('${img}')`,
              backgroundRepeat: "no-repeat",
              backgroundSize: "cover",
              backgroundPosition: "center",
              paddingTop: "56.25%",
            }}
          ></div>
          <div className="p-5">
            <h3 className="font-impact text-3xl">
              {props.title || "Untitled"}
            </h3>
            <div className="text-sm">by {props.author}</div>
            <div className="mt-4 font-helvethaica-med-cond text-2xl">
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
