import { z } from "zod";

const requiredText = z.string().trim().min(1, "필수 입력입니다.");

export const appointmentIntakeSchema = z.object({
  elderName: requiredText,
  hospitalName: requiredText,
  department: requiredText,
  appointmentDate: requiredText,
  appointmentTime: requiredText,
  meetPlace: requiredText,
  pickupMethod: z.enum([
    "hospital_front_meet",
    "home_front_meet_taxi",
    "mobility_partner",
    "manager_vehicle_info_only",
    "direct_transport_partner"
  ]),
  mobilityNote: z.string().trim().optional(),
  guardianQuestions: z.string().trim().optional(),
  shareScopes: z.array(z.string()).default([]),
  vehiclePolicyAcknowledged: z.coerce.boolean().refine((value) => value, "차량/운송 분리 정책 확인이 필요합니다.")
});

export const managerApplicationSchema = z.object({
  displayName: requiredText,
  phone: requiredText,
  hasVehicle: z.coerce.boolean().default(false),
  directTransportAllowed: z.coerce.boolean().default(false),
  regions: requiredText,
  specialties: requiredText,
  careerSummary: requiredText,
  certificationSummary: z.string().trim().optional(),
  vehiclePolicyAcknowledged: z.coerce.boolean().refine((value) => value, "차량 보유와 직접 운송 분리 확인이 필요합니다.")
});

export const progressUpdateSchema = z.object({
  appointmentId: requiredText,
  status: z.enum(["arrived", "picked_up", "checked_in", "doctor_consult", "pharmacy", "completed", "exception"]),
  label: requiredText,
  description: z.string().trim().optional(),
  visibleToFamily: z.coerce.boolean().default(true)
});

export const reportDraftSchema = z.object({
  appointmentId: requiredText,
  visitSummary: requiredText,
  doctorInstructions: requiredText,
  testsAndResults: z.string().trim().optional(),
  medicationNote: z.string().trim().optional(),
  costNote: z.string().trim().optional(),
  parentCondition: requiredText,
  guardianNextActions: requiredText
});

export const ratingSchema = z.object({
  appointmentId: requiredText,
  managerId: requiredText,
  safetyRating: z.coerce.number().int().min(1).max(5),
  kindnessRating: z.coerce.number().int().min(1).max(5),
  accuracyRating: z.coerce.number().int().min(1).max(5),
  punctualityRating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().optional()
});

export const meetingCodeVerificationSchema = z.object({
  appointmentId: requiredText,
  meetingCode: z.string().trim().regex(/^\d{4,8}$/, "만남 암호는 4~8자리 숫자로 입력해 주세요."),
  locationLabel: z.string().trim().optional(),
  note: z.string().trim().optional()
});

export const safetyCheckpointCompletionSchema = z.object({
  appointmentId: requiredText,
  checkpointCode: z.enum([
    "pre_call",
    "handoff_code",
    "departure_confirmed",
    "hospital_checkin",
    "doctor_consult_update",
    "pharmacy_payment",
    "safe_return_close"
  ]),
  label: requiredText,
  note: z.string().trim().optional()
});
