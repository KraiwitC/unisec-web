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

export default function SSAAdmin() {
  return (
    <main
      style={{
        padding: "20px",
      }}
    >
      <SSAMap showControls />
    </main>
  );
}