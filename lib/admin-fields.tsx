import type { Profile } from "@/lib/database.types";
export function Field({
  name,
  label,
  value = "",
  type = "text",
  required = false,
}: {
  name: string;
  label: string;
  value?: string | number;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="field">
      <label>
        {label}
        <input
          aria-label={label}
          name={name}
          type={type}
          step={type === "number" ? "any" : undefined}
          defaultValue={value}
          required={required}
        />
      </label>
    </div>
  );
}
export function Area({
  name,
  label,
  value = "",
  rows = 4,
}: {
  name: string;
  label: string;
  value?: string;
  rows?: number;
}) {
  return (
    <div className="field">
      <label>
        {label}
        <textarea
          aria-label={label}
          name={name}
          defaultValue={value}
          rows={rows}
        />
      </label>
    </div>
  );
}
export function Select({
  name,
  label,
  options,
  value = "",
}: {
  name: string;
  label: string;
  options: readonly string[];
  value?: string;
}) {
  return (
    <div className="field">
      <label>
        {label}
        <select aria-label={label} name={name} defaultValue={value}>
          {options.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
export function Assignment({
  team,
  value,
}: {
  team: Profile[];
  value?: string | null;
}) {
  return (
    <div className="field">
      <label>
        Assigned agent
        <select
          aria-label="Assigned agent"
          name="assigned_to"
          defaultValue={value || ""}
        >
          <option value="">Unassigned</option>
          {team
            .filter((p) => p.active && p.role !== "visitor")
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name || p.id}
              </option>
            ))}
        </select>
      </label>
    </div>
  );
}
export function Check({
  name,
  label,
  checked = false,
}: {
  name: string;
  label: string;
  checked?: boolean;
}) {
  return (
    <label className="form-check">
      <input type="checkbox" name={name} defaultChecked={checked} />
      <span>{label}</span>
    </label>
  );
}
