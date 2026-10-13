import dynamic from "next/dynamic";

const SSAMap = dynamic(
  () =>
    import(
      "../../../components/SSA/SSAMap"
    ),
  {
    ssr: false,
  }
);

export default function SSA() {
  return (
    <main
      style={{
        padding: "20px",
      }}
    >
      <SSAMap />
    </main>
  );
}