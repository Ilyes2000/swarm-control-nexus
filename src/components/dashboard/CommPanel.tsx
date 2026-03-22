import { LiveCallView } from "./LiveCallView";
import { MerchantOffers } from "./MerchantOffers";
import { SMSLog } from "./SMSLog";
import { VenueIntelligencePanel } from "./VenueIntelligencePanel";
import { SkillGenomePanel } from "./SkillGenomePanel";

export function CommPanel() {
  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto scrollbar-thin pr-1">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">
        Communications
      </h2>
      <LiveCallView />
      <VenueIntelligencePanel />
      <SkillGenomePanel />
      <MerchantOffers />
      <SMSLog />
    </div>
  );
}
