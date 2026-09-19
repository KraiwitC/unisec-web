import { imageUrlFor } from "../../src/sanity/sanityClient";
import Image from "next/image";

const MeetingCard = (props) => {
  const img = props.image
    ? imageUrlFor(props.image).url()
    : "/assets/blank.webp";

  return (
    <div className="vision-glass glass-transition relative cursor-pointer group/card overflow-hidden rounded-[24px]">
      <div className="relative w-full pb-[100%] overflow-hidden">
        <Image
          src={img}
          alt={props.title || "Untitled"}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          style={{ objectFit: "cover" }}
        />
      </div>
    </div>
  );
};

export default MeetingCard;
