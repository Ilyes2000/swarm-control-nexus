import { LiveCallView } from "./LiveCallView";
import { SMSLog } from "./SMSLog";

export function CommPanel() {
  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto scrollbar-thin pr-1">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">
        Communications
      </h2>
      <LiveCallView />
      <SMSLog />
    </div>
  );
}
