const Unisec = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        <div className="flex flex-col justify-center items-center lg:items-start">
          <div
            className="relative my-4 lg:my-8"
            data-aos="flip-down"
            data-aos-duration="500"
          >
            <h1 className="font-impact text-6xl md:text-8xl lg:text-9xl text-gray-700/60 text-center lg:text-left select-none">
              What is UNISEC
            </h1>
            <h1 className="absolute inset-0 font-impact text-6xl md:text-8xl lg:text-9xl text-center lg:text-left text-white">
              What is UNISEC
            </h1>
          </div>
        </div>
        <div>
          <div className="relative my-4">
            <div className="bg-custom-primary relative rounded-2xl border-2 border-white z-20">
              <div className="p-6 sm:p-8 lg:p-10 text-sm md:text-base leading-relaxed" data-aos="fade">
                UNISEC-Global is an international nonprofit body, consisting of
                local-chapters across the world. Since its establishment in
                November 2013 in Japan, UNISEC-Global has provided a forum every
                year to promote practical space development activities, mainly at
                university level, such as designing, developing, manufacturing,
                launching and operating micro/nano/pico satellites and rockets,
                including their payloads. University students, young researchers,
                their tutors and other stakeholders around the world participate
                in the annual UNISEC-Global Meeting.
              </div>
            </div>
            <div className="absolute w-full top-3 left-3 rounded-2xl bg-custom-primary border-2 border-white z-10 h-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unisec;
