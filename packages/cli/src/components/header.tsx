export function Header() {
  return (
    <box justifyContent="center" alignItems="center">
      <box flexDirection="row" justifyContent="center" gap={0.5} alignItems="center">
        <ascii-font font="pallet" text="Border" color="gray" />
        <ascii-font font="pallet" text="Code" />
      </box>
    </box>
  );
};
