import { motion, AnimatePresence } from "framer-motion";
import { useMission } from "@/contexts/MissionContext";
import type { MerchantOfferType } from "@/contexts/MissionContext";

const offerTypeBadge: Record<MerchantOfferType, { label: string; color: string }> = {
  accept: { label: "Accept", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  counter: { label: "Counter", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  offpeak: { label: "Off-Peak", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
  promo: { label: "Promo", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
  no_response: { label: "No Reply", color: "bg-slate-500/20 text-slate-300 border-slate-500/30" },
};

const resolutionBadge: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" },
  booked: { label: "Booked", color: "bg-green-500/20 text-green-300 border-green-500/30" },
  rejected_by_user: { label: "Rejected by User", color: "bg-red-500/20 text-red-300 border-red-500/30" },
  manual_followup: { label: "Manual Follow-up", color: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30" },
  abandoned: { label: "Abandoned", color: "bg-orange-500/20 text-orange-300 border-orange-500/30" },
};

const decisionBadge: Record<string, { label: string; color: string }> = {
  accept: { label: "Negotiator Accepted", color: "bg-green-500/20 text-green-300 border-green-500/30" },
  counter: { label: "Negotiator Deferred", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  defer: { label: "Manual Follow-up", color: "bg-zinc-500/20 text-zinc-300 border-zinc-500/30" },
  reject: { label: "Negotiator Rejected", color: "bg-red-500/20 text-red-300 border-red-500/30" },
};

export function MerchantOffers() {
  const { merchantOffers } = useMission();

  if (merchantOffers.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Merchant Copilot</h3>

      <div className="space-y-2 max-h-56 overflow-y-auto scrollbar-thin">
        <AnimatePresence>
          {merchantOffers.map((offer) => {
            const typeBadge = offerTypeBadge[offer.merchantOutcome ?? offer.offerType] || offerTypeBadge.accept;
            const dBadge = offer.negotiatorDecision ? decisionBadge[offer.negotiatorDecision] : null;
            const rBadge = resolutionBadge[offer.finalResolution ?? "pending"] || resolutionBadge.pending;

            return (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 border-l-2 border-l-amber-500/50"
              >
                <div className="flex items-center justify-between mb-1.5 gap-2">
                  <div>
                    <span className="text-[11px] font-semibold text-foreground">{offer.venueName}</span>
                    {offer.workflow && (
                      <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">{offer.workflow}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-1.5">
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${typeBadge.color}`}>{typeBadge.label}</span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${rBadge.color}`}>{rBadge.label}</span>
                    {offer.finalized !== undefined && (
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${
                          offer.finalized
                            ? "border-success/30 bg-success/10 text-success"
                            : "border-border/40 bg-muted/30 text-muted-foreground"
                        }`}
                      >
                        {offer.finalized ? "Finalized" : "Open"}
                      </span>
                    )}
                  </div>
                </div>

                {offer.requestLabel && (
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">{offer.requestLabel}</p>
                )}

                <div className="space-y-1.5">
                  <div>
                    <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">Original Ask</p>
                    <p className="text-[11px] text-foreground/70 leading-relaxed">{offer.originalRequest}</p>
                  </div>

                  <div>
                    <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">Merchant Response</p>
                    <p className="text-[11px] text-foreground/85 leading-relaxed">{offer.merchantResponse}</p>
                  </div>

                  <div>
                    <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Final Outcome</p>
                    <span className={`inline-flex text-[9px] font-mono px-1.5 py-0.5 rounded border ${rBadge.color}`}>
                      {rBadge.label}
                    </span>
                  </div>

                  {dBadge && (
                    <div>
                      <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Negotiator Decision</p>
                      <span className={`inline-flex text-[9px] font-mono px-1.5 py-0.5 rounded border ${dBadge.color}`}>
                        {dBadge.label}
                      </span>
                    </div>
                  )}
                </div>

                {(offer.details.time || offer.details.discount || offer.details.promoCode || offer.details.note) && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {offer.details.time && (
                      <span className="text-[9px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">{offer.details.time}</span>
                    )}
                    {offer.details.discount && (
                      <span className="text-[9px] font-mono text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">{offer.details.discount} off</span>
                    )}
                    {offer.details.promoCode && (
                      <span className="text-[9px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">Code: {offer.details.promoCode}</span>
                    )}
                    {offer.details.note && <span className="text-[9px] font-mono text-muted-foreground">{offer.details.note}</span>}
                  </div>
                )}

                <p className="text-[9px] text-muted-foreground mt-1.5 font-mono">{offer.timestamp}</p>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
