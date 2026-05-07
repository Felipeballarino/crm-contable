import { getInitials } from "@/lib/utils";

const SIZES = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-11 w-11 text-base",
};

export function ClientAvatar({
  name,
  size = "md",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <div
      className={`${SIZES[size]} rounded-full bg-indigo-100 text-indigo-700 font-semibold flex items-center justify-center shrink-0`}
    >
      {getInitials(name)}
    </div>
  );
}
