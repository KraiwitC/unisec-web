const TextCard = (props) => {
  return (
    <div className="relative h-full">
      <div className="bg-custom-primary relative rounded-2xl border-2 border-white z-20 p-8 h-full">
        <h2 className="font-impact text-3xl text-white">{props.title}</h2>
        <div className="text-sm md:text-base mt-3 text-white/90 leading-relaxed font-helvethaica-med-cond text-xl md:text-2xl">
          {props.description}
        </div>
      </div>
      <div className="absolute w-full top-3 left-3 rounded-2xl bg-custom-primary border-2 border-white z-10 h-full"></div>
    </div>
  );
};

export default TextCard;
