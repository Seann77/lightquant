import type { UserMembership } from "@/server/domain";
import { getBetaVipConfig } from "@/server/env";
import { getRepository } from "@/server/repositories";

const BETA_VIP_TYPE = "beta_vip";
const BETA_VIP_SOURCE_TYPE = "beta_registration";
const BETA_VIP_LABEL = "内测VIP";

export type MembershipProfile = {
  betaVip: {
    active: boolean;
    startsAt: string | null;
    endsAt: string | null;
    label: typeof BETA_VIP_LABEL;
  };
};

export type BetaVipEntitlement = {
  type: typeof BETA_VIP_TYPE;
  label: typeof BETA_VIP_LABEL;
  startsAt: string;
  endsAt: string;
};

export type AiTaskBilling = {
  nominalCostPoints: number;
  chargedPoints: number;
  waivedByMembership: boolean;
  membershipType: typeof BETA_VIP_TYPE | null;
  membershipLabel: typeof BETA_VIP_LABEL | null;
  membershipEndsAt: string | null;
};

export async function grantBetaVipForRegistration(userId: string, registeredAt: string) {
  const config = getBetaVipConfig();

  if (!config.enabled || !isAtOrBefore(registeredAt, config.registrationDeadline)) {
    return null;
  }

  return getRepository().upsertUserMembership({
    userId,
    type: BETA_VIP_TYPE,
    status: "active",
    startsAt: registeredAt,
    endsAt: config.registrationDeadline,
    sourceType: BETA_VIP_SOURCE_TYPE,
    sourceId: userId,
    createdAt: registeredAt,
    updatedAt: registeredAt
  });
}

export async function getMembershipProfileForUser(userId: string, at = new Date().toISOString()): Promise<MembershipProfile> {
  const config = getBetaVipConfig();
  const betaVip = config.enabled
    ? await getRepository().findActiveMembershipForUser(userId, BETA_VIP_TYPE, at)
    : null;

  return toMembershipProfile(betaVip);
}

function toMembershipProfile(betaVip: UserMembership | null): MembershipProfile {
  return {
    betaVip: {
      active: Boolean(betaVip),
      startsAt: betaVip?.startsAt ?? null,
      endsAt: betaVip?.endsAt ?? null,
      label: BETA_VIP_LABEL
    }
  };
}

export async function getActiveBetaVipForUserAt(userId: string, at: string): Promise<BetaVipEntitlement | null> {
  const config = getBetaVipConfig();

  if (!config.enabled) {
    return null;
  }

  const betaVip = await getRepository().findActiveMembershipForUser(userId, BETA_VIP_TYPE, at);

  return betaVip
    ? {
        type: BETA_VIP_TYPE,
        label: BETA_VIP_LABEL,
        startsAt: betaVip.startsAt,
        endsAt: betaVip.endsAt
      }
    : null;
}

export async function getAiTaskBillingForUserAt(input: {
  userId: string;
  costPoints: number;
  at: string;
}): Promise<AiTaskBilling> {
  const betaVip = await getActiveBetaVipForUserAt(input.userId, input.at);

  if (betaVip) {
    return {
      nominalCostPoints: input.costPoints,
      chargedPoints: 0,
      waivedByMembership: true,
      membershipType: betaVip.type,
      membershipLabel: betaVip.label,
      membershipEndsAt: betaVip.endsAt
    };
  }

  return {
    nominalCostPoints: input.costPoints,
    chargedPoints: input.costPoints,
    waivedByMembership: false,
    membershipType: null,
    membershipLabel: null,
    membershipEndsAt: null
  };
}

function isAtOrBefore(left: string, right: string) {
  return new Date(left).getTime() <= new Date(right).getTime();
}
