import { MaterialIcon } from "@/components/ui/MaterialIcon";

type CreditStatusProps = {
  className?: string;
  label?: string;
  loggedIn?: boolean;
  points?: number;
};

export function CreditStatus({ className = "", label = "量化探索者", loggedIn = false, points = 500 }: CreditStatusProps) {
  return (
    <div
      className={`flex items-center gap-sm rounded-lg px-sm py-md text-left transition-colors ${
        loggedIn ? "bg-primary-soft" : "border border-steel/40 bg-paper hover:border-primary-soft hover:bg-surface-container-low"
      } ${className}`}
    >
      <span
        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${
          loggedIn ? "bg-paper text-primary-bright" : "bg-surface-container text-secondary"
        }`}
      >
        <MaterialIcon fill={loggedIn} size={20}>
          {loggedIn ? "person" : "person_add"}
        </MaterialIcon>
      </span>
      <div className="min-w-0">
        <p className="truncate text-caption-bold text-ink">{loggedIn ? label : "未登录"}</p>
        {loggedIn ? (
          <p className="text-caption-sm text-on-surface-variant">
            可用积分: <span className="font-bold text-primary-bright">{points}</span>
          </p>
        ) : (
          <p className="text-caption-sm text-on-surface-variant">登录后查看积分</p>
        )}
      </div>
    </div>
  );
}
