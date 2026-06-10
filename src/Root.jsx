import GhostOpDashboard from "./GhostOp";
import RetailApp from "./App";

export default function Root() {
  const isRetail = window.location.hash === "#retailos";

  const goToRetail = () => {
    window.location.hash = "retailos";
    window.location.reload();
  };

  const goToGhost = () => {
    window.location.hash = "";
    window.location.reload();
  };

  if (isRetail) return <RetailApp onGhostOp={goToGhost} />;
  return <GhostOpDashboard onSwitchToRetail={goToRetail} />;
}
