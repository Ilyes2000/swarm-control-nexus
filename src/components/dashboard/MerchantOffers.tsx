import { motion, AnimatePresence } from "framer-motion";
import { useMission } from "@/contexts/MissionContext";
import type { MerchantOfferType } from "@/contexts/MissionContext";

const offerTypeBadge: Record<MerchantOfferType, { label: string; color: string }> = {
  accept: { label: "Accept", color: "bg-green-500/20 text-green-400 border-green-500/30" },
  counter: { label: "Counter", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  offpeak: { label: "Off-Peak", color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
  promo: { label: "Promo", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
};

const statusBadge: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-yellow-500/20 text-yellow-400" },
  accepted: { label: "Accepted", color: "bg-green-500/20 text-green-400" },
  rejected: { label: "Rejected", color: "bg-red-500/20 text-red-400" },
  countered: { label: "Countered", color: "bg-blue-500/20 text-blue-400" },
};

export function MerchantOffers() {
  const { merchantOffers } = useMission();

  if (merchantOffers.length === 0) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
        🏪 Merchant Offers
      </h3>

      <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
        <AnimatePresence>
          {merchantOffers.map((offer) => {
            const typeBadge = offerTypeBadge[offer.offerType] || offerTypeBadge.accept;
            const sBadge = statusBadge[offer.status] || statusBadge.pending;

            return (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 border-l-2 border-l-amber-500/50"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-foreground">
                    {offer.venueName}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${typeBadge.color}`}>
                      {typeBadge.label}
                    </span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${sBadge.color}`}>
                      {sBadge.label}
                    </span>
                  </div>
                </div>

                <p className="text-[11px] text-foreground/80 leading-relaxed mb-1.5">
                  {offer.merchantResponse}
                </p>

                {(offer.details.time || offer.details.discount || offer.details.promoCode || offer.details.note) && (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {offer.details.time && (
                      <span className="text-[9px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">
                        {offer.details.time}
                      </span>
                    )}
                    {offer.details.discount && (
                      <span className="text-[9px] font-mono text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded">
                        {offer.details.discount} off
                      </span>
                    )}
                    {offer.details.promoCode && (
                      <span className="text-[9px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                        Code: {offer.details.promoCode}
                      </span>
                    )}
                    {offer.details.note && (
                      <span className="text-[9px] font-mono text-muted-foreground">
                        {offer.details.note}
                      </span>
                    )}
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
