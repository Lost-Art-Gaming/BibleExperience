// Placeholder toast host. A future task wires actual show/hide behavior
// (e.g. via context) through this fixed node; the id/role contract is what
// matters for now.
export function Toast() {
  return <div id="toast" className="toast" role="status" aria-live="polite" />;
}
