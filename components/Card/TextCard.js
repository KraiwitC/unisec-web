const TextCard = (props) => {
  return (
    <div className="vision-glass relative">
        <div className="p-8">
          <h2 className="font-impact text-3xl">{props.title}</h2>
          <div className="text-sm mt-2">{props.description}</div>
        </div>
    </div>
  );
};

export default TextCard;
