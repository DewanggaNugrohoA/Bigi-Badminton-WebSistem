import React from "react";
import { AwardBadge, BigiMemberBadge } from "@/components/ui/award-badge";

const demoLink = "https://www.producthunt.com/golden-kitty-awards/hall-of-fame?year=2024#bootstrapped-small-teams-2";

export const GoldenKitty = () => {
  return (
    <div className="grid grid-cols-1 gap-4">
      <AwardBadge type="golden-kitty" link={demoLink} />
    </div>
  );
};

export const ProductOfTheDay = () => {
  return (
    <div className="grid grid-cols-1 gap-4">
      <AwardBadge type="product-of-the-day" place={1} link={demoLink} />
    </div>
  );
};

export const ProductOfTheMonth = () => {
  return (
    <div className="grid grid-cols-1 gap-4">
      <AwardBadge type="product-of-the-month" place={2} link={demoLink} />
    </div>
  );
};

export const ProductOfTheWeek = () => {
  return (
    <div className="grid grid-cols-1 gap-4">
      <AwardBadge type="product-of-the-week" place={3} link={demoLink} />
    </div>
  );
};

export const BigiMemberDemo = () => {
  return (
    <div className="grid grid-cols-1 gap-4">
      <BigiMemberBadge />
    </div>
  );
};

export default function DemoBadges() {
  return (
    <div className="flex flex-wrap gap-6 p-6 items-center">
      <BigiMemberDemo />
      <GoldenKitty />
      <ProductOfTheDay />
      <ProductOfTheMonth />
      <ProductOfTheWeek />
    </div>
  );
}
