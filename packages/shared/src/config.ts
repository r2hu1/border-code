import z from "zod";

export type ModeType = "PLAN" | "BUILD";
export const Mode: Record<ModeType, ModeType> = {
	BUILD: "BUILD",
	PLAN: "PLAN",
};
export const modeSchema = z.enum([Mode.BUILD, Mode.PLAN]);
