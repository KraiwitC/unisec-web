const TextCard = (props) => {
  return (
    <div className="relative h-full">
      <div className="bg-custom-primary relative rounded-2xl border-2 border-white z-20 p-6 sm:p-8 lg:p-10 h-full flex flex-col justify-start">
        <h2 className="font-impact text-3xl md:text-4xl text-white mb-4">{props.title}</h2>
        <div className="text-sm md:text-base leading-relaxed text-white/90">
          {props.description}
        </div>
      </div>
      <div className="absolute w-full top-3 left-3 rounded-2xl bg-custom-primary border-2 border-white z-10 h-full"></div>
    </div>
  );
};

export default TextCard;
