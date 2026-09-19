const ImageCard = ({ image, backgroundSize, website }) => {
  const cardContent = (
    <div className="vision-glass glass-transition relative p-2">
      <div
        className="bg-white/5 relative rounded-[20px] border border-white/20 overflow-hidden"
        style={{
          paddingTop: "100%",
          backgroundImage: `url('${image}')`,
          backgroundRepeat: "no-repeat",
          backgroundSize: backgroundSize || "cover",
          backgroundPosition: "center",
        }}
      ></div>
    </div>
  );

  if (website) {
    return (
      <a
        href={website}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
        title="Visit website"
      >
        {cardContent}
      </a>
    );
  }

  return cardContent;
};

export default ImageCard;
