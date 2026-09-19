import TextCard from "../Card/TextCard";

const Mission = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
        <div className="flex flex-col justify-center w-full" data-aos="fade-up">
          <TextCard
            title="Our Mission"
            description="Support and promote its members in the study and exploration of space technology affairs; to foster inspiration and motivation for the development of space technology; and to facilitate the exchange of knowledge and experiences among members and interested individuals. The Association also aims to organize workshops and educational activities to promote accessibility and understanding of space technology, and to coordinate and collaborate with legally recognized private organizations in advancing space technology. Furthermore, the Association supports freedom of thought and independent work in the field of space technology, encourages cooperation with other charitable organizations for public benefit."
          />
        </div>
        <div className="flex flex-col justify-center w-full" data-aos="fade-up">
          <TextCard
            title="Our Vision"
            description="Space technology is closer to us than we may think."
          />
        </div>
      </div>
    </div>
  );
};

export default Mission;
