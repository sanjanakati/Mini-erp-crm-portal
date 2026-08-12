// Statuses render as ink stamps rather than flat pills -- a nod to the
// physical carbon-copy challan pads this app replaces, where DRAFT /
// CONFIRMED / CANCELLED were literally rubber-stamped onto paper.
const STAMP_CLASS: Record<string, string> = {
  LEAD: 'stamp-amber',
  ACTIVE: 'stamp-green',
  INACTIVE: 'stamp-slate',
  DRAFT: 'stamp-slate',
  CONFIRMED: 'stamp-green',
  CANCELLED: 'stamp-red',
  IN: 'stamp-green',
  OUT: 'stamp-red',
  RETAIL: 'stamp-navy',
  WHOLESALE: 'stamp-amber',
  DISTRIBUTOR: 'stamp-navy',
};

export function StatusBadge({ value }: { value: string }) {
  const cls = STAMP_CLASS[value] ?? 'stamp-slate';
  return <span className={`stamp ${cls}`}>{value}</span>;
}
