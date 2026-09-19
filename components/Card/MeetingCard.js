import { imageUrlFor } from "../../src/sanity/sanityClient";
import Image from "next/image";

const MeetingCard = (props) => {
  const img = props.image
    ? imageUrlFor(props.image).url()
    : "/assets/blank.webp";

  return (
    <div className="vision-glass glass-transition relative cursor-pointer group/card overflow-hidden">
        <div className="relative">
          <div className="relative w-full pb-[100%] overflow-hidden">
            <Image
              src={img}
              alt={props.title || "Untitled"}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              style={{ objectFit: "cover" }}
            />
          </div>
          {/* <div className="p-3 md:p-5">
            <h3 className="font-impact text-md md:text-2xl tracking-wide bold">
              {props.title || "Untitled"}
            </h3>
            <div className="text-xs md:text-sm">by {props.author}</div>
            <div className="mt-2 md:mt-4 font-helvethaica-med-cond text-sm md:text-lg">
              {props.description
                ? props.description.slice(0, 150) +
                (props.description.length > 150 ? "..." : "")
                : ""}
            </div>
          </div> */}
        </div>
    </div>
  );
};

export default MeetingCard;
