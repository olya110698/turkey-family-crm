interface Props {
  label: string;
  value: number | string;
  note: string;
  icon: string;
}

export function Stat({ label, value, note, icon }: Props) {
  return (
    <div className="stat card">
      <span className="stat-icon">{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
    </div>
  );
}
