import dynamic from "next/dynamic";
import SSAControls from "../../../components/SSA/SSAControls";

const SSAMap = dynamic(
  () => import("../../../components/SSA/SSAMap"),
  { ssr: false }
);

export default function SSAAdmin() {
  return (
    <main style={{ padding: "20px" }}>
      <SSAControls />
      <SSAMap />
    </main>
  );
}