import ImageCard from "./Card/ImageCard";

const Sponsor = ({ sponsors }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 pb-16 md:pb-24">
      <div className="relative my-8 md:my-12 text-center">
        <h2 className="font-impact text-5xl md:text-7xl lg:text-8xl text-gray-700/60 select-none">
          Our Sponsors
        </h2>
        <h2 className="absolute inset-0 font-impact text-5xl md:text-7xl lg:text-8xl text-white">
          Our Sponsors
        </h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
        {sponsors && sponsors.map((sponsor) => (
          <ImageCard key={sponsor._id} image={sponsor.imageUrl} website={sponsor.website} />
        ))}
      </div>
    </div>
  );
};

export default Sponsor;
