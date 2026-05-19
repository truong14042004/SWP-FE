export function CareerRoleSelect({ roles, value, onChange, required = false }) {
  return (
    <label>
      <span>Vai trò mong muốn (Career Role)</span>
      <select name="targetRoleId" value={value} onChange={onChange} required={required}>
        <option value="">Chọn career role</option>
        {roles.map((role) => (
          <option key={role.id} value={role.id}>
            {role.name}
          </option>
        ))}
      </select>
    </label>
  );
}
